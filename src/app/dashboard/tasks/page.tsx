import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Plus, Search, Calendar, User, CheckCircle2, Clock, Play, AlertTriangle, MoreVertical } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TaskForm } from '@/components/dashboard/tasks/task-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { redirect } from 'next/navigation';
import { TaskActions } from '@/components/dashboard/tasks/task-actions';
import { TaskTabs } from '@/components/dashboard/tasks/task-tabs';
import { TaskSearch } from '@/components/dashboard/tasks/task-search';
import { TaskDetailsDialog } from '@/components/dashboard/tasks/task-details-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { getAuthUser } from '@/lib/auth';

export default async function TasksPage({
  searchParams
}: {
  searchParams: Promise<{ tab?: string; search?: string }>
}) {
  const params = await searchParams;
  const currentTab = params.tab || 'list';
  const searchQuery = params.search || '';
  const supabase = await createClient();

  const { user, profile } = await getAuthUser();

  if (!user) {
    redirect('/auth/login');
  }

  const isAdmin = profile?.role === 'admin';

  // Build tasks query base
  let tasksQuery = supabase
    .from('tasks')
    .select(`
      id,
      title,
      description,
      priority,
      due_date,
      status,
      assigned_to,
      project:projects(name),
      assignee:profiles!tasks_assigned_to_fkey(full_name)
    `)
    .order('due_date', { ascending: true });

  if (!isAdmin) {
    tasksQuery = tasksQuery.eq('assigned_to', user.id);
  }

  if (searchQuery) {
    tasksQuery = tasksQuery.ilike('title', `%${searchQuery}%`);
  }

  // Fetch tasks, projects, and members in parallel
  const [projectsRes, membersRes, tasksRes] = await Promise.all([
    supabase.from('projects').select('id, name').order('name'),
    supabase.from('profiles').select('id, full_name, role').order('full_name'),
    tasksQuery
  ]);

  const projects = projectsRes.data;
  const members = membersRes.data;
  const tasks = tasksRes.data as any[] | null;

  const statuses = ['À faire', 'En cours', 'En révision', 'Terminé'];
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'haute': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'moyenne': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      default: return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Liste des Tâches
          </h1>
          <p className="text-slate-400 mt-1">
            Gérez vos interventions et le suivi des travaux.
          </p>
        </div>
      </div>

      <TaskTabs isAdmin={isAdmin} />

      {currentTab === 'list' ? (
        <Tabs defaultValue="tous" className="w-full">
        <div className="flex items-center justify-between mb-6 gap-4">
            <TabsList className="bg-slate-900/50 border border-slate-800 p-1">
                <TabsTrigger value="tous" className="data-active:bg-slate-800">Toutes</TabsTrigger>
                <TabsTrigger value="À faire" className="data-active:bg-slate-800">À faire</TabsTrigger>
                <TabsTrigger value="En cours" className="data-active:bg-slate-800">En cours</TabsTrigger>
                <TabsTrigger value="Terminé" className="data-active:bg-slate-800">Terminées</TabsTrigger>
            </TabsList>

            <TaskSearch />
        </div>

        <TabsContent value="tous" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks?.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500 bg-slate-900/20 border border-slate-800 border-dashed rounded-xl">
                Aucune tâche trouvée
              </div>
            )}
            {tasks?.map((task) => (
              <div key={task.id} className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 hover:border-slate-700 hover:bg-slate-900/60 transition-all group relative">
                <div className="flex justify-between items-start mb-3 relative z-10">
                  <Badge variant="outline" className={cn("capitalize px-2", getPriorityColor(task.priority))}>
                    {task.priority || 'moyenne'}
                  </Badge>
                  <TaskActions task={task} isAdmin={isAdmin} />
                </div>

                <TaskDetailsDialog task={task}>
                  <h3 className="font-semibold text-lg mb-1 group-hover:text-blue-400 transition-colors">{task.title}</h3>
                  <p className="text-slate-500 text-sm mb-4 line-clamp-2">{task.description}</p>
                  
                  <div className="space-y-2 mb-4">
                     <div className="flex items-center gap-2 text-xs text-slate-400">
                        <LayoutGrid className="h-3 w-3 text-blue-500" />
                        <span className="font-medium text-slate-300">{task.project?.name}</span>
                     </div>
                     <div className="flex items-center gap-2 text-xs text-slate-400">
                        <User className="h-3 w-3 text-purple-500" />
                        <span>{task.assignee?.full_name}</span>
                     </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800">
                     <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                        <Calendar className="h-3.5 w-3.5" />
                        {task.due_date ? format(new Date(task.due_date), 'dd MMM', { locale: fr }) : '-'}
                     </div>
                     <div className="flex items-center gap-2">
                        <div className={cn(
                          "h-2 w-2 rounded-full animate-pulse",
                          task.status === 'Terminé' ? 'bg-emerald-500' : 
                          task.status === 'En cours' ? 'bg-cyan-500' : 'bg-slate-600'
                        )} />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">{task.status || 'À faire'}</span>
                     </div>
                  </div>
                </TaskDetailsDialog>
              </div>
            ))}
          </div>
        </TabsContent>

        {['À faire', 'En cours', 'Terminé'].map(status => {
          const filteredTasks = tasks?.filter(t => t.status === status) || [];
          return (
            <TabsContent key={status} value={status} className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTasks.length === 0 && (
                  <div className="col-span-full py-12 text-center text-slate-500 bg-slate-900/20 border border-slate-800 border-dashed rounded-xl">
                    Aucune tâche "{status}" trouvée
                  </div>
                )}
                {filteredTasks.map((task) => (
                  <div key={task.id} className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 hover:border-slate-700 hover:bg-slate-900/60 transition-all group relative">
                    <div className="flex justify-between items-start mb-3 relative z-10">
                      <Badge variant="outline" className={cn("capitalize px-2", getPriorityColor(task.priority))}>
                        {task.priority || 'moyenne'}
                      </Badge>
                      <TaskActions task={task} isAdmin={isAdmin} />
                    </div>

                    <TaskDetailsDialog task={task}>
                      <h3 className="font-semibold text-lg mb-1 group-hover:text-blue-400 transition-colors">{task.title}</h3>
                      <p className="text-slate-500 text-sm mb-4 line-clamp-2">{task.description}</p>
                      
                      <div className="space-y-2 mb-4">
                         <div className="flex items-center gap-2 text-xs text-slate-400">
                            <LayoutGrid className="h-3 w-3 text-blue-500" />
                            <span className="font-medium text-slate-300">{task.project?.name}</span>
                         </div>
                         <div className="flex items-center gap-2 text-xs text-slate-400">
                            <User className="h-3 w-3 text-purple-500" />
                            <span>{task.assignee?.full_name}</span>
                         </div>
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800">
                         <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                            <Calendar className="h-3.5 w-3.5" />
                            {task.due_date ? format(new Date(task.due_date), 'dd MMM', { locale: fr }) : '-'}
                         </div>
                         <div className="flex items-center gap-2">
                            <div className={cn(
                              "h-2 w-2 rounded-full animate-pulse",
                              task.status === 'Terminé' ? 'bg-emerald-500' : 
                              task.status === 'En cours' ? 'bg-cyan-500' : 'bg-slate-600'
                            )} />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">{task.status || 'À faire'}</span>
                         </div>
                      </div>
                    </TaskDetailsDialog>
                  </div>
                ))}
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
      ) : (
        <Card className="max-w-2xl mx-auto bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle>Création de Tâche</CardTitle>
            <CardDescription>Assignez une nouvelle tâche à un membre de l'équipe.</CardDescription>
          </CardHeader>
          <CardContent>
            <TaskForm 
              projects={projects || []} 
              members={members || []} 
              redirectUrl="/dashboard/tasks?tab=list" 
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Add a few more imports to satisfy the compiler if needed
import { LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
