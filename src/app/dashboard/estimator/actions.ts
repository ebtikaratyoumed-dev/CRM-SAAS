'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// ─── Estimation Sheets ────────────────────────────────────────────────────────

export async function getAllEstimationSheets() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const { data, error } = await supabase
    .from('estimation_sheets')
    .select(`
      *,
      project:projects(id, name),
      estimation_items(total_price)
    `)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getEstimationSheet(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const { data, error } = await supabase
    .from('estimation_sheets')
    .select(`
      *,
      project:projects(id, name),
      estimation_items(*)
    `)
    .eq('id', id)
    .order('sort_order', { referencedTable: 'estimation_items', ascending: true })
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function createEstimationSheet(formData: {
  project_id: string;
  title: string;
  notes?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const { data, error } = await supabase
    .from('estimation_sheets')
    .insert({ ...formData, created_by: user.id })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath('/dashboard/estimator');
  return { success: true, data };
}

export async function updateEstimationSheet(
  id: string,
  formData: { title?: string; notes?: string; status?: string }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const { error } = await supabase
    .from('estimation_sheets')
    .update(formData)
    .eq('id', id);

  if (error) throw new Error(error.message);

  revalidatePath('/dashboard/estimator');
  revalidatePath(`/dashboard/estimator/${id}`);
  return { success: true };
}

export async function deleteEstimationSheet(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const { error } = await supabase
    .from('estimation_sheets')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);

  revalidatePath('/dashboard/estimator');
  return { success: true };
}

// ─── Estimation Items ─────────────────────────────────────────────────────────

export async function addEstimationItem(formData: {
  sheet_id: string;
  material_name: string;
  category?: string;
  unit: string;
  quantity: number;
  unit_price: number;
  notes?: string;
  sort_order?: number;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const { data, error } = await supabase
    .from('estimation_items')
    .insert(formData)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/estimator/${formData.sheet_id}`);
  return { success: true, data };
}

export async function updateEstimationItem(
  id: string,
  sheetId: string,
  formData: {
    material_name?: string;
    category?: string;
    unit?: string;
    quantity?: number;
    unit_price?: number;
    notes?: string;
    sort_order?: number;
  }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const { error } = await supabase
    .from('estimation_items')
    .update(formData)
    .eq('id', id);

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/estimator/${sheetId}`);
  return { success: true };
}

export async function deleteEstimationItem(id: string, sheetId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const { error } = await supabase
    .from('estimation_items')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/estimator/${sheetId}`);
  return { success: true };
}

export async function createSmartEstimation(formData: {
  project_id: string;
  title: string;
  notes?: string;
  categories: string[];
  input_data: any;
  items: {
    material_name: string;
    category: string;
    unit: string;
    quantity: number;
    unit_price: number;
    notes?: string;
  }[];
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  // Insert the sheet
  const { data: sheet, error: sheetError } = await supabase
    .from('estimation_sheets')
    .insert({
      project_id: formData.project_id,
      title: formData.title,
      notes: formData.notes,
      categories: formData.categories,
      input_data: formData.input_data,
      created_by: user.id,
      status: 'Brouillon'
    })
    .select()
    .single();

  if (sheetError) throw new Error(sheetError.message);

  // Insert all the line items
  const itemsToInsert = formData.items.map((item, idx) => ({
    sheet_id: sheet.id,
    material_name: item.material_name,
    category: item.category,
    unit: item.unit,
    quantity: item.quantity,
    unit_price: item.unit_price,
    notes: item.notes,
    sort_order: idx
  }));

  const { error: itemsError } = await supabase
    .from('estimation_items')
    .insert(itemsToInsert);

  if (itemsError) {
    // If items fail, clean up the sheet
    await supabase.from('estimation_sheets').delete().eq('id', sheet.id);
    throw new Error(itemsError.message);
  }

  revalidatePath('/dashboard/estimator');
  return { success: true, data: sheet };
}
