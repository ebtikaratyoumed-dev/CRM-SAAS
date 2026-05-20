'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createProject, updateProject } from '@/app/dashboard/projects/actions';
import { toast } from 'sonner';
import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const projectSchema = z.object({
  name: z.string().min(2, "Le nom du projet est trop court"),
  client_name: z.string().min(2, "Le nom du client est trop court"),
  location: z.string().min(2, "L'emplacement est trop court"),
  start_date: z.date({ error: "La date de début est requise" }),
  deadline: z.date({ error: "La date d'échéance est requise" }),
  status: z.enum(['Planification', 'En cours', 'En pause', 'Terminé']),
  estimated_cost: z.coerce.number().min(0, "Le coût ne peut être négatif"),
  estimated_profit: z.coerce.number().min(0, "Le profit ne peut être négatif"),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

import { usePathname, useRouter } from 'next/navigation';

interface ProjectFormProps {
  initialData?: any;
  onSuccess?: () => void;
}

export function ProjectForm({ initialData, onSuccess }: ProjectFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema) as any,
    defaultValues: initialData
      ? {
          ...initialData,
          start_date: new Date(initialData.start_date),
          deadline: new Date(initialData.deadline),
        }
      : {
          name: '',
          client_name: '',
          location: '',
          status: 'Planification',
          estimated_cost: 0,
          estimated_profit: 0,
        },
  });

  async function onSubmit(values: ProjectFormValues) {
    setLoading(true);
    try {
      const payload = {
        ...values,
        start_date: format(values.start_date, 'yyyy-MM-dd'),
        deadline: format(values.deadline, 'yyyy-MM-dd'),
      };

      if (initialData) {
        await updateProject(initialData.id, payload);
        toast.success('Projet mis à jour avec succès');
      } else {
        await createProject(payload);
        toast.success('Projet créé avec succès');
      }
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/dashboard/projects?tab=list');
        router.refresh();
      }
    } catch (error: any) {
      toast.error(error.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom du Projet</FormLabel>
              <FormControl>
                <Input placeholder="ex: Villa Gammarth" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="client_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom du Client</FormLabel>
              <FormControl>
                <Input placeholder="ex: Ahmed Ben Ali" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Emplacement</FormLabel>
              <FormControl>
                <Input placeholder="ex: Tunis, La Marsa" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date de début</FormLabel>
                <Popover>
                  <PopoverTrigger nativeButton={false} render={
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: fr })
                        ) : (
                          <span>Choisir une date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  } />
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date("1900-01-01")
                      }
                      initialFocus
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="deadline"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Échéance</FormLabel>
                <Popover>
                  <PopoverTrigger nativeButton={false} render={
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: fr })
                        ) : (
                          <span>Choisir une date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  } />
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < (form.getValues('start_date') || new Date())
                      }
                      initialFocus
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Statut</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un statut" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Planification">Planification</SelectItem>
                  <SelectItem value="En cours">En cours</SelectItem>
                  <SelectItem value="En pause">En pause</SelectItem>
                  <SelectItem value="Terminé">Terminé</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="estimated_cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Coût Estimé</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="estimated_profit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Profit Estimé</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button disabled={loading} type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? 'Mettre à jour' : 'Créer le Projet'}
        </Button>
      </form>
    </Form>
  );
}
