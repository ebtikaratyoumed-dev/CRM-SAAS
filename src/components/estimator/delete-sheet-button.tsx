'use client';

import { useState, useTransition } from 'react';
import { Trash2, Loader2, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { deleteEstimationSheet } from '@/app/dashboard/estimator/actions';

export function DeleteSheetButton({ sheetId }: { sheetId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteEstimationSheet(sheetId);
        toast.success('Estimation supprimée.');
        setOpen(false);
        router.push('/dashboard/estimator');
      } catch (err: any) {
        toast.error(err.message ?? 'Erreur lors de la suppression');
      }
    });
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-2 border-red-500/20 text-red-400 hover:bg-red-400/10 hover:text-red-300 hover:border-red-400/40 transition-all"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-3.5 w-3.5" />
        Supprimer
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white font-black">
              <TriangleAlert className="h-5 w-5 text-red-400" />
              Supprimer cette estimation ?
            </DialogTitle>
            <DialogDescription className="text-zinc-400 pt-1">
              Cette action est irréversible. Toutes les lignes de cette estimation
              seront définitivement supprimées.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Supprimer'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
