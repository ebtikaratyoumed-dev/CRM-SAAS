'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createTask(formData: {
  title: string;
  description: string;
  project_id: string;
  assigned_to: string;
  priority: 'faible' | 'moyenne' | 'haute';
  due_date: string;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Non authentifié');
  }

  const { error } = await supabase.from('tasks').insert({
    ...formData,
    created_by: user.id,
    status: 'À faire',
  });

  if (error) {
    console.error('Erreur lors de la création de la tâche:', error);
    throw new Error('Impossible de créer la tâche');
  }

  revalidatePath('/dashboard/tasks');
  revalidatePath(`/dashboard/projects/${formData.project_id}`);
  return { success: true };
}

export async function updateTaskStatus(id: string, status: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('tasks')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    console.error("Update task error:", error);
    throw new Error('Impossible de mettre à jour le statut, vérifiez vos permissions');
  }

  revalidatePath('/dashboard/tasks');
  return { success: true };
}

export async function deleteTask(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from('tasks').delete().eq('id', id);

  if (error) {
    throw new Error('Impossible de supprimer la tâche');
  }

  revalidatePath('/dashboard/tasks');
  return { success: true };
}
