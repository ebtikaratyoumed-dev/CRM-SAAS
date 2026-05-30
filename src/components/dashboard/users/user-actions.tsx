'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2 } from 'lucide-react';
import { deleteUser } from '@/app/dashboard/users/actions';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { UserForm } from '@/components/dashboard/users/user-form';
import { useRouter } from 'next/navigation';
import { useDashboardCache } from '@/context/dashboard-cache';

export function UserActions({ user, currentUserId }: { user: any; currentUserId: string }) {
  const [loading, setLoading] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const router = useRouter();
  const { refreshData } = useDashboardCache();

  async function handleDelete() {
    if (user.id === currentUserId) {
      toast.error("Vous ne pouvez pas supprimer votre propre compte.");
      return;
    }
    
    if (!confirm(`T'es sûr de vouloir supprimer ${user.full_name} ?`)) return;
    
    setLoading(true);
    try {
      const response = await deleteUser(user.id);
      if (response.success) {
        toast.success(`Utilisateur supprimé avec succès.`);
        await refreshData();
        router.refresh();
      }
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la suppression.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex justify-end gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-slate-500 hover:text-white"
          onClick={() => setIsEditOpen(true)}
          disabled={loading}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-red-500/50 hover:text-red-500"
          onClick={handleDelete}
          disabled={loading || user.id === currentUserId}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px] bg-slate-950 border-slate-800 text-slate-200">
          <DialogHeader>
            <DialogTitle>Modifier l'utilisateur</DialogTitle>
            <DialogDescription>
              Mettez à jour les informations de {user.full_name}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <UserForm 
              initialData={{
                id: user.id,
                email: user.email, // Note: email might not be directly available on profile, but we pass it anyway.
                full_name: user.full_name,
                role: user.role,
              }}
              onSuccess={() => {
                setIsEditOpen(false);
                router.refresh();
              }} 
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
