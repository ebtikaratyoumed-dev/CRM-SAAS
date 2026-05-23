export interface EstimatorResult {
  material_name: string;
  category: string;
  unit: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  formula_note: string;
}

export interface TerrassementInputs {
  length: number;
  width: number;
  depth: number;
}

export interface BetonPropreteInputs {
  surface: number;
  thickness: number;
}

export interface SemellesLongrinesPoutresInputs {
  width: number;
  height: number;
  length: number;
}

export interface PoteauxInputs {
  dimA: number;
  dimB: number;
  height: number;
  count: number;
}

export interface DallePlancherInputs {
  surface: number;
  thickness: number;
}

export interface MaconnerieInputs {
  length: number;
  height: number;
  brickType: 'cloison8' | 'double12';
}

export interface EnduitPeintureInputs {
  length: number;
  height: number;
  openingsArea: number;
}

export interface CarrelageInputs {
  length: number;
  width: number;
  lossRate: number; // in percentage, e.g. 10 for 10%
}

export interface AcierInputs {
  diameter: number;
  totalLength: number;
  lossRate: number; // in percentage, e.g. 5 for 5%
}

export interface CoffrageInputs {
  perimeter: number;
  height: number;
}

export interface EscalierInputs {
  inclinedLength: number;
  width: number;
  thickness: number;
}

export interface ToitureEtancheiteInputs {
  length: number;
  width: number;
  acroterionHeight: number;
  lossRate: number; // in percentage, e.g. 10 for 10%
}

export interface EstimatorInputs {
  terrassement?: TerrassementInputs;
  beton_proprete?: BetonPropreteInputs;
  semelles_longrines_poutres?: SemellesLongrinesPoutresInputs;
  poteaux?: PoteauxInputs;
  dalle_plancher?: DallePlancherInputs;
  maconnerie?: MaconnerieInputs;
  enduit_peinture?: EnduitPeintureInputs;
  carrelage?: CarrelageInputs;
  acier?: AcierInputs;
  coffrage?: CoffrageInputs;
  escalier?: EscalierInputs;
  toiture_etancheite?: ToitureEtancheiteInputs;
  concrete_conversion?: boolean; // Whether to auto-convert structural concrete to ciment, sable, gravier, eau
}
