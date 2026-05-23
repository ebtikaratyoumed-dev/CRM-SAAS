import {
  EstimatorInputs,
  EstimatorResult,
  TerrassementInputs,
  BetonPropreteInputs,
  SemellesLongrinesPoutresInputs,
  PoteauxInputs,
  DallePlancherInputs,
  MaconnerieInputs,
  EnduitPeintureInputs,
  CarrelageInputs,
  AcierInputs,
  CoffrageInputs,
  EscalierInputs,
  ToitureEtancheiteInputs,
} from './types';

// Default unit prices in TND (can be overridden by user)
export const DEFAULT_PRICES: Record<string, number> = {
  'Fouilles en rigole (terrassement)': 25, // TND/m³
  'Béton de propreté': 180, // TND/m³
  'Béton pour Semelles/Longrines/Poutres': 250, // TND/m³
  'Béton pour Poteaux': 270, // TND/m³
  'Béton pour Dalle/Plancher': 260, // TND/m³
  'Béton pour Escalier': 280, // TND/m³
  'Briques 8 trous (cloison)': 1.2, // TND/unité
  'Briques 12 trous (double cloison)': 1.8, // TND/unité
  'Enduit (Monocouche/Mortier)': 15, // TND/m²
  'Peinture de finition': 12, // TND/m²
  'Carrelage sol': 45, // TND/m²
  'Acier HA': 3.5, // TND/kg
  'Coffrage bois/métallique': 20, // TND/m²
  'Étanchéité toiture': 35, // TND/m²
  // Concrete conversion ingredients:
  'Ciment (dosage 350kg/m³)': 0.5, // TND/kg (~25 TND per 50kg bag)
  'Sable': 40, // TND/m³
  'Gravier': 45, // TND/m³
  'Eau': 0.005, // TND/L
};

export function calculateTerrassement(inputs: TerrassementInputs): EstimatorResult[] {
  const { length, width, depth } = inputs;
  const quantity = length * width * depth;
  const material_name = 'Fouilles en rigole (terrassement)';
  const unit_price = DEFAULT_PRICES[material_name] ?? 0;

  return [{
    material_name,
    category: 'Terrassement',
    unit: 'm³',
    quantity: Math.round(quantity * 100) / 100,
    unit_price,
    total_price: Math.round(quantity * unit_price * 100) / 100,
    formula_note: `L × l × h = ${length}m × ${width}m × ${depth}m`,
  }];
}

export function calculateBetonProprete(inputs: BetonPropreteInputs): EstimatorResult[] {
  const { surface, thickness } = inputs;
  const quantity = surface * thickness;
  const material_name = 'Béton de propreté';
  const unit_price = DEFAULT_PRICES[material_name] ?? 0;

  return [{
    material_name,
    category: 'Béton de propreté',
    unit: 'm³',
    quantity: Math.round(quantity * 100) / 100,
    unit_price,
    total_price: Math.round(quantity * unit_price * 100) / 100,
    formula_note: `S × e = ${surface}m² × ${thickness}m`,
  }];
}

export function calculateSemellesLongrinesPoutres(inputs: SemellesLongrinesPoutresInputs): EstimatorResult[] {
  const { width, height, length } = inputs;
  const quantity = width * height * length;
  const material_name = 'Béton pour Semelles/Longrines/Poutres';
  const unit_price = DEFAULT_PRICES[material_name] ?? 0;

  return [{
    material_name,
    category: 'Béton Structurel',
    unit: 'm³',
    quantity: Math.round(quantity * 100) / 100,
    unit_price,
    total_price: Math.round(quantity * unit_price * 100) / 100,
    formula_note: `l × h × L = ${width}m × ${height}m × ${length}m`,
  }];
}

export function calculatePoteaux(inputs: PoteauxInputs): EstimatorResult[] {
  const { dimA, dimB, height, count } = inputs;
  const quantity = dimA * dimB * height * count;
  const material_name = 'Béton pour Poteaux';
  const unit_price = DEFAULT_PRICES[material_name] ?? 0;

  return [{
    material_name,
    category: 'Béton Structurel',
    unit: 'm³',
    quantity: Math.round(quantity * 100) / 100,
    unit_price,
    total_price: Math.round(quantity * unit_price * 100) / 100,
    formula_note: `a × b × h × N = ${dimA}m × ${dimB}m × ${height}m × ${count}`,
  }];
}

export function calculateDallePlancher(inputs: DallePlancherInputs): EstimatorResult[] {
  const { surface, thickness } = inputs;
  const quantity = surface * thickness;
  const material_name = 'Béton pour Dalle/Plancher';
  const unit_price = DEFAULT_PRICES[material_name] ?? 0;

  return [{
    material_name,
    category: 'Béton Structurel',
    unit: 'm³',
    quantity: Math.round(quantity * 100) / 100,
    unit_price,
    total_price: Math.round(quantity * unit_price * 100) / 100,
    formula_note: `S × e = ${surface}m² × ${thickness}m`,
  }];
}

export function calculateMaconnerie(inputs: MaconnerieInputs): EstimatorResult[] {
  const { length, height, brickType } = inputs;
  const surface = length * height;
  const bricksPerM2 = brickType === 'cloison8' ? 25 : 33;
  const lossRate = 0.04; // 4% average loss
  const quantity = Math.ceil(surface * bricksPerM2 * (1 + lossRate));
  const material_name = brickType === 'cloison8' ? 'Briques 8 trous (cloison)' : 'Briques 12 trous (double cloison)';
  const unit_price = DEFAULT_PRICES[material_name] ?? 0;

  return [{
    material_name,
    category: 'Maçonnerie',
    unit: 'unité',
    quantity,
    unit_price,
    total_price: Math.round(quantity * unit_price * 100) / 100,
    formula_note: `S × n × (1 + loss) = (${length}m × ${height}m) × ${bricksPerM2} briques/m² × 1.04`,
  }];
}

export function calculateEnduitPeinture(inputs: EnduitPeintureInputs): EstimatorResult[] {
  const { length, height, openingsArea } = inputs;
  const surface = Math.max(0, length * height - openingsArea);

  // Enduit (no loss specified in sheet, using exact net surface)
  const enduitMaterial = 'Enduit (Monocouche/Mortier)';
  const enduitPrice = DEFAULT_PRICES[enduitMaterial] ?? 0;

  // Peinture (5% loss rate specified in coefficients table)
  const peintureMaterial = 'Peinture de finition';
  const peinturePrice = DEFAULT_PRICES[peintureMaterial] ?? 0;
  const peintureQty = surface * 1.05;

  return [
    {
      material_name: enduitMaterial,
      category: 'Finitions',
      unit: 'm²',
      quantity: Math.round(surface * 100) / 100,
      unit_price: enduitPrice,
      total_price: Math.round(surface * enduitPrice * 100) / 100,
      formula_note: `L × h - ouvertures = ${length}m × ${height}m - ${openingsArea}m²`,
    },
    {
      material_name: peintureMaterial,
      category: 'Finitions',
      unit: 'm²',
      quantity: Math.round(peintureQty * 100) / 100,
      unit_price: peinturePrice,
      total_price: Math.round(peintureQty * peinturePrice * 100) / 100,
      formula_note: `(L × h - ouvertures) × (1 + loss) = (${length}m × ${height}m - ${openingsArea}m²) × 1.05`,
    }
  ];
}

export function calculateCarrelage(inputs: CarrelageInputs): EstimatorResult[] {
  const { length, width, lossRate } = inputs;
  const surface = length * width;
  const quantity = surface * (1 + lossRate / 100);
  const material_name = 'Carrelage sol';
  const unit_price = DEFAULT_PRICES[material_name] ?? 0;

  return [{
    material_name,
    category: 'Finitions',
    unit: 'm²',
    quantity: Math.round(quantity * 100) / 100,
    unit_price,
    total_price: Math.round(quantity * unit_price * 100) / 100,
    formula_note: `S × (1 + loss) = (${length}m × ${width}m) × (1 + ${lossRate / 100})`,
  }];
}

export function calculateAcier(inputs: AcierInputs): EstimatorResult[] {
  const { diameter, totalLength, lossRate } = inputs;
  // P = (d^2 / 162) * L * (1 + loss)
  const weightPerM = (diameter * diameter) / 162;
  const quantity = weightPerM * totalLength * (1 + lossRate / 100);
  const material_name = `Acier HA ${diameter}mm`;
  // Use a generic price for steel or look up HA12/HA8 etc.
  const unit_price = DEFAULT_PRICES['Acier HA'] ?? 0;

  return [{
    material_name,
    category: 'Gros œuvre (Ferraillage)',
    unit: 'kg',
    quantity: Math.round(quantity * 100) / 100,
    unit_price,
    total_price: Math.round(quantity * unit_price * 100) / 100,
    formula_note: `(d² / 162) × L × (1 + loss) = (${diameter}² / 162) × ${totalLength}m × (1 + ${lossRate / 100})`,
  }];
}

export function calculateCoffrage(inputs: CoffrageInputs): EstimatorResult[] {
  const { perimeter, height } = inputs;
  const quantity = perimeter * height;
  const material_name = 'Coffrage bois/métallique';
  const unit_price = DEFAULT_PRICES[material_name] ?? 0;

  return [{
    material_name,
    category: 'Gros œuvre',
    unit: 'm²',
    quantity: Math.round(quantity * 100) / 100,
    unit_price,
    total_price: Math.round(quantity * unit_price * 100) / 100,
    formula_note: `P × h = ${perimeter}m × ${height}m`,
  }];
}

export function calculateEscalier(inputs: EscalierInputs): EstimatorResult[] {
  const { inclinedLength, width, thickness } = inputs;
  const quantity = inclinedLength * width * thickness;
  const material_name = 'Béton pour Escalier';
  const unit_price = DEFAULT_PRICES[material_name] ?? 0;

  return [{
    material_name,
    category: 'Béton Structurel',
    unit: 'm³',
    quantity: Math.round(quantity * 100) / 100,
    unit_price,
    total_price: Math.round(quantity * unit_price * 100) / 100,
    formula_note: `L × l × e = ${inclinedLength}m × ${width}m × ${thickness}m`,
  }];
}

export function calculateToitureEtancheite(inputs: ToitureEtancheiteInputs): EstimatorResult[] {
  const { length, width, acroterionHeight, lossRate } = inputs;
  const surface = length * width;
  const releves = (length + width) * 2 * acroterionHeight;
  const quantity = (surface + releves) * (1 + lossRate / 100);
  const material_name = 'Étanchéité toiture';
  const unit_price = DEFAULT_PRICES[material_name] ?? 0;

  return [{
    material_name,
    category: 'Étanchéité',
    unit: 'm²',
    quantity: Math.round(quantity * 100) / 100,
    unit_price,
    total_price: Math.round(quantity * unit_price * 100) / 100,
    formula_note: `(S + relevés) × (1 + loss) = (${length}m × ${width}m + (${length} + ${width}) × 2 × ${acroterionHeight}m) × (1 + ${lossRate / 100})`,
  }];
}

export function calculateEstimation(inputs: EstimatorInputs): EstimatorResult[] {
  let results: EstimatorResult[] = [];
  let structuralConcreteVolume = 0;

  // 1. Terrassement
  if (inputs.terrassement) {
    results = results.concat(calculateTerrassement(inputs.terrassement));
  }

  // 2. Béton de propreté (non-structural concrete, doesn't count towards structural concrete conversion)
  if (inputs.beton_proprete) {
    results = results.concat(calculateBetonProprete(inputs.beton_proprete));
  }

  // 3. Semelles / Longrines / Poutres
  if (inputs.semelles_longrines_poutres) {
    const semelles = calculateSemellesLongrinesPoutres(inputs.semelles_longrines_poutres);
    results = results.concat(semelles);
    structuralConcreteVolume += semelles[0].quantity;
  }

  // 4. Poteaux
  if (inputs.poteaux) {
    const poteaux = calculatePoteaux(inputs.poteaux);
    results = results.concat(poteaux);
    structuralConcreteVolume += poteaux[0].quantity;
  }

  // 5. Dalle / Plancher
  if (inputs.dalle_plancher) {
    const dalle = calculateDallePlancher(inputs.dalle_plancher);
    results = results.concat(dalle);
    structuralConcreteVolume += dalle[0].quantity;
  }

  // 6. Maçonnerie (Briques)
  if (inputs.maconnerie) {
    results = results.concat(calculateMaconnerie(inputs.maconnerie));
  }

  // 7. Enduit / Peinture
  if (inputs.enduit_peinture) {
    results = results.concat(calculateEnduitPeinture(inputs.enduit_peinture));
  }

  // 8. Carrelage
  if (inputs.carrelage) {
    results = results.concat(calculateCarrelage(inputs.carrelage));
  }

  // 9. Acier (Ferraillage)
  if (inputs.acier) {
    results = results.concat(calculateAcier(inputs.acier));
  }

  // 10. Coffrage
  if (inputs.coffrage) {
    results = results.concat(calculateCoffrage(inputs.coffrage));
  }

  // 11. Escalier
  if (inputs.escalier) {
    const escalier = calculateEscalier(inputs.escalier);
    results = results.concat(escalier);
    structuralConcreteVolume += escalier[0].quantity;
  }

  // 12. Toiture / Étanchéité
  if (inputs.toiture_etancheite) {
    results = results.concat(calculateToitureEtancheite(inputs.toiture_etancheite));
  }

  // 13. Concrete conversion ingredients (Tunisian construction standards)
  // For 1 m³ of structural concrete:
  // - Ciment: 350 kg
  // - Sable: 0.4 m³
  // - Gravier: 0.8 m³
  // - Eau: 175 L
  if (inputs.concrete_conversion && structuralConcreteVolume > 0) {
    const v = structuralConcreteVolume;

    const cimentQty = v * 350;
    const sableQty = v * 0.4;
    const gravierQty = v * 0.8;
    const eauQty = v * 175;

    const cimentPrice = DEFAULT_PRICES['Ciment (dosage 350kg/m³)'] ?? 0;
    const sablePrice = DEFAULT_PRICES['Sable'] ?? 0;
    const gravierPrice = DEFAULT_PRICES['Gravier'] ?? 0;
    const eauPrice = DEFAULT_PRICES['Eau'] ?? 0;

    results.push(
      {
        material_name: 'Ciment (dosage 350kg/m³)',
        category: 'Matériaux Béton (Dosage)',
        unit: 'kg',
        quantity: Math.round(cimentQty * 100) / 100,
        unit_price: cimentPrice,
        total_price: Math.round(cimentQty * cimentPrice * 100) / 100,
        formula_note: `Vol. béton (${Math.round(v * 100) / 100} m³) × 350 kg/m³ = ${Math.round(cimentQty / 50 * 10) / 10} sacs de 50kg`,
      },
      {
        material_name: 'Sable',
        category: 'Matériaux Béton (Dosage)',
        unit: 'm³',
        quantity: Math.round(sableQty * 100) / 100,
        unit_price: sablePrice,
        total_price: Math.round(sableQty * sablePrice * 100) / 100,
        formula_note: `Vol. béton (${Math.round(v * 100) / 100} m³) × 0.4 m³/m³`,
      },
      {
        material_name: 'Gravier',
        category: 'Matériaux Béton (Dosage)',
        unit: 'm³',
        quantity: Math.round(gravierQty * 100) / 100,
        unit_price: gravierPrice,
        total_price: Math.round(gravierQty * gravierPrice * 100) / 100,
        formula_note: `Vol. béton (${Math.round(v * 100) / 100} m³) × 0.8 m³/m³`,
      },
      {
        material_name: 'Eau',
        category: 'Matériaux Béton (Dosage)',
        unit: 'L',
        quantity: Math.round(eauQty * 100) / 100,
        unit_price: eauPrice,
        total_price: Math.round(eauQty * eauPrice * 100) / 100,
        formula_note: `Vol. béton (${Math.round(v * 100) / 100} m³) × 175 L/m³`,
      }
    );
  }

  return results;
}
