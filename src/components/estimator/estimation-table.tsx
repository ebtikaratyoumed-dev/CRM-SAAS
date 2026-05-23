'use client';

import { useState, useTransition, useRef } from 'react';
import { Plus, Trash2, Loader2, Check, X, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  addEstimationItem,
  updateEstimationItem,
  deleteEstimationItem,
} from '@/app/dashboard/estimator/actions';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  'Gros œuvre',
  'Menuiserie',
  'Électricité',
  'Plomberie',
  'Revêtements',
  'Charpente',
  'Isolation',
  'Peinture',
  'Aménagement extérieur',
  'Autre',
];

const UNITS = ['m²', 'm³', 'm linéaire', 'kg', 'T', 'unité', 'lot', 'forfait'];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EstimationItem {
  id: string;
  sheet_id: string;
  material_name: string;
  category: string | null;
  unit: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes: string | null;
  sort_order: number;
}

interface EstimationTableProps {
  sheetId: string;
  initialItems: EstimationItem[];
  isAdmin: boolean;
}

// ─── Empty row template ───────────────────────────────────────────────────────

const emptyRow = () => ({
  material_name: '',
  category: '',
  unit: 'm²',
  quantity: '',
  unit_price: '',
  notes: '',
});

// ─── Main component ───────────────────────────────────────────────────────────

export function EstimationTable({ sheetId, initialItems, isAdmin }: EstimationTableProps) {
  const [items, setItems] = useState<EstimationItem[]>(initialItems);
  const [addingRow, setAddingRow] = useState(false);
  const [newRow, setNewRow] = useState(emptyRow());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRow, setEditRow] = useState<any>({});
  const [isPending, startTransition] = useTransition();
  const firstInputRef = useRef<HTMLInputElement>(null);

  const grandTotal = items.reduce((sum, item) => sum + (item.total_price ?? 0), 0);

  const fmt = (n: number) =>
    new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND', minimumFractionDigits: 2 }).format(n);

  // ── Add row ────────────────────────────────────────────────────────────────
  const handleAddRow = () => {
    setAddingRow(true);
    setTimeout(() => firstInputRef.current?.focus(), 50);
  };

  const handleSaveNew = () => {
    if (!newRow.material_name.trim() || !newRow.unit) {
      toast.error('Nom du matériau et unité sont obligatoires.');
      return;
    }
    const qty = parseFloat(String(newRow.quantity)) || 0;
    const price = parseFloat(String(newRow.unit_price)) || 0;

    startTransition(async () => {
      try {
        const result = await addEstimationItem({
          sheet_id: sheetId,
          material_name: newRow.material_name.trim(),
          category: newRow.category || undefined,
          unit: newRow.unit,
          quantity: qty,
          unit_price: price,
          notes: newRow.notes || undefined,
          sort_order: items.length,
        });
        setItems((prev) => [
          ...prev,
          { ...result.data, total_price: qty * price } as EstimationItem,
        ]);
        setNewRow(emptyRow());
        setAddingRow(false);
        toast.success('Ligne ajoutée.');
      } catch (err: any) {
        toast.error(err.message ?? 'Erreur');
      }
    });
  };

  const handleCancelNew = () => {
    setNewRow(emptyRow());
    setAddingRow(false);
  };

  // ── Edit row ───────────────────────────────────────────────────────────────
  const handleStartEdit = (item: EstimationItem) => {
    setEditingId(item.id);
    setEditRow({
      material_name: item.material_name,
      category: item.category ?? '',
      unit: item.unit,
      quantity: String(item.quantity),
      unit_price: String(item.unit_price),
      notes: item.notes ?? '',
    });
  };

  const handleSaveEdit = (item: EstimationItem) => {
    const qty = parseFloat(editRow.quantity) || 0;
    const price = parseFloat(editRow.unit_price) || 0;

    startTransition(async () => {
      try {
        await updateEstimationItem(item.id, sheetId, {
          material_name: editRow.material_name.trim(),
          category: editRow.category || undefined,
          unit: editRow.unit,
          quantity: qty,
          unit_price: price,
          notes: editRow.notes || undefined,
        });
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, ...editRow, quantity: qty, unit_price: price, total_price: qty * price }
              : i
          )
        );
        setEditingId(null);
        toast.success('Ligne mise à jour.');
      } catch (err: any) {
        toast.error(err.message ?? 'Erreur');
      }
    });
  };

  const handleCancelEdit = () => setEditingId(null);

  // ── Delete row ─────────────────────────────────────────────────────────────
  const handleDelete = (item: EstimationItem) => {
    startTransition(async () => {
      try {
        await deleteEstimationItem(item.id, sheetId);
        setItems((prev) => prev.filter((i) => i.id !== item.id));
        toast.success('Ligne supprimée.');
      } catch (err: any) {
        toast.error(err.message ?? 'Erreur');
      }
    });
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/40">
        <table className="w-full text-sm text-left">
          <thead className="bg-zinc-900/80 border-b border-zinc-800">
            <tr>
              <th className="px-4 py-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Matériau</th>
              <th className="px-4 py-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Catégorie</th>
              <th className="px-4 py-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Unité</th>
              <th className="px-4 py-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">Qté</th>
              <th className="px-4 py-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">Prix unit.</th>
              <th className="px-4 py-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">Total</th>
              {isAdmin && (
                <th className="px-4 py-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Actions</th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-800/50">
            {items.length === 0 && !addingRow && (
              <tr>
                <td
                  colSpan={isAdmin ? 7 : 6}
                  className="px-4 py-12 text-center text-zinc-600 text-sm"
                >
                  Aucune ligne. Cliquez sur &quot;Ajouter une ligne&quot; pour commencer.
                </td>
              </tr>
            )}

            {items.map((item) =>
              editingId === item.id ? (
                /* ── Editing row ── */
                <tr key={item.id} className="bg-zinc-800/30">
                  <td className="px-3 py-2">
                    <Input
                      value={editRow.material_name}
                      onChange={(e) => setEditRow((r: any) => ({ ...r, material_name: e.target.value }))}
                      className="h-8 bg-zinc-800 border-zinc-700 text-white text-sm w-40"
                      placeholder="Matériau…"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Select
                      value={editRow.category}
                      onValueChange={(v) => setEditRow((r: any) => ({ ...r, category: v ?? '' }))}
                    >
                      <SelectTrigger className="h-8 bg-zinc-800 border-zinc-700 text-white text-xs w-36">
                        <SelectValue placeholder="Catégorie" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c} className="text-zinc-200 focus:bg-zinc-700">
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-2">
                    <Select
                      value={editRow.unit}
                      onValueChange={(v) => setEditRow((r: any) => ({ ...r, unit: v ?? '' }))}
                    >
                      <SelectTrigger className="h-8 bg-zinc-800 border-zinc-700 text-white text-xs w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        {UNITS.map((u) => (
                          <SelectItem key={u} value={u} className="text-zinc-200 focus:bg-zinc-700">
                            {u}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      value={editRow.quantity}
                      onChange={(e) => setEditRow((r: any) => ({ ...r, quantity: e.target.value }))}
                      className="h-8 bg-zinc-800 border-zinc-700 text-white text-sm text-right w-24"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      value={editRow.unit_price}
                      onChange={(e) => setEditRow((r: any) => ({ ...r, unit_price: e.target.value }))}
                      className="h-8 bg-zinc-800 border-zinc-700 text-white text-sm text-right w-28"
                    />
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-brand-cyan font-bold">
                    {fmt((parseFloat(editRow.quantity) || 0) * (parseFloat(editRow.unit_price) || 0))}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-emerald-400 hover:bg-emerald-400/10"
                        onClick={() => handleSaveEdit(item)}
                        disabled={isPending}
                      >
                        {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-zinc-500 hover:bg-zinc-700"
                        onClick={handleCancelEdit}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                /* ── Read row ── */
                <tr
                  key={item.id}
                  className="hover:bg-zinc-800/30 transition-colors group"
                >
                  <td className="px-4 py-3 font-semibold text-slate-200">{item.material_name}</td>
                  <td className="px-4 py-3">
                    {item.category ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                        {item.category}
                      </span>
                    ) : (
                      <span className="text-zinc-700">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-zinc-400 text-xs font-mono">{item.unit}</td>
                  <td className="px-4 py-3 text-right font-mono text-white">{Number(item.quantity).toLocaleString('fr-TN')}</td>
                  <td className="px-4 py-3 text-right font-mono text-zinc-300">{fmt(item.unit_price)}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-brand-cyan">{fmt(item.total_price ?? 0)}</td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-zinc-400 hover:text-white hover:bg-zinc-700"
                          onClick={() => handleStartEdit(item)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-zinc-500 hover:text-red-400 hover:bg-red-400/10"
                          onClick={() => handleDelete(item)}
                          disabled={isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              )
            )}

            {/* ── New row form ── */}
            {addingRow && (
              <tr className="bg-brand-cyan/5 border-t border-brand-cyan/20">
                <td className="px-3 py-2">
                  <Input
                    ref={firstInputRef}
                    value={newRow.material_name}
                    onChange={(e) => setNewRow((r) => ({ ...r, material_name: e.target.value }))}
                    className="h-8 bg-zinc-800 border-zinc-700 text-white text-sm w-40"
                    placeholder="Nom du matériau *"
                  />
                </td>
                <td className="px-3 py-2">
                  <Select
                    value={newRow.category}
                    onValueChange={(v) => setNewRow((r) => ({ ...r, category: v ?? '' }))}
                  >
                    <SelectTrigger className="h-8 bg-zinc-800 border-zinc-700 text-white text-xs w-36">
                      <SelectValue placeholder="Catégorie" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c} className="text-zinc-200 focus:bg-zinc-700">
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-3 py-2">
                  <Select
                    value={newRow.unit}
                    onValueChange={(v) => setNewRow((r) => ({ ...r, unit: v ?? '' }))}
                  >
                    <SelectTrigger className="h-8 bg-zinc-800 border-zinc-700 text-white text-xs w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      {UNITS.map((u) => (
                        <SelectItem key={u} value={u} className="text-zinc-200 focus:bg-zinc-700">
                          {u}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-3 py-2">
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={newRow.quantity}
                    onChange={(e) => setNewRow((r) => ({ ...r, quantity: e.target.value }))}
                    className="h-8 bg-zinc-800 border-zinc-700 text-white text-sm text-right w-24"
                    placeholder="0"
                  />
                </td>
                <td className="px-3 py-2">
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={newRow.unit_price}
                    onChange={(e) => setNewRow((r) => ({ ...r, unit_price: e.target.value }))}
                    className="h-8 bg-zinc-800 border-zinc-700 text-white text-sm text-right w-28"
                    placeholder="0.00"
                  />
                </td>
                <td className="px-3 py-2 text-right font-mono text-brand-cyan font-bold text-sm">
                  {fmt((parseFloat(newRow.quantity) || 0) * (parseFloat(newRow.unit_price) || 0))}
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-emerald-400 hover:bg-emerald-400/10"
                      onClick={handleSaveNew}
                      disabled={isPending}
                    >
                      {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-zinc-500 hover:bg-zinc-700"
                      onClick={handleCancelNew}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>

          {/* Grand total footer */}
          {items.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-zinc-700 bg-zinc-900/80">
                <td colSpan={isAdmin ? 5 : 4} className="px-4 py-4 text-right text-xs font-black text-zinc-400 uppercase tracking-widest">
                  Total Général
                </td>
                <td className="px-4 py-4 text-right font-mono font-black text-xl text-white">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-cyan to-brand-blue">
                    {fmt(grandTotal)}
                  </span>
                </td>
                {isAdmin && <td />}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Add row button */}
      {isAdmin && !addingRow && (
        <Button
          variant="outline"
          className="gap-2 border-dashed border-zinc-700 text-zinc-400 hover:text-brand-cyan hover:border-brand-cyan/40 hover:bg-brand-cyan/5 transition-all"
          onClick={handleAddRow}
        >
          <Plus className="h-4 w-4" />
          Ajouter une ligne
        </Button>
      )}
    </div>
  );
}
