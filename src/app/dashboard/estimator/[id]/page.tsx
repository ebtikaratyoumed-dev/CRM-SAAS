import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import {
  Calculator,
  ArrowLeft,
  Download,
  Briefcase,
  Calendar,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EstimationTable } from '@/components/estimator/estimation-table';
import { SheetStatusBadge } from '@/components/estimator/sheet-status-badge';
import { DeleteSheetButton } from '@/components/estimator/delete-sheet-button';
import { ESTIMATOR_CATEGORIES } from '@/lib/estimator/categories';

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-TN', {
    style: 'currency',
    currency: 'TND',
    minimumFractionDigits: 2,
  }).format(n);

export default async function EstimatorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isAdmin = profile?.role === 'admin';

  const { data: sheet, error } = await supabase
    .from('estimation_sheets')
    .select(`
      *,
      project:projects(id, name),
      estimation_items(*)
    `)
    .eq('id', id)
    .order('sort_order', { referencedTable: 'estimation_items', ascending: true })
    .single();

  if (error || !sheet) notFound();

  const items = (sheet.estimation_items as any[]) ?? [];
  const grandTotal = items.reduce(
    (sum: number, item: any) => sum + (item.total_price ?? 0),
    0
  );

  const rawInputs = sheet.input_data as Record<string, any> | null;

  return (
    <div className="p-6 lg:p-8 space-y-8 animate-in fade-in duration-500">
      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/dashboard/estimator"
          className="flex items-center gap-1 text-zinc-500 hover:text-brand-cyan transition-colors font-medium"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Estimateur
        </Link>
        <span className="text-zinc-700">/</span>
        <span className="text-zinc-400 truncate max-w-[200px] font-medium">{sheet.title}</span>
      </div>

      {/* ── Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-cyan/10">
              <Calculator className="h-6 w-6 text-brand-cyan" />
            </div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white">
              {sheet.title}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500">
            {/* Project */}
            <span className="flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 text-zinc-600" />
              <span className="font-medium text-zinc-300">
                {(sheet.project as any)?.name ?? 'Projet non défini'}
              </span>
            </span>

            {/* Date */}
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-zinc-600" />
              {format(new Date(sheet.created_at), 'dd MMMM yyyy', { locale: fr })}
            </span>

            {/* Items count */}
            <span className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-zinc-600" />
              {items.length} ligne{items.length !== 1 ? 's' : ''}
            </span>
          </div>

          {sheet.notes && (
            <p className="text-sm text-zinc-500 max-w-xl leading-relaxed bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2.5 italic">
              {sheet.notes}
            </p>
          )}
        </div>

        {/* ── Actions ── */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <SheetStatusBadge
            sheetId={sheet.id}
            status={sheet.status as 'Brouillon' | 'Validé' | 'Archivé'}
            isAdmin={isAdmin}
          />

          <Link href={`/api/estimator-pdf/${sheet.id}`} target="_blank">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all"
            >
              <Download className="h-3.5 w-3.5" />
              Exporter PDF
            </Button>
          </Link>

          {isAdmin && <DeleteSheetButton sheetId={sheet.id} />}
        </div>
      </div>

      {/* ── Grand total summary card ── */}
      {items.length > 0 && (
        <div className="flex items-center justify-between rounded-2xl border border-brand-cyan/20 bg-gradient-to-r from-brand-cyan/5 to-brand-blue/5 px-6 py-4">
          <div>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">
              Coût total estimé
            </p>
            <p className="text-3xl font-black tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-cyan to-brand-blue">
                {fmt(grandTotal)}
              </span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">
              Lignes
            </p>
            <p className="text-3xl font-black text-zinc-300">{items.length}</p>
          </div>
        </div>
      )}

      {/* ── Calculation Parameters (Collapsible) ── */}
      {rawInputs && (
        <details className="group rounded-2xl border border-zinc-800 bg-zinc-900/20 overflow-hidden [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-zinc-800/30 transition-colors select-none">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-brand-cyan" />
              <span className="text-sm font-bold text-zinc-300">Dimensions et paramètres de calcul</span>
            </div>
            <span className="text-xs font-black text-brand-cyan uppercase tracking-widest group-open:hidden">Afficher</span>
            <span className="text-xs font-black text-brand-cyan uppercase tracking-widest hidden group-open:inline">Masquer</span>
          </summary>
          <div className="px-6 pb-6 pt-4 border-t border-zinc-800/40 space-y-6 bg-zinc-950/20 animate-in slide-in-from-top-4 duration-350">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ESTIMATOR_CATEGORIES.filter((cat) => rawInputs[cat.id]).map((cat) => {
                const catInputs = rawInputs[cat.id];
                return (
                  <div key={cat.id} className="space-y-2">
                    <h4 className="text-xs font-black text-brand-cyan uppercase tracking-wider">{cat.name}</h4>
                    <div className="bg-zinc-900/40 rounded-xl border border-zinc-850 p-4 space-y-2.5">
                      {cat.fields.map((f) => {
                        const val = catInputs[f.name];
                        let displayVal = val;
                        if (f.type === 'select') {
                          displayVal = f.options?.find((opt) => opt.value === val)?.label ?? val;
                        } else if (f.unit) {
                          displayVal = `${val} ${f.unit}`;
                        }
                        return (
                          <div key={f.name} className="flex justify-between text-xs">
                            <span className="text-zinc-500 font-medium">{f.label}</span>
                            <span className="font-bold text-zinc-300">{displayVal}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {rawInputs.concrete_conversion !== undefined && (
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 border-t border-zinc-850 pt-4">
                <span>CONVERSION DES MATÉRIAUX BÉTON :</span>
                <span className={rawInputs.concrete_conversion ? 'text-emerald-400' : 'text-zinc-600'}>
                  {rawInputs.concrete_conversion ? 'ACTIVÉE (Dosage 350kg/m³)' : 'DÉSACTIVÉE'}
                </span>
              </div>
            )}
          </div>
        </details>
      )}

      {/* ── Estimation table ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-1 w-4 bg-brand-cyan rounded-full" />
          <h2 className="text-sm font-black text-zinc-400 uppercase tracking-widest">
            Lignes d&apos;estimation
          </h2>
        </div>

        <EstimationTable
          sheetId={sheet.id}
          initialItems={items}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  );
}
