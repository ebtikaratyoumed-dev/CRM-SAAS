'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';


export async function createManualIncomingInvoice(formData: {
  project_id: string | null;
  vendor_name: string;
  invoice_number: string;
  invoice_date: string;
  total_amount: number;
  tax: number;
  line_items: any;
  company_name?: string;
  company_address?: string;
  vendor_tax_number?: string;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Non authentifié');
  }

  const { data, error } = await supabase.from('invoices').insert({
    ...formData,
    uploaded_by: user.id,
    status: 'Validée',
  }).select();

  if (error) {
    console.error('Erreur lors de la création manuelle de la facture fournisseur:', error);
    throw new Error('Impossible de créer la facture');
  }

  revalidatePath('/dashboard/invoices');
  return { success: true, data };
}

export async function updateIncomingInvoice(id: string, formData: {
  project_id: string | null;
  vendor_name: string;
  invoice_number: string;
  invoice_date: string;
  total_amount: number;
  tax: number;
  line_items: any;
  company_name?: string;
  company_address?: string;
  vendor_tax_number?: string;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Non authentifié');
  }

  const { data, error } = await supabase
    .from('invoices')
    .update({
      ...formData,
      status: 'Validée',
    })
    .eq('id', id)
    .select();

  if (error) {
    console.error('Erreur lors de la mise à jour de la facture:', error);
    throw new Error('Impossible de mettre à jour la facture');
  }

  revalidatePath('/dashboard/invoices');
  return { success: true, data };
}

export async function deleteIncomingInvoice(id: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Non authentifié');
  }

  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erreur lors de la suppression de la facture:', error);
    throw new Error('Impossible de supprimer la facture');
  }

  revalidatePath('/dashboard/invoices');
  return { success: true };
}
