'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MoreVertical, 
  Pencil, 
  Trash2, 
  Loader2,
  AlertTriangle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { deleteIncomingInvoice } from '@/app/dashboard/invoices/actions';
import { toast } from 'sonner';

interface IncomingInvoiceActionsProps {
  invoiceId: string;
}

export function IncomingInvoiceActions({ invoiceId }: IncomingInvoiceActionsProps) {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteIncomingInvoice(invoiceId);
      toast.success('Facture supprimée avec succès');
      setIsDeleteDialogOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
          <MoreVertical className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40 bg-slate-900 border-slate-800 text-slate-200">
          <DropdownMenuItem 
            className="flex items-center gap-2 cursor-pointer hover:bg-slate-800 focus:bg-slate-800"
            onClick={() => router.push(`/dashboard/invoices/edit/${invoiceId}`)}
          >
            <Pencil className="h-3.5 w-3.5" />
            Modifier
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-slate-800" />
          <DropdownMenuItem 
            className="flex items-center gap-2 cursor-pointer text-red-400 hover:bg-red-400/10 focus:bg-red-400/10"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-5 w-5" />
              Confirmer la suppression
            </DialogTitle>
            <DialogDescription className="text-slate-400 pt-2">
              Êtes-vous sûr de vouloir supprimer cette facture ? Cette action est irréversible et supprimera définitivement les données de la base.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="ghost" 
              onClick={() => setIsDeleteDialogOpen(false)}
              className="hover:bg-slate-800 text-slate-400"
            >
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Supprimer définitivement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
