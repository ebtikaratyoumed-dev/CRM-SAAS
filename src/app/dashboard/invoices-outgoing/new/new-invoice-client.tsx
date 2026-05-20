'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Trash2, Save, ArrowLeft, Loader2, Calculator, ReceiptText, UserCircle, MapPin, Building2, Hash, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { createOutgoingInvoice } from '@/app/dashboard/invoices-outgoing/actions';
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

export default function NewInvoiceClient({ projects }: { projects: any[] }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [projectId, setProjectId] = useState<string>('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState(`FAC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [taxPercentage, setTaxPercentage] = useState(19);
  const [notes, setNotes] = useState('');
  
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: '1', description: '', quantity: 1, unit_price: 0 }
  ]);
  const [companyName, setCompanyName] = useState('COREX Construction');
  const [companyAddress, setCompanyAddress] = useState('Boulevard de l\'Environnement\nLa Marsa, Tunis 2046');
  const [companyTaxNumber, setCompanyTaxNumber] = useState('');
  const [companyEmail, setCompanyEmail] = useState('construction@corex.tn');

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
    if (!clientName) return toast.error('Veuillez entrer le nom du client');

    setIsLoading(true);
    try {
      await createOutgoingInvoice({
        invoice_number: invoiceNumber,
        project_id: projectId,
        client_name: clientName,
        client_address: clientAddress,
        client_email: clientEmail,
        line_items: lineItems.map(({ id, ...rest }) => rest),
        tax_percentage: taxPercentage,
        subtotal,
        tax_amount: taxAmount,
        total,
        notes,
        due_date: dueDate,
        company_name: companyName,
        company_address: companyAddress,
        company_tax_number: companyTaxNumber,
        company_email: companyEmail
      });

      toast.success('Facture client créée avec succès !');
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
              Nouvelle Facture Client
            </h1>
            <p className="text-slate-400 mt-1">Créez une facture professionnelle pour vos clients.</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" className="bg-slate-900/50 border-slate-800" onClick={() => router.back()}>
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/20"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Enregistrer la Facture
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Info */}
          <Card className="bg-slate-900/40 border-slate-800">
            <CardHeader className="border-b border-slate-800/60 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <ReceiptText className="h-5 w-5 text-blue-500" />
                Informations Générales
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
                <Label className="text-slate-400">Date d'échéance</Label>
                <Input 
                  type="date" 
                  value={dueDate} 
                  onChange={(e) => setDueDate(e.target.value)} 
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

          {/* Line Items */}
          <Card className="bg-slate-900/40 border-slate-800">
            <CardHeader className="border-b border-slate-800/60 pb-4 flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="h-5 w-5 text-emerald-500" />
                Articles & Prestations
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
                      placeholder="Service ou produit..." 
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

          <Card className="bg-slate-900/40 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">Notes & Conditions</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea 
                placeholder="Informations complémentaires, coordonnées bancaires..." 
                className="bg-slate-950 border-slate-800 min-h-[100px]"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Summary & Client Info */}
        <div className="space-y-8">
          <Card className="bg-slate-900/40 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserCircle className="h-5 w-5 text-purple-500" />
                Client
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-400">Nom du Client / Entreprise</Label>
                <Input value={clientName} onChange={(e) => setClientName(e.target.value)} className="bg-slate-950 border-slate-800" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400">Email</Label>
                <Input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} className="bg-slate-950 border-slate-800" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400">Adresse</Label>
                <Textarea value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} className="bg-slate-950 border-slate-800 h-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/40 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-emerald-500" />
                Votre Entreprise
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-400 font-medium">Nom de votre Entreprise</Label>
                <Input 
                  placeholder="Nom de l'entreprise..."
                  value={companyName} 
                  onChange={(e) => setCompanyName(e.target.value)} 
                  className="bg-slate-950 border-slate-800 focus:border-emerald-500/50" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400 flex items-center gap-2 font-medium">
                  <Mail className="h-3 w-3" /> Email
                </Label>
                <Input 
                  type="email" 
                  placeholder="votre@email.com"
                  value={companyEmail} 
                  onChange={(e) => setCompanyEmail(e.target.value)} 
                  className="bg-slate-950 border-slate-800 focus:border-emerald-500/50" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400 flex items-center gap-2 font-medium">
                  <Hash className="h-3 w-3" /> Matricule Fiscale (Optionnel)
                </Label>
                <Input 
                  placeholder="Ex: 0000000/A/P/M/000"
                  value={companyTaxNumber} 
                  onChange={(e) => setCompanyTaxNumber(e.target.value)} 
                  className="bg-slate-950 border-slate-800 focus:border-emerald-500/50" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400 flex items-center gap-2 font-medium">
                  <MapPin className="h-3 w-3" /> Adresse
                </Label>
                <Textarea 
                  placeholder="Adresse complète..."
                  value={companyAddress} 
                  onChange={(e) => setCompanyAddress(e.target.value)} 
                  className="bg-slate-950 border-slate-800 h-20 px-3 py-2 text-sm focus:border-emerald-500/50" 
                />
              </div>
            </CardContent>
          </Card>


          <Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <ReceiptText className="h-24 w-24" />
            </div>
            <CardHeader>
              <CardTitle className="text-lg">Résumé Financier</CardTitle>
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
                <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 font-mono">
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
