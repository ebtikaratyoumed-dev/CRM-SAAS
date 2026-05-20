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
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createUser } from '@/app/dashboard/users/actions';
import { toast } from 'sonner';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

const userSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  full_name: z.string().min(2, "Le nom est trop court"),
  role: z.enum(['admin', 'engineer', 'worker']),
  password: z.string().optional(),
});

type UserFormValues = z.infer<typeof userSchema>;

interface UserFormProps {
  redirectUrl?: string;
  onSuccess?: () => void;
  initialData?: {
    id: string;
    email?: string;
    full_name: string;
    role: 'admin' | 'engineer' | 'worker';
  };
}

import { useRouter } from 'next/navigation';
import { updateUser } from '@/app/dashboard/users/actions';

export function UserForm({ redirectUrl, initialData, onSuccess }: UserFormProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: initialData ? {
      email: initialData.email || '',
      full_name: initialData.full_name,
      role: initialData.role,
      password: '',
    } : {
      email: '',
      full_name: '',
      role: 'worker',
      password: '',
    },
  });

  async function onSubmit(values: UserFormValues) {
    if (values.password && values.password.length > 0 && values.password.length < 6) {
      form.setError('password', { message: "Le mot de passe doit contenir au moins 6 caractères" });
      return;
    }

    setLoading(true);
    try {
      if (initialData) {
        const response = await updateUser(initialData.id, values);
        if (response.success) {
          toast.success(`Utilisateur ${values.full_name} mis à jour avec succès.`);
          if (onSuccess) {
            onSuccess();
          } else if (redirectUrl) {
            router.push(redirectUrl);
            router.refresh();
          }
        }
      } else {
        const response = await createUser(values);
        if (response.success) {
          toast.success(`Utilisateur ${values.full_name} créé avec succès.`);
          if (redirectUrl) {
            router.push(redirectUrl);
            router.refresh();
          } else {
            router.push('/dashboard/users?tab=list');
            router.refresh();
          }
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom Complet</FormLabel>
              <FormControl>
                <Input placeholder="ex: Ahmed Ben Ali" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Adresse Email</FormLabel>
              <FormControl>
                <Input placeholder="ex: ahmed@corex.tn" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rôle</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-slate-950 border-slate-800">
                    <SelectValue placeholder="Sélectionnez un rôle" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-slate-950 border-slate-800">
                  <SelectItem value="admin">Administrateur</SelectItem>
                  <SelectItem value="engineer">Ingénieur / Architecte</SelectItem>
                  <SelectItem value="worker">Ouvrier / Chef de chantier</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mot de passe</FormLabel>
              <FormControl>
                <Input type="password" placeholder={initialData ? "Laisser vide pour ne pas changer" : "Mot de passe du compte"} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {initialData && (
          <div className="pt-2 text-xs text-slate-500 italic">
            Note: Ne remplissez l'email et le mot de passe que si vous souhaitez les modifier.
          </div>
        )}
        <Button
          disabled={loading}
          type="submit"
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 mt-4 h-11"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? "Mettre à jour" : "Ajouter au CRM"}
        </Button>
      </form>
    </Form>
  );
}
