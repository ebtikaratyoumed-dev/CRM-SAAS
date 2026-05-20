'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createOutgoingInvoice(formData: {
  invoice_number: string;
  project_id: string;
  client_name: string;
  client_address: string;
  client_email: string;
  line_items: any[];
  tax_percentage: number;
  subtotal: number;
  tax_amount: number;
  total: number;
  notes: string;
  due_date: string;
  company_name?: string;
  company_address?: string;
  company_tax_number?: string;
  company_email?: string;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Non authentifié');
  }

  const { error } = await supabase.from('invoices_outgoing').insert({
    ...formData,
    created_by: user.id,
    status: 'Brouillon',
  });

  if (error) {
    console.error('Erreur creation facture:', error);
    throw new Error('Impossible de créer la facture');
  }

  revalidatePath('/dashboard/invoices-outgoing');
  revalidatePath('/dashboard/invoices');
  return { success: true };
}

export async function updateOutgoingInvoiceStatus(id: string, status: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const { error } = await supabase
    .from('invoices_outgoing')
    .update({ status })
    .eq('id', id);

  if (error) throw new Error('Impossible de mettre à jour le statut');

  revalidatePath('/dashboard/invoices');
  revalidatePath('/dashboard/invoices-outgoing');
  return { success: true };
}

export async function deleteOutgoingInvoice(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const { error } = await supabase
    .from('invoices_outgoing')
    .delete()
    .eq('id', id);

  if (error) throw new Error('Impossible de supprimer la facture');

  revalidatePath('/dashboard/invoices');
  revalidatePath('/dashboard/invoices-outgoing');
  return { success: true };
}
