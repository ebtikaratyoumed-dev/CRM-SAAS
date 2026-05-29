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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createTask } from '@/app/dashboard/tasks/actions';
import { toast } from 'sonner';
import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useDashboardCache } from '@/context/dashboard-cache';

const taskSchema = z.object({
  title: z.string().min(2, "Le titre est trop court"),
  description: z.string().optional(),
  project_id: z.string({ error: "Le projet est requis" }),
  assigned_to: z.string({ error: "L'assignation est requise" }),
  priority: z.enum(['faible', 'moyenne', 'haute']),
  due_date: z.date({ error: "La date d'échéance est requise" }),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface TaskFormProps {
  projects: any[];
  members: any[];
  onSuccess?: () => void;
  redirectUrl?: string;
}

export function TaskForm({ projects, members, onSuccess, redirectUrl }: TaskFormProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { refreshData } = useDashboardCache();

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema) as any,
    defaultValues: {
      title: '',
      description: '',
      priority: 'moyenne',
    },
  });

  async function onSubmit(values: TaskFormValues) {
    setLoading(true);
    try {
      const payload = {
        ...values,
        due_date: format(values.due_date, 'yyyy-MM-dd'),
      };

      await createTask(payload as any);
      toast.success('Tâche créée avec succès');
      await refreshData();
      if (onSuccess) onSuccess();
      if (redirectUrl) router.push(redirectUrl);
    } catch (error: any) {
      toast.error(error.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Titre de la tâche</FormLabel>
              <FormControl>
                <Input placeholder="ex: Couler la dalle" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Détails de la tâche..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
           <FormField
            control={form.control}
            name="project_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Projet</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-slate-950 border-slate-800">
                      <SelectValue placeholder="Choisir..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-slate-950 border-slate-800">
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="assigned_to"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assigner à</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-slate-950 border-slate-800">
                      <SelectValue placeholder="Choisir..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-slate-950 border-slate-800">
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
           <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priorité</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-slate-950 border-slate-800">
                      <SelectValue placeholder="Priorité" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-slate-950 border-slate-800">
                    <SelectItem value="faible">Faible</SelectItem>
                    <SelectItem value="moyenne">Moyenne</SelectItem>
                    <SelectItem value="haute">Haute</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="due_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Échéance</FormLabel>
                <Popover>
                  <PopoverTrigger nativeButton={false} render={
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal bg-slate-950 border-slate-800",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: fr })
                        ) : (
                          <span>Choisir...</span>
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
                        date < new Date()
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

        <Button disabled={loading} type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Assigner la Tâche
        </Button>
      </form>
    </Form>
  );
}
