'use client';

import { useEffect } from 'react';
import { Package } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AddStockDialog } from '@/components/stock/add-stock-dialog';
import { StockRowActions } from '@/components/stock/stock-row-actions';
import { useDashboardCache } from '@/context/dashboard-cache';

export default function StockPage() {
  const { stockItems, projects, incomingInvoices, fetchStockItems, fetchProjects, fetchIncomingInvoices } = useDashboardCache();

  useEffect(() => {
    fetchStockItems();
    fetchProjects();
    fetchIncomingInvoices();
  }, [fetchStockItems, fetchProjects, fetchIncomingInvoices]);

  const loadingData = !stockItems || !projects || !incomingInvoices;

  if (loadingData) {
    return (
      <div className="p-8 text-center text-slate-400">
        <Package className="h-8 w-8 animate-bounce mx-auto mb-4 text-orange-500" />
        <p className="font-medium">Chargement du stock...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent flex items-center gap-3">
            <Package className="h-8 w-8 text-orange-500" />
            Stock Global
          </h1>
          <p className="text-slate-400 mt-1">
            Gerez l'inventaire a travers tous vos projets
          </p>
        </div>
        <AddStockDialog 
          projects={projects || []} 
          incomingInvoices={incomingInvoices || []} 
        />
      </div>

      <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden">
        {(!stockItems || stockItems.length === 0) ? (
          <div className="py-16 text-center">
            <Package className="h-16 w-16 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-400 text-lg font-medium">Aucun article en stock</p>
            <p className="text-slate-500 mt-1">Ajoutez des articles pour commencer a suivre votre inventaire.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 bg-slate-900/80 border-b border-slate-800 uppercase">
                <tr>
                  <th className="px-6 py-4 font-semibold">Article</th>
                  <th className="px-6 py-4 font-semibold">Projet</th>
                  <th className="px-6 py-4 font-semibold text-right">Quantite</th>
                  <th className="px-6 py-4 font-semibold">Facture liee</th>
                  <th className="px-6 py-4 font-semibold text-right">Date d&apos;ajout</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {stockItems.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-200">{item.name}</p>
                      {item.description && <p className="text-xs text-slate-500 mt-1 line-clamp-1">{item.description}</p>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {item.project?.name || 'Inconnu'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-mono text-emerald-400 font-bold text-base">{item.quantity}</span>
                      <span className="text-slate-400 ml-1 text-xs">{item.unit}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {item.invoice ? (
                        <div className="flex flex-col">
                          <span className="font-mono text-slate-300">{item.invoice.invoice_number}</span>
                          <span className="text-slate-500">{item.invoice.vendor_name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-600 italic">Non liee</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-500 text-xs">
                      {format(new Date(item.created_at), 'dd MMM yyyy', { locale: fr })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <StockRowActions 
                        item={item} 
                        projects={projects || []}
                        incomingInvoices={incomingInvoices || []}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
