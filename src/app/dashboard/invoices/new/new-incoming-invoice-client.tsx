'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Trash2, Save, ArrowLeft, Loader2, Calculator, ReceiptText, Store, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { createManualIncomingInvoice, updateIncomingInvoice } from '@/app/dashboard/invoices/actions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from '@/components/ui/separator';

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
}

export default function NewIncomingInvoiceClient({ 
  projects, 
  initialData 
}: { 
  projects: any[],
  initialData?: any
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [projectId, setProjectId] = useState<string>(initialData?.project_id || '');
  const [vendorName, setVendorName] = useState(initialData?.vendor_name || '');
  const [invoiceDate, setInvoiceDate] = useState(initialData?.invoice_date || '');
  const [invoiceNumber, setInvoiceNumber] = useState(initialData?.invoice_number || `FOU-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [taxPercentage, setTaxPercentage] = useState(initialData ? (initialData.tax / (initialData.total_amount - initialData.tax) * 100) : 19);
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [companyName, setCompanyName] = useState(initialData?.company_name || 'Corex Construction Tunisie');
  const [companyAddress, setCompanyAddress] = useState(initialData?.company_address || 'Boulevard de l\'Environnement, La Marsa, Tunis 2046');
  const [vendorTaxNumber, setVendorTaxNumber] = useState(initialData?.vendor_tax_number || '');
  
  const [lineItems, setLineItems] = useState<LineItem[]>(
    initialData?.line_items?.map((item: any, idx: number) => ({
      id: Math.random().toString(),
      ...item
    })) || [
      { id: '1', description: '', quantity: 1, unit_price: 0 }
    ]
  );

  // Fix tax percentage if initialData provided (recalculate from tax and subtotal if simple, or just use 19)
  // Actually, for construction in Tunisia, it's usually 19% or 13% or 7%.
  // We'll trust the user to adjust it.

  const subtotal = useMemo(() => {
    return lineItems.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);
  }, [lineItems]);

  const taxAmount = useMemo(() => {
    return (subtotal * taxPercentage) / 100;
  }, [subtotal, taxPercentage]);

  const total = useMemo(() => {
    return subtotal + taxAmount;
  }, [subtotal, taxAmount]);

  const addLineItem = () => {
    setLineItems([...lineItems, { id: Math.random().toString(), description: '', quantity: 1, unit_price: 0 }]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter(item => item.id !== id));
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    setLineItems(lineItems.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return toast.error('Veuillez sélectionner un projet');
    if (!vendorName) return toast.error('Veuillez entrer le nom du fournisseur');
    if (!invoiceDate) return toast.error('Veuillez entrer une date');

    setIsLoading(true);
    try {
      const payload = {
        invoice_number: invoiceNumber,
        project_id: projectId,
        vendor_name: vendorName,
        invoice_date: invoiceDate,
        line_items: lineItems.map(({ id, ...rest }) => rest),
        tax: taxAmount,
        total_amount: total,
        company_name: companyName,
        company_address: companyAddress,
        vendor_tax_number: vendorTaxNumber
      };

      if (initialData?.id) {
        await updateIncomingInvoice(initialData.id, payload);
        toast.success('Facture fournisseur mise à jour !');
      } else {
        await createManualIncomingInvoice(payload);
        toast.success('Facture fournisseur créée avec succès !');
      }

      router.push('/dashboard/invoices');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la création');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-10 w-10 text-slate-400">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              {initialData ? 'Modification Facture Fournisseur' : 'Saisie Facture Fournisseur'}
            </h1>
            <p className="text-slate-400 mt-1">
              {initialData ? 'Modifiez les informations de la facture fournisseur.' : 'Enregistrez une facture reçue d\'un de vos fournisseurs.'}
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" className="bg-slate-900/50 border-slate-800" onClick={() => router.back()}>
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {initialData ? 'Mettre à jour' : 'Enregistrer la Facture'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="bg-slate-900/40 border-slate-800">
            <CardHeader className="border-b border-slate-800/60 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <ReceiptText className="h-5 w-5 text-emerald-500" />
                Informations de la Facture
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-slate-400">Numéro de Facture</Label>
                <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className="bg-slate-950 border-slate-800" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400">Projet Associé</Label>
                <Select value={projectId} onValueChange={(val) => setProjectId(val || '')}>
                  <SelectTrigger className="bg-slate-950 border-slate-800">
                    <SelectValue placeholder="Choisir un projet..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-950 border-slate-800">
                    {projects.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400">Date de Facturation</Label>
                <Input 
                  type="date" 
                  value={invoiceDate} 
                  onChange={(e) => setInvoiceDate(e.target.value)} 
                  className="bg-slate-950 border-slate-800"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400">TVA (%)</Label>
                <Input 
                  type="number" 
                  value={taxPercentage} 
                  onChange={(e) => setTaxPercentage(parseFloat(e.target.value))} 
                  className="bg-slate-950 border-slate-800"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/40 border-slate-800">
            <CardHeader className="border-b border-slate-800/60 pb-4 flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="h-5 w-5 text-emerald-500" />
                Articles / Postes
              </CardTitle>
              <Button size="sm" onClick={addLineItem} className="bg-slate-800 hover:bg-slate-700 h-8">
                <Plus className="h-4 w-4 mr-1" /> Ajouter
              </Button>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {lineItems.map((item, index) => (
                <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-slate-950/40 p-4 rounded-xl border border-slate-800/60 relative group">
                  <div className="md:col-span-6 space-y-2">
                    <Label className="text-[10px] uppercase text-slate-500">Description</Label>
                    <Input 
                      placeholder="Désignation de l'article..." 
                      value={item.description}
                      onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                      className="bg-slate-950 border-slate-800 h-9"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label className="text-[10px] uppercase text-slate-500">Qté</Label>
                    <Input 
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value))}
                      className="bg-slate-950 border-slate-800 h-9"
                    />
                  </div>
                  <div className="md:col-span-3 space-y-2">
                    <Label className="text-[10px] uppercase text-slate-500">Prix Unit. (TND)</Label>
                    <Input 
                      type="number" 
                      step="0.001"
                      value={item.unit_price}
                      onChange={(e) => updateLineItem(item.id, 'unit_price', parseFloat(e.target.value))}
                      className="bg-slate-950 border-slate-800 h-9"
                    />
                  </div>
                  <div className="md:col-span-1 pb-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeLineItem(item.id)}
                      className="h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-red-400/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="bg-slate-900/40 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Store className="h-5 w-5 text-emerald-500" />
                Fournisseur
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-400">Nom du Fournisseur</Label>
                <Input value={vendorName} onChange={(e) => setVendorName(e.target.value)} placeholder="Ex: SOTUBO" className="bg-slate-950 border-slate-800" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400">Matricule Fiscale (Optionnel)</Label>
                <Input value={vendorTaxNumber} onChange={(e) => setVendorTaxNumber(e.target.value)} placeholder="0000000/M/A/M/000" className="bg-slate-950 border-slate-800" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/40 border-slate-800">
            <CardHeader shadow-sm>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-emerald-500" />
                Vos Informations (En-tête PDF)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-400">Votre Nom d'Entreprise</Label>
                <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="bg-slate-950 border-slate-800" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400">Votre Adresse</Label>
                <Textarea value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} className="bg-slate-950 border-slate-800 min-h-[80px]" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-5 text-emerald-500">
              <ReceiptText className="h-24 w-24" />
            </div>
            <CardHeader>
              <CardTitle className="text-lg">Récapitulatif Financier</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Sous-total</span>
                <span className="text-white font-mono">{subtotal.toFixed(3)} TND</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">TVA ({taxPercentage}%)</span>
                <span className="text-white font-mono">{taxAmount.toFixed(3)} TND</span>
              </div>
              <Separator className="bg-slate-800" />
              <div className="flex justify-between items-center pt-2">
                <span className="text-lg font-bold">Total TTC</span>
                <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400 font-mono">
                  {total.toFixed(3)} <span className="text-xs uppercase">TND</span>
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
