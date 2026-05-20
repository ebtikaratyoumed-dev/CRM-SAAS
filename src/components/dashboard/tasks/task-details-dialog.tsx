'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, LayoutGrid, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskDetailsDialogProps {
  task: any;
  children: React.ReactNode;
}

export function TaskDetailsDialog({ task, children }: TaskDetailsDialogProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'haute': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'moyenne': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      default: return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    }
  };

  return (
    <Dialog>
      <DialogTrigger nativeButton={false} render={
        <div className="cursor-pointer">
          {children}
        </div>
      } />
      <DialogContent className="sm:max-w-[500px] bg-slate-950 border-slate-800 text-slate-200">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className={cn("capitalize px-2", getPriorityColor(task.priority))}>
              {task.priority || 'moyenne'}
            </Badge>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium">
              <div className={cn(
                "h-2 w-2 rounded-full",
                task.status === 'Terminé' ? 'bg-emerald-500' : 
                task.status === 'En cours' ? 'bg-cyan-500' : 'bg-slate-600'
              )} />
              <span className="uppercase tracking-wider text-slate-300">{task.status || 'À faire'}</span>
            </div>
          </div>
          <DialogTitle className="text-xl font-bold">{task.title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div>
            <h4 className="text-sm font-medium text-slate-400 mb-2">Description</h4>
            <div className="p-3 bg-slate-900/50 rounded-lg text-sm text-slate-300 whitespace-pre-wrap border border-slate-800/50 max-h-[250px] overflow-y-auto">
              {task.description || 'Aucune description fournie.'}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Projet</span>
              <div className="flex items-center gap-2 text-sm text-slate-300 bg-slate-900/50 p-2 rounded-md border border-slate-800/50">
                <LayoutGrid className="h-4 w-4 text-blue-500 shrink-0" />
                <span className="block truncate" title={task.project?.name}>{task.project?.name || 'Non assigné'}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Assigné à</span>
              <div className="flex items-center gap-2 text-sm text-slate-300 bg-slate-900/50 p-2 rounded-md border border-slate-800/50">
                <User className="h-4 w-4 text-purple-500 shrink-0" />
                <span className="block truncate" title={task.assignee?.full_name}>{task.assignee?.full_name || 'Non assigné'}</span>
              </div>
            </div>

            <div className="col-span-2 space-y-1">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Échéance</span>
              <div className="flex items-center gap-2 text-sm text-slate-300 bg-slate-900/50 p-2 rounded-md border border-slate-800/50">
                <Calendar className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>{task.due_date ? format(new Date(task.due_date), 'dd MMMM yyyy', { locale: fr }) : 'Non définie'}</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
