'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical, Play, CheckCircle2, AlertTriangle, Trash2, Clock } from "lucide-react";
import { updateTaskStatus, deleteTask } from "@/app/dashboard/tasks/actions";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface TaskActionsProps {
  task: any;
  isAdmin: boolean;
}

export function TaskActions({ task, isAdmin }: TaskActionsProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleStatusUpdate = async (newStatus: string) => {
    setLoading(true);
    try {
      await updateTaskStatus(task.id, newStatus);
      toast.success(`Statut mis à jour: ${newStatus}`);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Supprimer cette tâche ?')) {
      setLoading(true);
      try {
        await deleteTask(task.id);
        toast.success('Tâche supprimée');
        router.refresh();
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={
        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-white" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
        </Button>
      } />
      <DropdownMenuContent align="end" className="bg-slate-950 border-slate-800">
        <DropdownMenuItem onClick={() => handleStatusUpdate('En cours')} className="text-cyan-400 focus:text-cyan-300 focus:bg-cyan-500/10 cursor-pointer">
          <Play className="mr-2 h-4 w-4" /> Démarrer
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleStatusUpdate('En révision')} className="text-amber-400 focus:text-amber-300 focus:bg-amber-500/10 cursor-pointer">
          <Clock className="mr-2 h-4 w-4" /> En révision
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleStatusUpdate('Terminé')} className="text-emerald-400 focus:text-emerald-300 focus:bg-emerald-500/10 cursor-pointer">
          <CheckCircle2 className="mr-2 h-4 w-4" /> Terminer
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-slate-800" />
        <DropdownMenuItem onClick={() => handleStatusUpdate('À faire')} className="text-slate-400 focus:text-white focus:bg-slate-800 cursor-pointer">
          <AlertTriangle className="mr-2 h-4 w-4" /> Reporter
        </DropdownMenuItem>
        {isAdmin && (
          <>
            <DropdownMenuSeparator className="bg-slate-800" />
            <DropdownMenuItem onClick={handleDelete} className="text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer">
              <Trash2 className="mr-2 h-4 w-4" /> Supprimer
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
