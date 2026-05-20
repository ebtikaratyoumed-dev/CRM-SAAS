import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import NewIncomingInvoiceClient from '../../new/new-incoming-invoice-client';

export default async function EditIncomingInvoicePage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Auth guard
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/auth/login');
  }

  // Fetch projects for the dropdown
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .order('name');

  // Fetch invoice to edit
  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !invoice) {
    notFound();
  }

  return (
    <div className="flex-1 space-y-4">
      <NewIncomingInvoiceClient 
        projects={projects || []} 
        initialData={invoice} 
      />
    </div>
  );
}
