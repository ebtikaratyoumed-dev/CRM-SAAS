import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import NewIncomingInvoiceClient from './new-incoming-invoice-client';

export default async function NewIncomingInvoicePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch Projects for the dropdown
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name')
    .order('name');

  return <NewIncomingInvoiceClient projects={projects || []} />;
}
