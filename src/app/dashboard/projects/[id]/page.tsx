import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { 
  Building2, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  ArrowLeft,
  FileText,
  Briefcase,
  CircleDollarSign
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AddStockDialog } from '@/components/stock/add-stock-dialog';
import { StockRowActions } from '@/components/stock/stock-row-actions';
import { Package } from 'lucide-react';

import { getAuthUser } from '@/lib/auth';

// Create a component that fetches everything.
export default async function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { user } = await getAuthUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch project, tasks, incoming/outgoing invoices and stock items in parallel
  const [
    projectRes,
    tasksRes,
    incomingInvoicesRes,
    outgoingInvoicesRes,
    stockItemsRes
  ] = await Promise.all([
    supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single(),
    supabase
      .from('tasks')
      .select('*, assignee:profiles!tasks_assigned_to_fkey(full_name)')
      .eq('project_id', id)
      .order('due_date', { ascending: true }),
    supabase
      .from('invoices')
      .select('*')
      .eq('project_id', id)
      .order('invoice_date', { ascending: false }),
    supabase
      .from('invoices_outgoing')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('stock_items')
      .select('*, invoice:invoices(invoice_number, vendor_name)')
      .eq('project_id', id)
      .order('created_at', { ascending: false })
  ]);

  const project = projectRes.data;
  if (!project) {
    redirect('/dashboard/projects');
  }

  const tasks = tasksRes.data;
  const incomingInvoices = incomingInvoicesRes.data;
  const outgoingInvoices = outgoingInvoicesRes.data;
  const stockItems = stockItemsRes.data;

  // Calculate Financials in-memory from fetched data to avoid redundant DB hits
  let actualRevenue = 0;
  let tvaCollected = 0;
  outgoingInvoices?.forEach((inv: any) => {
    if (inv.status === 'Payée') {
      actualRevenue += Number(inv.total || 0);
      tvaCollected += Number(inv.tax_amount || 0);
    }
  });

  let actualSpend = 0;
  let tvaPaid = 0;
  incomingInvoices?.forEach((inv: any) => {
    actualSpend += Number(inv.total_amount || 0);
    tvaPaid += Number(inv.tax || 0);
  });

  const financials = {
    estimatedCost: Number(project.estimated_cost || 0),
    estimatedProfit: Number(project.estimated_profit || 0),
    actualRevenue,
    actualSpend,
    actualProfit: actualRevenue - actualSpend,
    tvaCollected,
    tvaPaid,
    netTva: tvaCollected - tvaPaid,
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'planification': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'en cours': return 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20';
      case 'en pause': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'terminé': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'haute': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'moyenne': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      default: return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND' }).format(amount || 0);
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white" nativeButton={false} render={<Link href="/dashboard/projects" />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              {project.name}
            </h1>
            <Badge variant="outline" className={getStatusColor(project.status)}>
              {project.status}
            </Badge>
          </div>
          <p className="text-slate-400 mt-1 flex items-center gap-2">
             <Building2 className="w-4 h-4" /> {project.client_name}
          </p>
        </div>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="bg-slate-900/50 border border-slate-800 p-1 mb-6">
          <TabsTrigger value="details" className="data-active:bg-slate-800 flex gap-2">
            <FileText className="h-4 w-4 text-blue-500" />
            Détails
          </TabsTrigger>
          <TabsTrigger value="tasks" className="data-active:bg-slate-800 flex gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            Tâches ({tasks?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="invoices" className="data-active:bg-slate-800 flex gap-2">
            <Briefcase className="h-4 w-4 text-purple-500" />
            Factures
          </TabsTrigger>
          <TabsTrigger value="stock" className="data-active:bg-slate-800 flex gap-2">
            <Package className="h-4 w-4 text-orange-500" />
            Stock
          </TabsTrigger>
          <TabsTrigger value="finance" className="data-active:bg-slate-800 flex gap-2">
            <CircleDollarSign className="h-4 w-4 text-amber-500" />
            Finance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-0">
          <Card className="bg-slate-900/40 border-slate-800">
            <CardHeader>
              <CardTitle>Informations du projet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-slate-300">
                    <MapPin className="h-5 w-5 text-slate-500" />
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold">Localisation</p>
                      <p>{project.location || 'Non spécifié'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-slate-300">
                    <Calendar className="h-5 w-5 text-slate-500" />
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold">Date de début</p>
                      <p>{project.start_date ? format(new Date(project.start_date), 'dd MMM yyyy', { locale: fr }) : 'Non spécifié'}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  {project.description && (
                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                      <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Description</p>
                      <p className="text-sm text-slate-300 whitespace-pre-wrap">{project.description}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks?.length === 0 && (
              <div className="col-span-full py-12 text-center bg-slate-900/20 border border-dashed border-slate-800 rounded-xl">
                <p className="text-slate-500">Aucune tâche assignée à ce projet.</p>
              </div>
            )}
            {tasks?.map((task: any) => (
              <div key={task.id} className="bg-slate-900/40 border border-slate-800 rounded-xl p-5">
                <div className="flex justify-between items-start mb-3">
                  <Badge variant="outline" className={`capitalize px-2 ${getPriorityColor(task.priority)}`}>
                    {task.priority || 'Normale'}
                  </Badge>
                </div>
                <h3 className="font-semibold text-lg mb-1">{task.title}</h3>
                <p className="text-slate-500 text-sm mb-4 line-clamp-2">{task.description}</p>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800">
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                    <Calendar className="h-3.5 w-3.5" />
                    {task.due_date ? format(new Date(task.due_date), 'dd MMM', { locale: fr }) : '-'}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                    {task.status || 'À faire'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="invoices" className="mt-0 space-y-6">
          <Card className="bg-slate-900/40 border-slate-800">
            <CardHeader>
              <CardTitle className="text-blue-400">Factures Clients (Sortantes)</CardTitle>
            </CardHeader>
            <CardContent>
              {outgoingInvoices?.length === 0 ? (
                <p className="text-slate-500 text-sm italic">Aucune facture client trouvée.</p>
              ) : (
                <div className="space-y-3">
                  {outgoingInvoices?.map((inv: any) => (
                    <div key={inv.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-slate-950 border border-slate-800 gap-4 transition-all hover:border-slate-700">
                       <div className="flex items-center gap-4">
                          <span className="font-mono text-sm text-slate-300 bg-slate-900 px-2 py-1 rounded">{inv.invoice_number}</span>
                          <span className="text-xs text-slate-500">{format(new Date(inv.created_at), 'dd MMM yyyy', { locale: fr })}</span>
                       </div>
                       <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          <span className="font-bold text-blue-400 lg:text-lg">{formatCurrency(inv.total)}</span>
                          <Badge variant="outline" className="bg-slate-800 text-slate-300 border-slate-700 capitalize self-start sm:self-auto">
                            {inv.status || 'Brouillon'}
                          </Badge>
                       </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-900/40 border-slate-800">
            <CardHeader>
              <CardTitle className="text-emerald-400">Factures Fournisseurs (Entrantes)</CardTitle>
            </CardHeader>
            <CardContent>
              {incomingInvoices?.length === 0 ? (
                <p className="text-slate-500 text-sm italic">Aucune facture fournisseur scannée.</p>
              ) : (
                <div className="space-y-3">
                  {incomingInvoices?.map((inv: any) => (
                    <div key={inv.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-slate-950 border border-slate-800 gap-4 transition-all hover:border-slate-700">
                       <div className="flex items-center gap-4">
                          <span className="font-mono text-sm text-slate-300 bg-slate-900 px-2 py-1 rounded">{inv.invoice_number}</span>
                          <span className="font-semibold text-slate-300">{inv.vendor_name}</span>
                          <span className="text-xs text-slate-500 hidden md:block">{inv.invoice_date ? format(new Date(inv.invoice_date), 'dd MMM yyyy', { locale: fr }) : ''}</span>
                       </div>
                       <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          <span className="font-bold text-emerald-400 lg:text-lg">{formatCurrency(inv.total_amount)}</span>
                          <Badge variant="outline" className="bg-slate-800 text-slate-300 border-slate-700 capitalize self-start sm:self-auto">
                            {inv.status || 'À payer'}
                          </Badge>
                       </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stock" className="mt-0 space-y-6">
          <Card className="bg-slate-900/40 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-orange-400">Inventaire du projet</CardTitle>
              <AddStockDialog projectId={id} incomingInvoices={incomingInvoices || []} />
            </CardHeader>
            <CardContent>
              {(!stockItems || stockItems.length === 0) ? (
                <div className="py-12 text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/20">
                  <Package className="h-12 w-12 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">Le stock est vide</p>
                  <p className="text-slate-600 text-sm mt-1">Ajoutez des articles pour commencer le suivi.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-400 bg-slate-900 border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-3 rounded-tl-lg font-medium">Article</th>
                        <th className="px-4 py-3 font-medium text-right">Quantité</th>
                        <th className="px-4 py-3 font-medium">Unité</th>
                        <th className="px-4 py-3 font-medium">Facture liée</th>
                        <th className="px-4 py-3 font-medium text-right">Date d&apos;ajout</th>
                        <th className="px-4 py-3 rounded-tr-lg font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {stockItems.map((item: any) => (
                        <tr key={item.id} className="hover:bg-slate-900/50 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-200">{item.name}</p>
                            {item.description && <p className="text-xs text-slate-500 mt-1 line-clamp-1">{item.description}</p>}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-emerald-400 font-bold">{item.quantity}</td>
                          <td className="px-4 py-3 text-slate-400">{item.unit}</td>
                          <td className="px-4 py-3 text-slate-400 text-xs">
                            {item.invoice ? (
                              <div className="flex flex-col">
                                <span className="font-mono text-slate-300">{item.invoice.invoice_number}</span>
                                <span className="text-slate-500">{item.invoice.vendor_name}</span>
                              </div>
                            ) : '-'}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-500 text-xs">
                            {format(new Date(item.created_at), 'dd MMM yyyy', { locale: fr })}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <StockRowActions 
                              item={item} 
                              projectId={id}
                              incomingInvoices={incomingInvoices || []}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finance" className="mt-0 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-slate-900/40 border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-400">Profit Estimé</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(financials.estimatedProfit)}</div>
                <p className="text-xs text-slate-500 mt-1">Coût estimé: {formatCurrency(financials.estimatedCost)}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/40 border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-400">Bénéfice Réel (Actuel)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${financials.actualProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatCurrency(financials.actualProfit)}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Revenus: {formatCurrency(financials.actualRevenue)} | Dépenses: {formatCurrency(financials.actualSpend)}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/40 border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-400">Écart (Réel vs Estimé)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${(financials.actualProfit - financials.estimatedProfit) >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {formatCurrency(financials.actualProfit - financials.estimatedProfit)}
                </div>
                <p className="text-xs text-slate-500 mt-1">Différence de rentabilité</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card className="bg-slate-900/40 border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-400">TVA Collectée (Ventes)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-400">{formatCurrency(financials.tvaCollected)}</div>
                <p className="text-xs text-slate-500 mt-1">Collectée sur les factures clients payées</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/40 border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-400">TVA Déductible (Achats)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-400">{formatCurrency(financials.tvaPaid)}</div>
                <p className="text-xs text-slate-500 mt-1">Payée aux fournisseurs</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/40 border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-400">Solde TVA (TVA Net)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${financials.netTva >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatCurrency(financials.netTva)}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {financials.netTva >= 0 ? "Montant à reverser à l'État" : "Crédit de TVA de l'entreprise"}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
