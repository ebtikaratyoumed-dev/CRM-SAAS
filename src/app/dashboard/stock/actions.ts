'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getAllStockItems() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Non authentifié");
  }

  const { data, error } = await supabase
    .from('stock_items')
    .select('*, project:projects(name), invoice:invoices(invoice_number, vendor_name)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erreur lors de la récupération du stock:', error);
    return [];
  }

  return data;
}

export async function getStockItemsByProject(projectId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Non authentifié');
  }

  const { data, error } = await supabase
    .from('stock_items')
    .select('*, invoice:invoices(invoice_number, vendor_name)')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erreur lors de la récupération du stock pour le projet:', error);
    return [];
  }

  return data;
}

export async function addStockItem(formData: {
  project_id: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  invoice_id?: string | null;
  alert_threshold?: number | null;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Non authentifié');
  }

  const { data, error } = await supabase
    .from('stock_items')
    .insert({
      ...formData,
      created_by: user.id
    })
    .select();

  if (error) {
    console.error("Erreur lors de l'ajout au stock:", error);
    throw new Error(`Impossible d'ajouter au stock: ${error.message} (${error.code})`);
  }

  revalidatePath('/dashboard/projects/[id]', 'page');
  revalidatePath('/dashboard/stock');
  
  return { success: true, data };
}

export async function updateStockItemQuantity(id: string, quantity: number) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Non authentifié');
  }

  const { data, error } = await supabase
    .from('stock_items')
    .update({ quantity })
    .eq('id', id)
    .select();

  if (error) {
    console.error("Erreur lors de la mise à jour de la quantité:", error);
    throw new Error("Impossible de mettre à jour la quantité");
  }

  revalidatePath('/dashboard/projects/[id]', 'page');
  revalidatePath('/dashboard/stock');
  
  return { success: true, data };
}

export async function deleteStockItem(id: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Non authentifié');
  }

  const { error } = await supabase
    .from('stock_items')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("Erreur lors de la suppression de l'élément du stock:", error);
    throw new Error("Impossible de supprimer l'élément du stock");
  }

  revalidatePath('/dashboard/projects/[id]', 'page');
  revalidatePath('/dashboard/stock');
  
  return { success: true };
}

export async function updateStockItem(
  id: string,
  formData: {
    project_id: string;
    name: string;
    description?: string;
    quantity: number;
    unit: string;
    invoice_id?: string | null;
    alert_threshold?: number | null;
  }
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Non authentifié');
  }

  const { data, error } = await supabase
    .from('stock_items')
    .update({
      ...formData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select();

  if (error) {
    console.error("Erreur lors de la mise à jour du stock:", error);
    throw new Error(`Impossible de mettre à jour le stock: ${error.message} (${error.code})`);
  }

  revalidatePath('/dashboard/projects/[id]', 'page');
  revalidatePath('/dashboard/stock');
  
  return { success: true, data };
}

