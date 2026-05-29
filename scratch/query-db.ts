import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rhxykwhmqgipukobknfo.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoeHlrd2htcWdpcHVrb2JrbmZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTEzODExNSwiZXhwIjoyMDkwNzE0MTE1fQ.tUC8lpTgoeZHbEUoNqwoWDsuvcze3XWa2bvOs3I7Cd4';

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  console.log('Fetching projects via Service Role...');
  const { data: projects, error: pError } = await supabase
    .from('projects')
    .select('*');

  if (pError) {
    console.error('Error fetching projects:', pError);
  } else {
    console.log(`Found ${projects?.length} projects:`);
    console.dir(projects, { depth: null });
  }

  console.log('\nFetching profiles...');
  const { data: profiles, error: prError } = await supabase
    .from('profiles')
    .select('*');

  if (prError) {
    console.error('Error fetching profiles:', prError);
  } else {
    console.log(`Found ${profiles?.length} profiles:`);
    console.dir(profiles, { depth: null });
  }
}

main().catch(console.error);
