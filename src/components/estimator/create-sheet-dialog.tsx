'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle, Calculator, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { createEstimationSheet } from '@/app/dashboard/estimator/actions';

interface Project {
  id: string;
  name: string;
}

interface CreateSheetDialogProps {
  projects: Project[];
}

export function CreateSheetDialog({ projects }: CreateSheetDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    project_id: '',
    title: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.project_id || !form.title.trim()) {
      toast.error('Veuillez sélectionner un projet et saisir un titre.');
      return;
    }

    startTransition(async () => {
      try {
        const result = await createEstimationSheet({
          project_id: form.project_id,
          title: form.title.trim(),
          notes: form.notes.trim() || undefined,
        });
        toast.success('Feuille d\'estimation créée avec succès !');
        setOpen(false);
        setForm({ project_id: '', title: '', notes: '' });
        if (result.data?.id) {
          router.push(`/dashboard/estimator/${result.data.id}`);
        }
      } catch (err: any) {
        toast.error(err.message ?? 'Erreur lors de la création');
      }
    });
  };

  return (
    <>
      <Button
        className="bg-brand-cyan hover:bg-brand-cyan/90 text-zinc-950 font-bold gap-2"
        onClick={() => setOpen(true)}
      >
        <PlusCircle className="h-4 w-4" />
        Nouvelle Estimation
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>

      <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-black tracking-tight">
            <Calculator className="h-5 w-5 text-brand-cyan" />
            Nouvelle Feuille d&apos;Estimation
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Project */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
              Projet lié *
            </Label>
            <Select
              value={form.project_id}
              onValueChange={(val) => setForm((f) => ({ ...f, project_id: val ?? '' }))}
            >
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white focus:ring-brand-cyan/30">
                <SelectValue placeholder="Sélectionner un projet…" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {projects.map((p) => (
                  <SelectItem
                    key={p.id}
                    value={p.id}
                    className="text-zinc-200 focus:bg-zinc-700 focus:text-white"
                  >
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
              Titre de l&apos;estimation *
            </Label>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="ex: Estimation Initiale, Révision 2…"
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 focus:ring-brand-cyan/30"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
              Notes <span className="text-zinc-600 normal-case font-normal">(optionnel)</span>
            </Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Observations, hypothèses, contexte…"
              rows={3}
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 focus:ring-brand-cyan/30 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-brand-cyan hover:bg-brand-cyan/90 text-zinc-950 font-bold"
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Créer'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
      </Dialog>
    </>
  );
}
