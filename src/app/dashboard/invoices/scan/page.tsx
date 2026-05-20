import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import InvoiceScanClient from './invoice-scan-client';

export default async function InvoiceScanPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch Projects to associate with invoices
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name')
    .order('name');

  return <InvoiceScanClient projects={projects || []} />;
}
