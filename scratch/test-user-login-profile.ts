import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rhxykwhmqgipukobknfo.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoeHlrd2htcWdpcHVrb2JrbmZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTEzODExNSwiZXhwIjoyMDkwNzE0MTE1fQ.tUC8lpTgoeZHbEUoNqwoWDsuvcze3XWa2bvOs3I7Cd4';

async function main() {
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  const testEmail = 'ebtikaratyoumed@gmail.com';
  const testPassword = 'TemporaryPassword123!';
  const userId = 'a16e4ae6-76ef-47fe-af27-9402815828c1';
  
  console.log(`Updating password for ${testEmail}...`);
  const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, {
    password: testPassword
  });
  
  if (updateError) {
    console.error('Error updating password:', updateError);
    return;
  }
  
  console.log('Password updated successfully.');
  
  // Now create a normal client and login
  const userClient = createClient(SUPABASE_URL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoeHlrd2htcWdpcHVrb2JrbmZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMzgxMTUsImV4cCI6MjA5MDcxNDExNX0.UgbNip3bmSmclxMYEGlZFuy7Wj9PMKvowp3QGPruL0A');
  
  console.log('Signing in...');
  const { data: authData, error: signInError } = await userClient.auth.signInWithPassword({
    email: testEmail,
    password: testPassword
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
}

main().catch(console.error);
