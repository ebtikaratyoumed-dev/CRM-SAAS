'use client';

import { useSearchParams, redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Shield, Clock } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { UserForm } from '@/components/dashboard/users/user-form';
import { UserTabs } from '@/components/dashboard/users/user-tabs';
import { UserActions } from '@/components/dashboard/users/user-actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboardCache } from '@/context/dashboard-cache';

export default function UsersPage() {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'list';
  const { users: members, user, profile, loading } = useDashboardCache();

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <Clock className="h-8 w-8 animate-bounce mx-auto mb-4 text-purple-500" />
        <p className="font-medium">Chargement des utilisateurs...</p>
      </div>
    );
  }

  const isAdmin = profile?.role === 'admin';

  if (!isAdmin) {
    redirect('/dashboard');
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">Administrateur</Badge>;
      case 'engineer': return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">Ingenieur / Archi</Badge>;
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
            Gerez les comptes ouvriers et administrateurs de votre entreprise.
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
                  <TableHead className="text-slate-400">Role</TableHead>
                  <TableHead className="text-slate-400">Arrive le</TableHead>
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
                       <UserActions user={member} currentUserId={user?.id} />
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
                  <p className="text-sm text-slate-400 uppercase tracking-wider font-semibold">Ingenieurs</p>
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
            <CardTitle>Creer un nouvel utilisateur</CardTitle>
            <CardDescription>Configurez un compte pour un nouvel employe ou administrateur.</CardDescription>
          </CardHeader>
          <CardContent>
            <UserForm redirectUrl="/dashboard/users?tab=list" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
