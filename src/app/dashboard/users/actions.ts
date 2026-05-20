'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { createClient as createAdminClient } from '@supabase/supabase-js';

// WARNING: This requires SUPABASE_SERVICE_ROLE_KEY to be set in environment variables
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

export async function createUser(formData: {
  email: string;
  full_name: string;
  role: 'admin' | 'engineer' | 'worker';
  password?: string;
}) {
  const supabase = await createClient();

  // 1. Check if the current user is an admin
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  if (!currentUser) {
    throw new Error('Non authentifié');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', currentUser.id)
    .single();

  if (profile?.role !== 'admin') {
    throw new Error('Seuls les administrateurs peuvent ajouter des utilisateurs');
  }

  if (!serviceRoleKey || !supabaseUrl) {
    throw new Error('Configuration manquante: SUPABASE_SERVICE_ROLE_KEY non définie. Veuillez l\'ajouter à votre fichier .env');
  }

  // 2. Create the user with the service role key (admin bypass)
  const adminSupabase = createAdminClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: newUser, error: authError } = await adminSupabase.auth.admin.createUser({
    email: formData.email,
    password: formData.password || Math.random().toString(36).slice(-10),
    user_metadata: {
      full_name: formData.full_name,
      role: formData.role,
      created_by: currentUser.id,
    },
    email_confirm: true,
  });

  if (authError) {
    console.error('Erreur Auth Admin:', authError);
    throw new Error(authError.message);
  }

  // Note: The profile will be created by the on_auth_user_created trigger

  revalidatePath('/dashboard/users');
  return { success: true };
}

export async function deleteUser(id: string) {
  const supabase = await createClient();

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  if (!currentUser) throw new Error('Non authentifié');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', currentUser.id)
    .single();

  if (profile?.role !== 'admin') {
    throw new Error('Seuls les administrateurs peuvent supprimer des utilisateurs');
  }

  if (id === currentUser.id) {
    throw new Error('Vous ne pouvez pas supprimer votre propre compte');
  }

  // Fetch target user to check creator
  const { data: targetProfile, error: fetchError } = await supabase
    .from('profiles')
    .select('created_by')
    .eq('id', id)
    .single();

  if (fetchError || !targetProfile) {
    throw new Error('Utilisateur non trouvé');
  }

  if (targetProfile.created_by !== currentUser.id) {
    throw new Error("Vous n'avez pas la permission de supprimer cet utilisateur");
  }

  if (!serviceRoleKey || !supabaseUrl) {
    throw new Error('Configuration manquante: SUPABASE_SERVICE_ROLE_KEY non définie');
  }

  const adminSupabase = createAdminClient(supabaseUrl, serviceRoleKey);
  const { error } = await adminSupabase.auth.admin.deleteUser(id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/dashboard/users');
  return { success: true };
}

export async function updateUser(id: string, formData: {
  email: string;
  full_name: string;
  role: 'admin' | 'engineer' | 'worker';
  password?: string;
}) {
  const supabase = await createClient();

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  if (!currentUser) throw new Error('Non authentifié');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', currentUser.id)
    .single();

  if (profile?.role !== 'admin') {
    throw new Error('Seuls les administrateurs peuvent modifier des utilisateurs');
  }

  // Verify target user ownership (can only modify users they created or themselves)
  const { data: targetProfile, error: fetchError } = await supabase
    .from('profiles')
    .select('created_by')
    .eq('id', id)
    .single();

  if (fetchError || !targetProfile) {
    throw new Error('Utilisateur non trouvé');
  }

  if (targetProfile.created_by !== currentUser.id && id !== currentUser.id) {
    throw new Error("Vous n'avez pas la permission de modifier cet utilisateur");
  }

  if (!serviceRoleKey || !supabaseUrl) {
    throw new Error('Configuration manquante: SUPABASE_SERVICE_ROLE_KEY non définie.');
  }

  const adminSupabase = createAdminClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  
  // Update Auth layer if needed (password or email)
  const authUpdatePayload: any = {};
  if (formData.email) authUpdatePayload.email = formData.email;
  if (formData.password) authUpdatePayload.password = formData.password;
  if (formData.full_name || formData.role) {
    authUpdatePayload.user_metadata = {
       full_name: formData.full_name,
       role: formData.role
    };
  }

  const { error: authError } = await adminSupabase.auth.admin.updateUserById(id, authUpdatePayload);

  if (authError) {
    console.error('Erreur Auth Admin (Update):', authError);
    throw new Error(authError.message);
  }

  // Update Profile layer
  const { error: profileError } = await adminSupabase
    .from('profiles')
    .update({
      full_name: formData.full_name,
      role: formData.role
    })
    .eq('id', id);

  if (profileError) {
    throw new Error(profileError.message);
  }

  revalidatePath('/dashboard/users');
  return { success: true };
}
