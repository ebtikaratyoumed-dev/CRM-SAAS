'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { diagnoseProjects, fixProjectsCreatedBy } from '@/app/dashboard/projects/diagnose';
import { AlertTriangle, CheckCircle2, Wrench, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function ProjectsDiagnostic() {
  const [result, setResult] = useState<any>(null);
  const [fixing, setFixing] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const runDiagnose = async () => {
    setLoading(true);
    try {
      const res = await diagnoseProjects();
      setResult(res);
    } catch (e: any) {
      setResult({ error: e.message });
    }
    setLoading(false);
  };

  const runFix = async () => {
    setFixing(true);
    try {
      const res = await fixProjectsCreatedBy();
      setResult(res);
      if (res.success) {
        // Refresh the page to show the now-visible projects
        setTimeout(() => router.refresh(), 500);
      }
    } catch (e: any) {
      setResult({ error: e.message });
    }
    setFixing(false);
  };

  return (
    <div className="col-span-full py-12 bg-slate-900/20 border border-dashed border-slate-800 rounded-3xl space-y-4">
      <div className="text-center space-y-2">
        <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto" />
        <p className="text-slate-400 font-medium">Aucun projet visible — un problème de permissions RLS est probable.</p>
        <p className="text-slate-500 text-sm">
          Vos projets existent peut-être dans la base de données mais sont masqués par les politiques de sécurité.
        </p>
      </div>

      <div className="flex justify-center gap-3 mt-4">
        <Button
          onClick={runDiagnose}
          disabled={loading}
          variant="outline"
          className="gap-2 border-slate-700 text-slate-300 hover:bg-slate-800"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wrench className="h-4 w-4" />}
          Diagnostiquer
        </Button>

        {result && result.projectsWithNullCreatedBy > 0 && (
          <Button
            onClick={runFix}
            disabled={fixing}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {fixing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Corriger ({result.projectsWithNullCreatedBy} projet{result.projectsWithNullCreatedBy > 1 ? 's' : ''})
          </Button>
        )}
      </div>

      {result && (
        <div className="max-w-md mx-auto mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono">
          {result.error ? (
            <p className="text-red-400">❌ {result.error}</p>
          ) : result.success ? (
            <div className="text-emerald-400 space-y-1">
              <p>✅ Corrigé avec succès !</p>
              <p>{result.fixedCount} projet(s) réparé(s). Rechargement en cours...</p>
            </div>
          ) : (
            <div className="space-y-1 text-slate-300">
              <p>📊 <span className="text-white font-bold">{result.totalInDatabase}</span> projets dans la DB</p>
              <p>👁️ <span className="text-white font-bold">{result.visibleViaRLS}</span> visibles (via RLS)</p>
              <p>⚠️ <span className="text-amber-400 font-bold">{result.projectsWithNullCreatedBy}</span> sans propriétaire (created_by = NULL)</p>
              {result.nullProjects?.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-800">
                  <p className="text-slate-500 mb-1">Projets masqués :</p>
                  {result.nullProjects.map((p: any) => (
                    <p key={p.id} className="text-amber-300">• {p.name}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
