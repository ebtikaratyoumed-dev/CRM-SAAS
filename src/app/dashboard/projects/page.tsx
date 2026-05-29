import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { LayoutGrid, Search, MapPin, Calendar, User } from 'lucide-react';
import { ProjectForm } from '@/components/dashboard/projects/project-form';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ProjectActions } from '@/components/dashboard/projects/project-actions';
import { ProjectTabs } from '@/components/dashboard/projects/project-tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { getAuthUser } from '@/lib/auth';

interface ProjectsPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const params = await searchParams;
  const currentTab = params.tab || 'list';
  const supabase = await createClient();

  const { user, profile } = await getAuthUser();

  if (!user) {
    redirect('/auth/login');
  }

  const isAdmin = profile?.role === 'admin';

  if (!isAdmin) {
    redirect('/dashboard');
  }

  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('id, name, status, client_name, location, start_date, deadline, created_at')
    .order('created_at', { ascending: false });

  if (projectsError) {
    console.error('Error fetching projects:', projectsError);
  }

  const projectList = (projects || []).map((p: any) => ({
    ...p,
    end_date: p.deadline
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Planification': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'En cours': return 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20';
      case 'En pause': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'Terminé': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Gestion des Projets
          </h1>
          <p className="text-slate-400 mt-1">
            Gérez et suivez l'avancement de vos chantiers en temps réel.
          </p>
        </div>
      </div>

      <ProjectTabs isAdmin={isAdmin} />

      {currentTab === 'list' ? (
        <div className="space-y-8">
          <div className="flex items-center gap-4 bg-slate-900/50 p-2 rounded-xl border border-slate-800">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Rechercher un projet..." 
                className="w-full bg-slate-950 border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all border"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projectList.map((project) => (
              <div key={project.id} className="group relative bg-slate-900/40 border border-slate-800 rounded-2xl p-6 transition-all hover:bg-slate-900/60 hover:border-slate-700 hover:shadow-2xl hover:shadow-blue-500/5">
                <div className="flex justify-between items-start mb-4">
                  <Badge variant="outline" className={getStatusColor(project.status)}>
                    {project.status}
                  </Badge>
                  {isAdmin && <ProjectActions project={project} />}
                </div>

                <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-400 transition-colors">
                  {project.name}
                </h3>
                
                <div className="space-y-3 text-sm text-slate-400">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-500" />
                    <span>{project.client_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-500" />
                    <span>{project.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-500" />
                    <span>{format(new Date(project.start_date), 'dd MMM yyyy', { locale: fr })}</span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((_, i) => (
                      <div key={i} className="h-8 w-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-bold">
                        JD
                      </div>
                    ))}
                    <div className="h-8 w-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400">
                      +2
                    </div>
                  </div>
                  <Button variant="ghost" className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 h-8 px-3" nativeButton={false} render={<Link href={`/dashboard/projects/${project.id}`} />}>
                    Détails
                  </Button>
                </div>
              </div>
            ))}

            {projectList.length === 0 && (
              <div className="col-span-full text-center py-12 bg-slate-900/20 border border-slate-800 border-dashed rounded-2xl">
                <LayoutGrid className="mx-auto h-12 w-12 text-slate-600 mb-4" />
                <h3 className="text-lg font-semibold text-slate-300">Aucun projet</h3>
                <p className="text-slate-500 mt-1">Vous n'avez pas encore créé de projet.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <Card className="max-w-2xl mx-auto bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle>Création de Projet</CardTitle>
            <CardDescription>Remplissez les détails du nouveau chantier pour commencer le suivi.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProjectForm />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
