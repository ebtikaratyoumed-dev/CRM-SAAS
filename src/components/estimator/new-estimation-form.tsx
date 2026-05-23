'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Pickaxe,
  Layers,
  Grid,
  Square,
  Table as TableIcon,
  BrickWall,
  Paintbrush,
  Grid3x3,
  Wrench,
  Layout,
  ChevronsDown,
  Umbrella,
  Calculator,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  Info,
  Check,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { ESTIMATOR_CATEGORIES } from '@/lib/estimator/categories';
import { calculateEstimation, DEFAULT_PRICES } from '@/lib/estimator/formulas';
import { EstimatorInputs, EstimatorResult } from '@/lib/estimator/types';

const ICON_MAP: Record<string, any> = {
  Pickaxe: Pickaxe,
  Layers: Layers,
  Grid: Grid,
  SquareDot: Square,
  TableRows: TableIcon,
  BrickWall: BrickWall,
  Paintbrush: Paintbrush,
  Grid3X3: Grid3x3,
  Wrench: Wrench,
  FoldDown: ChevronsDown,
  Umbrella: Umbrella,
};

export default function NewEstimationForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();

  // Step 1 State: General info (Custom texts, no DB projects)
  const [title, setTitle] = useState('');
  const [projectName, setProjectName] = useState('');
  const [notes, setNotes] = useState('');

  // Step 2 State: Selected work categories
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [concreteConversion, setConcreteConversion] = useState(true);

  // Step 3 State: Dynamic inputs for each category
  const [inputData, setInputData] = useState<Record<string, Record<string, any>>>({});

  // Overridden prices: material_name -> overridden price
  const [overriddenPrices, setOverriddenPrices] = useState<Record<string, number>>({});

  // Live calculation results
  const [calculatedItems, setCalculatedItems] = useState<EstimatorResult[]>([]);

  // Initialize inputData with default values from categories registry
  useEffect(() => {
    const initialInputs: Record<string, Record<string, any>> = {};
    ESTIMATOR_CATEGORIES.forEach((cat) => {
      initialInputs[cat.id] = {};
      cat.fields.forEach((f) => {
        initialInputs[cat.id][f.name] = f.defaultValue;
      });
    });
    setInputData(initialInputs);
  }, []);

  // Recalculate materials live whenever dimensions or selections change
  useEffect(() => {
    // Construct the inputs payload
    const inputs: EstimatorInputs = {
      concrete_conversion: concreteConversion,
    };

    selectedCategories.forEach((catId) => {
      inputs[catId as keyof EstimatorInputs] = inputData[catId] as any;
    });

    const results = calculateEstimation(inputs);

    // Apply any user overridden prices to the results
    const resultsWithPrices = results.map((item) => {
      const price = overriddenPrices[item.material_name] !== undefined
        ? overriddenPrices[item.material_name]
        : item.unit_price;
      return {
        ...item,
        unit_price: price,
        total_price: Math.round(item.quantity * price * 100) / 100,
      };
    });

    setCalculatedItems(resultsWithPrices);
  }, [selectedCategories, inputData, concreteConversion, overriddenPrices]);

  const handleCategoryToggle = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleInputChange = (categoryId: string, fieldName: string, value: any) => {
    setInputData((prev) => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        [fieldName]: value,
      },
    }));
  };

  const handlePriceChange = (materialName: string, val: string) => {
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      setOverriddenPrices((prev) => ({
        ...prev,
        [materialName]: num,
      }));
    } else if (val === '') {
      setOverriddenPrices((prev) => ({
        ...prev,
        [materialName]: 0,
      }));
    }
  };

  const handleResetPrice = (materialName: string) => {
    setOverriddenPrices((prev) => {
      const updated = { ...prev };
      delete updated[materialName];
      return updated;
    });
  };

  const validateStep = (currentStep: number) => {
    if (currentStep === 1) {
      if (!title.trim()) {
        toast.error('Veuillez saisir un titre pour cette estimation.');
        return false;
      }
    }
    if (currentStep === 2) {
      if (selectedCategories.length === 0) {
        toast.error('Veuillez sélectionner au moins une catégorie de travaux.');
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep((s) => s + 1);
    }
  };

  const prevStep = () => {
    setStep((s) => s - 1);
  };

  const handleSubmit = () => {
    if (!validateStep(1) || !validateStep(2)) return;

    startTransition(async () => {
      try {
        const response = await fetch('/api/estimator-pdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: title.trim(),
            projectName: projectName.trim() || undefined,
            notes: notes.trim() || undefined,
            items: calculatedItems,
          }),
        });

        if (!response.ok) {
          throw new Error('Erreur lors de la génération du PDF');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `estimation-${title.trim().replace(/\s+/g, '-')}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

        toast.success('PDF généré et téléchargé avec succès !');
      } catch (err: any) {
        toast.error(err.message ?? 'Erreur lors de la génération du PDF');
      }
    });
  };

  const grandTotal = calculatedItems.reduce((sum, item) => sum + item.total_price, 0);

  const fmt = (n: number) =>
    new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 2,
    }).format(n);

  return (
    <div className="space-y-6">
      {/* ── Progress Stepper ── */}
      <div className="flex items-center justify-between max-w-xl mx-auto px-4 py-2 bg-zinc-900/60 border border-zinc-800 rounded-full">
        {[1, 2, 3].map((num) => (
          <div key={num} className="flex items-center gap-2">
            <span
              className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${
                step === num
                  ? 'bg-brand-cyan text-zinc-950 ring-4 ring-brand-cyan/20 scale-110'
                  : step > num
                  ? 'bg-emerald-500 text-zinc-950'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {step > num ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : num}
            </span>
            <span
              className={`text-xs font-bold uppercase tracking-widest hidden sm:inline ${
                step === num ? 'text-white' : 'text-zinc-500'
              }`}
            >
              {num === 1 ? 'Général' : num === 2 ? 'Travaux' : 'Dimensions & Prix'}
            </span>
            {num < 3 && <div className="h-px w-8 sm:w-16 bg-zinc-800" />}
          </div>
        ))}
      </div>

      {/* ── Step Panels ── */}
      <div className="animate-in fade-in duration-300">
        {step === 1 && (
          <div className="max-w-xl mx-auto rounded-3xl border border-zinc-800 bg-zinc-900/40 p-8 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black tracking-tight text-white">Informations Générales</h2>
              <p className="text-zinc-400 text-sm">Donnez un titre et des références personnalisées à votre estimation.</p>
            </div>

            <div className="space-y-5">
              {/* Title Input */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Titre de l&apos;estimation *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="ex: Villa Jasmin - Terrassement & Gros Œuvre..."
                  className="bg-zinc-850 border-zinc-800 text-white placeholder:text-zinc-600 focus:ring-brand-cyan/20 h-11"
                />
              </div>

              {/* Project / Client Name Input */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Nom du Projet / Client <span className="text-zinc-650 font-normal normal-case">(optionnel)</span></Label>
                <Input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="ex: M. Ben Ali, Chantier Carthage..."
                  className="bg-zinc-850 border-zinc-800 text-white placeholder:text-zinc-600 focus:ring-brand-cyan/20 h-11"
                />
              </div>

              {/* Notes Input */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Notes & Observations <span className="text-zinc-600 font-normal normal-case">(optionnel)</span></Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes imprimées sur le PDF (durée de validité du devis, hypothèses...)"
                  rows={4}
                  className="bg-zinc-850 border-zinc-800 text-white placeholder:text-zinc-600 focus:ring-brand-cyan/20 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={nextStep} className="bg-brand-cyan hover:bg-brand-cyan/90 text-zinc-950 font-bold gap-2 px-6 h-11">
                Suivant <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="max-w-4xl mx-auto rounded-3xl border border-zinc-800 bg-zinc-900/40 p-8 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black tracking-tight text-white">Sélection des Travaux</h2>
              <p className="text-zinc-400 text-sm">Cochez les catégories de travaux à inclure dans cette feuille d&apos;estimation.</p>
            </div>

            {/* Grid of Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {ESTIMATOR_CATEGORIES.map((cat) => {
                const IconComponent = ICON_MAP[cat.iconName] || Pickaxe;
                const isSelected = selectedCategories.includes(cat.id);
                return (
                  <div
                    key={cat.id}
                    onClick={() => handleCategoryToggle(cat.id)}
                    className={`cursor-pointer group flex flex-col p-5 rounded-2xl border transition-all duration-300 relative ${
                      isSelected
                        ? 'bg-brand-cyan/5 border-brand-cyan/40 hover:border-brand-cyan/60 shadow-lg shadow-brand-cyan/5'
                        : 'bg-zinc-950/40 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`p-3 rounded-xl ${isSelected ? 'bg-brand-cyan/10 text-brand-cyan' : 'bg-zinc-900 text-zinc-400'}`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div
                        className={`h-5 w-5 rounded-full border flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-brand-cyan border-brand-cyan text-zinc-950'
                            : 'border-zinc-700 group-hover:border-zinc-500'
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                    </div>

                    <h3 className="font-black text-white text-base mt-4">{cat.name}</h3>
                    <p className="text-xs text-zinc-500 mt-1 flex-grow">{cat.description}</p>
                  </div>
                );
              })}
            </div>

            {/* Concrete Conversion Option */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
              <div className="space-y-1">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <Info className="h-4 w-4 text-brand-cyan" />
                  Conversion automatique du béton armé
                </h4>
                <p className="text-xs text-zinc-500 max-w-xl">
                  Si activé, le système convertira automatiquement le volume total de béton structurel calculé (poteaux, semelles, dalles, escalier) en ciment (350kg/m³), sable (0.4m³), gravier (0.8m³) et eau (175L).
                </p>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="concrete-conversion"
                  checked={concreteConversion}
                  onChange={(e) => setConcreteConversion(e.target.checked)}
                  className="h-5 w-5 rounded border-zinc-700 bg-zinc-850 text-brand-cyan focus:ring-brand-cyan/20 cursor-pointer accent-brand-cyan"
                />
                <Label htmlFor="concrete-conversion" className="ml-2.5 text-sm font-bold text-zinc-300 cursor-pointer select-none">
                  Activer la conversion
                </Label>
              </div>
            </div>

            <div className="flex justify-between pt-6">
              <Button variant="outline" onClick={prevStep} className="border-zinc-850 text-zinc-400 hover:bg-zinc-800 hover:text-white gap-2 h-11 px-5">
                <ChevronLeft className="h-4 w-4" /> Retour
              </Button>
              <Button onClick={nextStep} className="bg-brand-cyan hover:bg-brand-cyan/90 text-zinc-950 font-bold gap-2 px-6 h-11">
                Suivant <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 max-w-[1600px] mx-auto">
            {/* Left Column: Input Fields (6 cols) */}
            <div className="xl:col-span-5 space-y-6">
              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                  <div>
                    <h2 className="text-xl font-black text-white">Saisie des Dimensions</h2>
                    <p className="text-zinc-500 text-xs mt-0.5">Remplissez les dimensions des éléments de construction.</p>
                  </div>
                  <Calculator className="h-5 w-5 text-brand-cyan animate-pulse" />
                </div>

                <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  {ESTIMATOR_CATEGORIES.filter((cat) => selectedCategories.includes(cat.id)).map((cat) => {
                    const IconComponent = ICON_MAP[cat.iconName] || Pickaxe;
                    return (
                      <div key={cat.id} className="rounded-2xl border border-zinc-800 bg-zinc-950/20 p-5 space-y-4">
                        <h3 className="font-black text-white flex items-center gap-2 text-sm uppercase tracking-wider text-brand-cyan border-b border-zinc-800/40 pb-2">
                          <IconComponent className="h-4 w-4" />
                          {cat.name}
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {cat.fields.map((f) => (
                            <div key={f.name} className="space-y-2">
                              <Label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{f.label}</Label>
                              {f.type === 'number' ? (
                                <div className="relative">
                                  <Input
                                    type="number"
                                    step={f.step}
                                    min={f.min}
                                    value={inputData[cat.id]?.[f.name] ?? ''}
                                    onChange={(e) => handleInputChange(cat.id, f.name, parseFloat(e.target.value))}
                                    className="bg-zinc-850 border-zinc-800 text-white placeholder:text-zinc-600 focus:ring-brand-cyan/20 h-10 pr-10 font-medium"
                                  />
                                  {f.unit && (
                                    <span className="absolute right-3 top-2.5 text-xs font-black text-zinc-500 uppercase tracking-widest">
                                      {f.unit}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <Select
                                  value={inputData[cat.id]?.[f.name] ?? ''}
                                  onValueChange={(val) => handleInputChange(cat.id, f.name, val)}
                                >
                                  <SelectTrigger className="bg-zinc-850 border-zinc-800 text-white focus:ring-brand-cyan/20 h-10">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-zinc-850 border-zinc-800">
                                    {f.options?.map((opt) => (
                                      <SelectItem key={opt.value} value={opt.value} className="text-zinc-200 focus:bg-zinc-850 focus:text-white">
                                        {opt.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-4 border-t border-zinc-800 pt-6">
                  <Button variant="outline" onClick={prevStep} className="flex-1 border-zinc-850 text-zinc-400 hover:bg-zinc-800 hover:text-white gap-2 h-11">
                    <ChevronLeft className="h-4 w-4" /> Travaux
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isPending}
                    className="flex-1 bg-brand-cyan hover:bg-brand-cyan/90 text-zinc-950 font-bold gap-2 h-11"
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>Générer & Télécharger le PDF</>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Right Column: Live Material Preview & Price Override (7 cols) */}
            <div className="xl:col-span-7 space-y-6">
              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-6 flex flex-col h-full">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                  <div>
                    <h2 className="text-xl font-black text-white">Matériaux Estimés & Prix unitaires</h2>
                    <p className="text-zinc-500 text-xs mt-0.5">Vérifiez les quantités et personnalisez les prix unitaires en TND.</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">Coût estimé total</span>
                    <p className="text-2xl font-black text-brand-cyan tracking-tight">{fmt(grandTotal)}</p>
                  </div>
                </div>

                {/* Materials list */}
                <div className="flex-grow overflow-x-auto max-h-[60vh] custom-scrollbar">
                  {calculatedItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center text-zinc-600">
                      <AlertTriangle className="h-10 w-10 text-zinc-700 mb-2" />
                      <p className="text-sm font-bold">Aucun matériau calculé</p>
                      <p className="text-xs mt-1 max-w-xs">Sélectionnez des travaux et saisissez des dimensions pour voir les estimations.</p>
                    </div>
                  ) : (
                    <table className="w-full text-sm text-left text-zinc-300">
                      <thead className="text-[10px] uppercase font-black tracking-widest text-zinc-500 border-b border-zinc-800">
                        <tr>
                          <th className="pb-3 pl-2">Désignation Matériau</th>
                          <th className="pb-3">Catégorie</th>
                          <th className="pb-3 text-right">Quantité</th>
                          <th className="pb-3 text-right pl-6" style={{ width: '130px' }}>P.U. (TND)</th>
                          <th className="pb-3 text-right pr-2">Total (TND)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-850">
                        {calculatedItems.map((item, idx) => {
                          const isOverridden = overriddenPrices[item.material_name] !== undefined;
                          return (
                            <tr key={idx} className="hover:bg-zinc-850/20 transition-colors group">
                              <td className="py-3.5 pl-2 font-semibold text-white">
                                <div>
                                  {item.material_name}
                                  <span className="block text-[10px] text-zinc-500 font-normal mt-0.5 font-mono">
                                    {item.formula_note}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3.5">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-zinc-850 text-zinc-400">
                                  {item.category}
                                </span>
                              </td>
                              <td className="py-3.5 text-right font-bold text-zinc-200">
                                {item.quantity.toLocaleString('fr-TN')} {item.unit}
                              </td>
                              <td className="py-3.5 text-right pl-6">
                                <div className="flex items-center justify-end gap-1.5">
                                  <Input
                                    type="number"
                                    value={item.unit_price}
                                    onChange={(e) => handlePriceChange(item.material_name, e.target.value)}
                                    className={`h-8 w-24 text-right bg-zinc-950 border text-xs focus:ring-brand-cyan/20 ${
                                      isOverridden
                                        ? 'border-brand-cyan text-brand-cyan font-bold'
                                        : 'border-zinc-800 text-zinc-400'
                                    }`}
                                  />
                                  {isOverridden && (
                                    <button
                                      onClick={() => handleResetPrice(item.material_name)}
                                      title="Réinitialiser au prix par défaut"
                                      className="text-zinc-600 hover:text-amber-500 transition-colors"
                                    >
                                      <RotateCcw className="h-3 w-3" />
                                    </button>
                                  )}
                                </div>
                              </td>
                              <td className="py-3.5 text-right pr-2 font-mono font-bold text-white">
                                {fmt(item.total_price)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
