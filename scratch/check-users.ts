import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rhxykwhmqgipukobknfo.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoeHlrd2htcWdpcHVrb2JrbmZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTEzODExNSwiZXhwIjoyMDkwNzE0MTE1fQ.tUC8lpTgoeZHbEUoNqwoWDsuvcze3XWa2bvOs3I7Cd4';

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  console.log('Fetching auth users...');
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error('Error fetching auth users:', authError);
    return;
  }
  
  console.log(`Found ${users.length} auth users:`);
  for (const u of users) {
    console.log(`- ID: ${u.id}, Email: ${u.email}, Meta:`, u.raw_user_meta_data);
  }

  console.log('\nFetching profiles...');
  const { data: profiles, error: profileError } = await supabase.from('profiles').select('*');
  if (profileError) {
    console.error('Error fetching profiles:', profileError);
    return;
  }

  console.log(`Found ${profiles.length} profiles:`);
  for (const p of profiles) {
    console.log(`- ID: ${p.id}, Role: ${p.role}, Name: ${p.full_name}, Email: ${p.email}, AdminOwner: ${p.admin_owner_id}`);
  }
}

main().catch(console.error);
