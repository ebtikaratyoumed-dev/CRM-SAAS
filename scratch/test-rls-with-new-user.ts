import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rhxykwhmqgipukobknfo.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoeHlrd2htcWdpcHVrb2JrbmZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTEzODExNSwiZXhwIjoyMDkwNzE0MTE1fQ.tUC8lpTgoeZHbEUoNqwoWDsuvcze3XWa2bvOs3I7Cd4';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoeHlrd2htcWdpcHVrb2JrbmZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMzgxMTUsImV4cCI6MjA5MDcxNDExNX0.UgbNip3bmSmclxMYEGlZFuy7Wj9PMKvowp3QGPruL0A';

async function main() {
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  const email = `testadmin_${Date.now()}@example.com`;
  const password = 'TestPassword123!';
  
  console.log(`Creating test admin user: ${email}...`);
  const { data: userData, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: 'Test Admin User',
      role: 'admin'
    }
  });
  
  if (createError) {
    console.error('Error creating user:', createError);
    return;
  }
  
  const userId = userData.user.id;
  console.log(`User created. ID: ${userId}`);
  
  try {
    // Wait 2 seconds for trigger to execute and index profile
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Now create a normal client and login
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    console.log('Signing in...');
    const { data: authData, error: signInError } = await userClient.auth.signInWithPassword({
      email,
      password
    });
    
    if (signInError) {
      console.error('Error signing in:', signInError);
      return;
    }
    
    console.log('Signed in successfully! Session user ID:', authData.user.id);
    
    console.log('Querying profile using user client...');
    const { data: profile, error: profileError } = await userClient
      .from('profiles')
      .select('id, role, full_name, company_id')
      .eq('id', authData.user.id)
      .single();
      
    if (profileError) {
      console.error('Error fetching profile:', profileError);
    } else {
      console.log('Profile fetched successfully:', profile);
    }
  } finally {
    // Clean up
    console.log(`Deleting test user ${userId}...`);
    await adminClient.auth.admin.deleteUser(userId);
    console.log('Done cleaning up.');
  }
}

main().catch(console.error);
