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

  // Fetch creator's full profile including admin_owner_id
  const { data: creatorProfile } = await supabase
    .from('profiles')
    .select('role, admin_owner_id')
    .eq('id', currentUser.id)
    .single();

  if (creatorProfile?.role !== 'admin') {
    throw new Error('Seuls les administrateurs peuvent ajouter des utilisateurs');
  }

  if (!serviceRoleKey || !supabaseUrl) {
    throw new Error('Configuration manquante: SUPABASE_SERVICE_ROLE_KEY non définie. Veuillez l\'ajouter à votre fichier .env');
  }

  // The new user inherits the company scope from the creator.
  // If the creator is a root admin, their admin_owner_id = their own id.
  const adminOwnerId = creatorProfile.admin_owner_id ?? currentUser.id;

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
      admin_owner_id: adminOwnerId,
    },
    email_confirm: true,
  });

  if (authError) {
    console.error('Erreur Auth Admin:', authError);
    throw new Error(authError.message);
  }

  if (!newUser?.user) {
    throw new Error('Erreur lors de la création du compte');
  }

  // Upsert the profile with created_by AND admin_owner_id.
  // This ensures the new user can see all company data on first login.
  const { error: profileError } = await adminSupabase
    .from('profiles')
    .upsert({
      id: newUser.user.id,
      full_name: formData.full_name,
      role: formData.role,
      created_by: currentUser.id,
      admin_owner_id: adminOwnerId,
    }, { onConflict: 'id' });

  if (profileError) {
    console.error('Erreur mise à jour profil:', profileError);
    // Non-fatal: log it but don't block user creation
  }

  revalidatePath('/dashboard/users');
  return { success: true };
}

export async function deleteUser(id: string) {
  const supabase = await createClient();

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  if (!currentUser) throw new Error('Non authentifié');

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role, admin_owner_id')
    .eq('id', currentUser.id)
    .single();

  if (adminProfile?.role !== 'admin') {
    throw new Error('Seuls les administrateurs peuvent supprimer des utilisateurs');
  }

  if (id === currentUser.id) {
    throw new Error('Vous ne pouvez pas supprimer votre propre compte');
  }

  // Fetch target user's company scope
  const { data: targetProfile, error: fetchError } = await supabase
    .from('profiles')
    .select('admin_owner_id, created_by')
    .eq('id', id)
    .single();

  if (fetchError || !targetProfile) {
    throw new Error('Utilisateur non trouvé');
  }

  if (!serviceRoleKey || !supabaseUrl) {
    throw new Error('Configuration manquante: SUPABASE_SERVICE_ROLE_KEY non définie');
  }

  const adminSupabase = createAdminClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Check that the target user belongs to the same company.
  // Any admin can manage any user in their company.
  const currentAdminOwnerId = adminProfile.admin_owner_id ?? currentUser.id;
  const targetAdminOwnerId = targetProfile.admin_owner_id;

  let isSameCompany = targetAdminOwnerId === currentAdminOwnerId;

  // Fallback for users without admin_owner_id: check auth metadata
  if (!isSameCompany && targetAdminOwnerId === null) {
    const { data: authUserData } = await adminSupabase.auth.admin.getUserById(id);
    const metaAdminOwnerId = authUserData?.user?.user_metadata?.admin_owner_id;
    const metaCreatedBy = authUserData?.user?.user_metadata?.created_by;
    isSameCompany = metaAdminOwnerId === currentAdminOwnerId
      || metaCreatedBy === currentUser.id;
  }

  if (!isSameCompany) {
    throw new Error("Vous n'avez pas la permission de supprimer cet utilisateur");
  }


  // Delete the user from Supabase Auth (this also cascades to profiles via DB foreign key)
  const { error } = await adminSupabase.auth.admin.deleteUser(id);

  if (error) {
    console.error('Erreur suppression utilisateur Auth:', error);
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

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role, admin_owner_id')
    .eq('id', currentUser.id)
    .single();

  if (adminProfile?.role !== 'admin') {
    throw new Error('Seuls les administrateurs peuvent modifier des utilisateurs');
  }

  // Verify target user is in the same company
  const { data: targetProfile, error: fetchError } = await supabase
    .from('profiles')
    .select('admin_owner_id')
    .eq('id', id)
    .single();

  if (fetchError || !targetProfile) {
    throw new Error('Utilisateur non trouvé');
  }

  const currentAdminOwnerId = adminProfile.admin_owner_id ?? currentUser.id;
  const isSameCompany = targetProfile.admin_owner_id === currentAdminOwnerId || id === currentUser.id;

  if (!isSameCompany) {
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
