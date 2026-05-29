'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createProject(formData: {
  name: string;
  client_name: string;
  location: string;
  start_date: string;
  end_date: string;
  status: 'Planification' | 'En cours' | 'En pause' | 'Terminé';
  estimated_cost: number;
  estimated_profit: number;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Non authentifié');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    throw new Error('Seuls les administrateurs peuvent créer des projets');
  }

  const { end_date, ...rest } = formData;
  const { error } = await supabase.from('projects').insert({
    ...rest,
    deadline: end_date,
    created_by: user.id,
  });

  if (error) {
    console.error('Erreur lors de la création du projet:', error);
    throw new Error('Impossible de créer le projet');
  }

  revalidatePath('/dashboard/projects');
  return { success: true };
}

export async function updateProject(
  id: string,
  formData: {
    name: string;
    client_name: string;
    location: string;
    start_date: string;
    end_date: string;
    status: 'Planification' | 'En cours' | 'En pause' | 'Terminé';
    estimated_cost: number;
    estimated_profit: number;
  }
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Non authentifié');
  }

  const { end_date, ...rest } = formData;
  const { error } = await supabase
    .from('projects')
    .update({
      ...rest,
      deadline: end_date
    })
    .eq('id', id);

  if (error) {
    console.error('Erreur lors de la mise à jour du projet:', error);
    throw new Error('Impossible de mettre à jour le projet');
  }

  revalidatePath('/dashboard/projects');
  return { success: true };
}

export async function deleteProject(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from('projects').delete().eq('id', id);

  if (error) {
    console.error('Erreur lors de la suppression du projet:', error);
    throw new Error('Impossible de supprimer le projet');
  }

  revalidatePath('/dashboard/projects');
  return { success: true };
}
