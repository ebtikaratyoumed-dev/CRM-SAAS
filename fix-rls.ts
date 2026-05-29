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

  console.log('Fixing tasks RLS policies...');

  const sql = `
    -- Drop existing policies if any
    DROP POLICY IF EXISTS "Admins can view their own tasks" ON tasks;
    DROP POLICY IF EXISTS "Admins can insert tasks" ON tasks;
    DROP POLICY IF EXISTS "Admins can update their tasks" ON tasks;
    DROP POLICY IF EXISTS "Admins can delete their tasks" ON tasks;
    
    DROP POLICY IF EXISTS "Users can view tasks assigned to them" ON tasks;
    DROP POLICY IF EXISTS "Users can update their assigned tasks" ON tasks;
    
    -- Creating comprehensive policies
    
    -- Admins: full CRUD for tasks they created
    CREATE POLICY "Admins full access on their tasks" ON tasks
    FOR ALL
    USING (created_by = auth.uid() OR auth.jwt() ->> 'role' = 'service_role');
    
    -- Users: view tasks assigned to them
    CREATE POLICY "Users can view assigned tasks" ON tasks
    FOR SELECT
    USING (assigned_to = auth.uid());
    
    -- Users: update tasks assigned to them
    CREATE POLICY "Users can update assigned tasks" ON tasks
    FOR UPDATE
    USING (assigned_to = auth.uid());
  `;

  const { error } = await supabase.rpc('exec_sql', { sql_string: sql });

  if (error) {
    console.error('Failed using exec_sql, trying raw SQL execution...', error);
    
    // We can't run RAW sql natively without a special RPC or REST endpoint.
    // Let's create an RPC manually if it doesn't exist? Only pg allows that.
    console.log('To run this SQL without RPC, you must apply it via Supabase Dashboard SQL Editor.');
    console.log(sql);
  } else {
    console.log('Success! Policies updated.');
  }
}

main().catch(console.error);
