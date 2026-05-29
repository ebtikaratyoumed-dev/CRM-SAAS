import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function main() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
    console.error('Make sure your .env.local file is configured correctly.');
    process.exit(1);
  }

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
