import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Plus, UserPlus, Mail, Shield, Calendar, MoreVertical, Trash2, Edit2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { redirect } from 'next/navigation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { UserForm } from '@/components/dashboard/users/user-form';
import { UserTabs } from '@/components/dashboard/users/user-tabs';
import { UserActions } from '@/components/dashboard/users/user-actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function UsersPage({
  searchParams
}: {
  searchParams: { tab?: string }
}) {
  const currentTab = (await searchParams).tab || 'list';
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  const { data: members, error } = await supabase
    .from('profiles')
    .select('*')
    .or(`created_by.eq.${user.id},id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">Administrateur</Badge>;
      case 'engineer': return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">Ingénieur / Archi</Badge>;
      case 'worker': return <Badge className="bg-slate-500/10 text-slate-400 border-slate-500/20">Ouvrier</Badge>;
      default: return <Badge>{role}</Badge>;
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Gestion des Utilisateurs
          </h1>
          <p className="text-slate-400 mt-1">
            Gérez les comptes ouvriers et administrateurs de votre entreprise.
          </p>
        </div>
      </div>

      <UserTabs />

      {currentTab === 'list' ? (
        <>
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-900/60">
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-400">Nom Complet</TableHead>
                  <TableHead className="text-slate-400">Rôle</TableHead>
                  <TableHead className="text-slate-400">Arrivé le</TableHead>
                  <TableHead className="text-right text-slate-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members?.map((member) => (
                  <TableRow key={member.id} className="border-slate-800 hover:bg-slate-800/30 transition-colors">
                    <TableCell className="font-medium flex items-center gap-3 py-4">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-white/5">
                        <span className="text-xs font-bold text-white">
                          {member.full_name.split(' ').map((n: string) => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="text-white">{member.full_name}</p>
                        <p className="text-xs text-slate-500">ID: {member.id.substring(0, 8)}...</p>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(member.role)}</TableCell>
                    <TableCell className="text-slate-400">
                       {format(new Date(member.created_at), 'dd MMM yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell className="text-right">
                      <UserActions user={member} currentUserId={user.id} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
               <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-blue-500" />
               </div>
               <div>
                  <p className="text-sm text-slate-400 uppercase tracking-wider font-semibold">Total Admin</p>
                  <p className="text-2xl font-bold">{members?.filter(m => m.role === 'admin').length}</p>
               </div>
            </div>
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
               <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-purple-500" />
               </div>
               <div>
                  <p className="text-sm text-slate-400 uppercase tracking-wider font-semibold">Ingénieurs</p>
                  <p className="text-2xl font-bold">{members?.filter(m => m.role === 'engineer').length}</p>
               </div>
            </div>
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
               <div className="h-12 w-12 rounded-lg bg-slate-500/10 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-slate-500" />
               </div>
               <div>
                  <p className="text-sm text-slate-400 uppercase tracking-wider font-semibold">Ouvriers</p>
                  <p className="text-2xl font-bold">{members?.filter(m => m.role === 'worker').length}</p>
               </div>
            </div>
          </div>
        </>
      ) : (
        <Card className="max-w-xl mx-auto bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle>Créer un nouvel utilisateur</CardTitle>
            <CardDescription>Configurez un compte pour un nouvel employé ou administrateur.</CardDescription>
          </CardHeader>
          <CardContent>
            <UserForm redirectUrl="/dashboard/users?tab=list" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
