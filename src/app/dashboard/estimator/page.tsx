import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Calculator } from 'lucide-react';
import NewEstimationForm from '@/components/estimator/new-estimation-form';

export const metadata = {
  title: 'Estimateur de Matériaux | CoreX',
  description: 'Générez des estimations de matériaux de construction et exportez-les au format PDF.',
};

export default async function EstimatorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Calculator className="h-8 w-8 text-brand-cyan" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-brand-cyan">
              Estimateur de Matériaux
            </span>
          </h1>
          <p className="text-zinc-400 mt-1 font-medium text-sm">
            Entrez vos dimensions de chantier et générez instantanément un devis de matériaux au format PDF, sans enregistrement en base de données.
          </p>
        </div>
      </div>

      {/* ── Direct form view ── */}
      <NewEstimationForm />
    </div>
  );
}
