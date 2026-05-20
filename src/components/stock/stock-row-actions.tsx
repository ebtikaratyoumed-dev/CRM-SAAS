'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateStockItem, deleteStockItem } from '@/app/dashboard/stock/actions';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Pencil, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface StockRowActionsProps {
  item: {
    id: string;
    name: string;
    description: string | null;
    quantity: number;
    unit: string;
    project_id: string;
    invoice_id: string | null;
  };
  projectId?: string;
  incomingInvoices?: { id: string; invoice_number: string; vendor_name: string; project_id?: string | null }[];
  projects?: { id: string; name: string }[];
}

export function StockRowActions({ item, projectId, incomingInvoices = [], projects = [] }: StockRowActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    project_id: item.project_id,
    name: item.name,
    description: item.description || '',
    quantity: String(item.quantity),
    unit: item.unit,
    invoice_id: item.invoice_id || 'none',
  });

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.project_id) {
        throw new Error('Projet requis');
      }

      await updateStockItem(item.id, {
        project_id: formData.project_id,
        name: formData.name,
        description: formData.description,
        quantity: Number(formData.quantity),
        unit: formData.unit,
        invoice_id: formData.invoice_id !== 'none' ? formData.invoice_id : null,
      });

      toast.success("Article mis à jour avec succès");
      setEditOpen(false);
      router.refresh();
    } catch (error: any) {
      console.error('Failed to update stock item:', error);
      toast.error(error.message || "Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteStockItem(item.id);
      toast.success("Article supprimé du stock avec succès");
      setDeleteOpen(false);
      router.refresh();
    } catch (error: any) {
      console.error('Failed to delete stock item:', error);
      toast.error(error.message || "Erreur lors de la suppression");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-2">
      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
              nativeButton={true}
            >
              <Pencil className="w-4 h-4" />
            </Button>
          }
        />
        <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Modifier l'article</DialogTitle>
            <DialogDescription className="text-slate-400">
              Modifiez les détails de l'article ci-dessous.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 pt-4">
            {!projectId && projects.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="edit-project">Projet <span className="text-red-500">*</span></Label>
                <Select
                  required
                  value={formData.project_id}
                  onValueChange={(val) => setFormData({ ...formData, project_id: val || '', invoice_id: 'none' })}
                >
                  <SelectTrigger className="bg-slate-950 border-slate-800">
                    <SelectValue placeholder="Sélectionner un projet" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                    {projects.map((proj) => (
                      <SelectItem key={proj.id} value={proj.id}>
                        {proj.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-name">Nom de l'article <span className="text-red-500">*</span></Label>
              <Input
                id="edit-name"
                required
                className="bg-slate-950 border-slate-800"
                placeholder="ex: Ciment Portland"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-quantity">Quantité <span className="text-red-500">*</span></Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  step="0.01"
                  required
                  className="bg-slate-950 border-slate-800"
                  placeholder="ex: 50"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-unit">Unité <span className="text-red-500">*</span></Label>
                <Input
                  id="edit-unit"
                  required
                  className="bg-slate-950 border-slate-800"
                  placeholder="ex: sacs, kg, m²"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-invoice">Facture Fournisseur (Optionnel)</Label>
              <Select
                value={formData.invoice_id}
                onValueChange={(val) => setFormData({ ...formData, invoice_id: val || 'none' })}
              >
                <SelectTrigger className="bg-slate-950 border-slate-800">
                  <SelectValue placeholder="Sélectionner une facture" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                  <SelectItem value="none">-- Aucune facture --</SelectItem>
                  {incomingInvoices
                    .filter((inv) => !formData.project_id || inv.project_id === formData.project_id)
                    .map((inv) => (
                      <SelectItem key={inv.id} value={inv.id}>
                        {inv.invoice_number} - {inv.vendor_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                className="bg-slate-950 border-slate-800 min-h-[80px]"
                placeholder="Détails supplémentaires..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800"
                onClick={() => setEditOpen(false)}
                nativeButton={true}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700" nativeButton={true}>
                {loading ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-red-950/20"
              nativeButton={true}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          }
        />
        <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-red-500">Supprimer l'article ?</DialogTitle>
            <DialogDescription className="text-slate-400">
              Êtes-vous sûr de vouloir supprimer "{item.name}" ? Cette action est irréversible et supprimera définitivement cet article du stock.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800"
              onClick={() => setDeleteOpen(false)}
              nativeButton={true}
            >
              Annuler
            </Button>
            <Button
              type="button"
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDelete}
              nativeButton={true}
            >
              {loading ? 'Suppression...' : 'Supprimer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
