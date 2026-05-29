import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rhxykwhmqgipukobknfo.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoeHlrd2htcWdpcHVrb2JrbmZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTEzODExNSwiZXhwIjoyMDkwNzE0MTE1fQ.tUC8lpTgoeZHbEUoNqwoWDsuvcze3XWa2bvOs3I7Cd4';

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  // Choose one admin ID to test
  const adminId = '58edf6cc-c1e9-42ce-b64f-51ec179add81'; // stve
  
  const sql = `
    BEGIN;
    -- Impersonate user
    SELECT set_config('request.jwt.claim.sub', '${adminId}', true);
    SELECT set_config('request.jwt.claim.role', 'authenticated', true);
    
    -- Try executing the profile select
    SELECT * FROM profiles WHERE id = '${adminId}';
    COMMIT;
  `;

  // We can do this in a single query by running a custom PL/pgSQL block using exec_sql if it exists
  const plpgsql = `
    DO $$
    DECLARE
      v_profile RECORD;
    BEGIN
      -- Impersonate
      PERFORM set_config('request.jwt.claim.sub', '${adminId}', false);
      PERFORM set_config('request.jwt.claim.role', 'authenticated', false);
      
      -- Test get_my_admin_owner_id
      RAISE NOTICE 'get_my_admin_owner_id() = %', get_my_admin_owner_id();
      
      -- Test query
      SELECT * INTO v_profile FROM profiles WHERE id = '${adminId}';
      RAISE NOTICE 'Found profile: ID=%, Role=%, Name=%', v_profile.id, v_profile.role, v_profile.full_name;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error occurred: % (%)', SQLERRM, SQLSTATE;
    END;
    $$;
  `;

  console.log('Running test block...');
  
  // Note: we can use a simpler RPC if exec_sql is available. Let's see if we can define exec_sql or if it exists.
  // Wait, let's create a temporary RPC to run this or use Postgres anonymous block via exec_sql.
  const { data, error } = await supabase.rpc('exec_sql', { sql_string: plpgsql });
  if (error) {
    console.error('Error running RPC:', error);
  } else {
    console.log('Result:', data);
  }
}

main().catch(console.error);
