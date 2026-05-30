'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical, Edit, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { ProjectForm } from "./project-form";
import { deleteProject } from "@/app/dashboard/projects/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useDashboardCache } from "@/context/dashboard-cache";

interface ProjectActionsProps {
  project: any;
}

export function ProjectActions({ project }: ProjectActionsProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const { refreshData } = useDashboardCache();

  const handleDelete = async () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) {
      setIsDeleting(true);
      try {
        await deleteProject(project.id);
        toast.success('Projet supprimé avec succès');
        await refreshData();
        router.refresh();
      } catch (error: any) {
        toast.error(error.message || 'Erreur lors de la suppression');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
            <MoreVertical className="h-4 w-4" />
          </Button>
        } />
        <DropdownMenuContent align="end" className="bg-slate-950 border-slate-800">
          <DropdownMenuItem 
            onClick={() => setIsEditDialogOpen(true)}
            className="text-slate-400 focus:text-white focus:bg-slate-800 cursor-pointer"
          >
            <Edit className="mr-2 h-4 w-4" />
            Modifier
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={handleDelete}
            className="text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-slate-950 border-slate-800">
          <DialogHeader>
            <DialogTitle>Modifier le projet</DialogTitle>
          </DialogHeader>
          <ProjectForm 
            initialData={project} 
            onSuccess={() => setIsEditDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
