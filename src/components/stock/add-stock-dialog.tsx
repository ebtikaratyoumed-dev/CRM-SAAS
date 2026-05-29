'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addStockItem } from '@/app/dashboard/stock/actions';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useDashboardCache } from '@/context/dashboard-cache';
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
import { PackagePlus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AddStockDialogProps {
  projectId?: string;
  incomingInvoices?: { id: string; invoice_number: string; vendor_name: string; project_id?: string | null }[];
  projects?: { id: string; name: string }[];
}

export function AddStockDialog({ projectId, incomingInvoices = [], projects = [] }: AddStockDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { refreshData } = useDashboardCache();

  const [formData, setFormData] = useState({
    project_id: projectId || '',
    name: '',
    description: '',
    quantity: '',
    unit: '',
    invoice_id: 'none',
    alert_threshold: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.project_id) {
        throw new Error('Projet requis');
      }

      await addStockItem({
        project_id: formData.project_id,
        name: formData.name,
        description: formData.description,
        quantity: Number(formData.quantity),
        unit: formData.unit,
        invoice_id: formData.invoice_id !== 'none' ? formData.invoice_id : null,
        alert_threshold: formData.alert_threshold ? Number(formData.alert_threshold) : null,
      });

      toast.success("Article ajouté au stock avec succès");
      setOpen(false);
      setFormData({ project_id: projectId || '', name: '', description: '', quantity: '', unit: '', invoice_id: 'none', alert_threshold: '' });
      await refreshData();
      router.refresh();
    } catch (error: any) {
      console.error('Failed to add stock item:', error);
      toast.error(error.message || "Erreur lors de l'ajout au stock");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white" nativeButton={true}>
          <PackagePlus className="w-4 h-4" />
          Ajouter au stock
        </Button>} />
      <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajouter un élément au stock</DialogTitle>
          <DialogDescription className="text-slate-400">
            Saisissez les détails de l'article. Vous pouvez le lier à une facture fournisseur.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {!projectId && projects.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="project">Projet <span className="text-red-500">*</span></Label>
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
            <Label htmlFor="name">Nom de l'article <span className="text-red-500">*</span></Label>
            <Input
              id="name"
              required
              className="bg-slate-950 border-slate-800"
              placeholder="ex: Ciment Portland"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantité <span className="text-red-500">*</span></Label>
              <Input
                id="quantity"
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
              <Label htmlFor="unit">Unité <span className="text-red-500">*</span></Label>
              <Input
                id="unit"
                required
                className="bg-slate-950 border-slate-800"
                placeholder="ex: sacs, kg, m²"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="invoice">Facture Fournisseur (Optionnel)</Label>
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
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              className="bg-slate-950 border-slate-800 min-h-[80px]"
              placeholder="Détails supplémentaires..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="alert_threshold">Seuil d'alerte (Optionnel)</Label>
            <Input
              id="alert_threshold"
              type="number"
              min="0"
              className="bg-slate-950 border-slate-800"
              placeholder="ex: 10"
              value={formData.alert_threshold}
              onChange={(e) => setFormData({ ...formData, alert_threshold: e.target.value })}
            />
            <p className="text-[11px] text-slate-500">Vous serez alerté quand la quantité atteint ce seuil.</p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800"
              onClick={() => setOpen(false)}
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
  );
}
