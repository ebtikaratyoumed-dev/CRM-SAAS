export interface FormField {
  name: string;
  label: string;
  type: 'number' | 'select';
  unit?: string;
  defaultValue: any;
  step?: number;
  min?: number;
  options?: { value: string; label: string }[];
}

export interface CategoryDefinition {
  id: string;
  name: string;
  iconName: string;
  description: string;
  fields: FormField[];
}

export const ESTIMATOR_CATEGORIES: CategoryDefinition[] = [
  {
    id: 'terrassement',
    name: '1. Terrassement',
    iconName: 'Pickaxe',
    description: 'Fouilles en rigole pour semelles filantes, tranchées...',
    fields: [
      { name: 'length', label: 'Longueur', type: 'number', unit: 'm', defaultValue: 10, step: 0.1, min: 0 },
      { name: 'width', label: 'Largeur de fouille', type: 'number', unit: 'm', defaultValue: 0.8, step: 0.05, min: 0 },
      { name: 'depth', label: 'Profondeur', type: 'number', unit: 'm', defaultValue: 1.2, step: 0.05, min: 0 },
    ],
  },
  {
    id: 'beton_proprete',
    name: '2. Béton de propreté',
    iconName: 'Layers',
    description: 'Béton de faible épaisseur pour égaliser le sol sous les fondations',
    fields: [
      { name: 'surface', label: 'Surface', type: 'number', unit: 'm²', defaultValue: 30, step: 1, min: 0 },
      { name: 'thickness', label: 'Épaisseur', type: 'number', unit: 'm', defaultValue: 0.05, step: 0.01, min: 0 },
    ],
  },
  {
    id: 'semelles_longrines_poutres',
    name: '3. Semelles, Longrines & Poutres',
    iconName: 'Grid',
    description: 'Béton pour les éléments horizontaux de structure',
    fields: [
      { name: 'width', label: 'Largeur', type: 'number', unit: 'm', defaultValue: 0.4, step: 0.05, min: 0 },
      { name: 'height', label: 'Hauteur', type: 'number', unit: 'm', defaultValue: 0.5, step: 0.05, min: 0 },
      { name: 'length', label: 'Longueur cumulée', type: 'number', unit: 'm', defaultValue: 20, step: 0.1, min: 0 },
    ],
  },
  {
    id: 'poteaux',
    name: '4. Poteaux',
    iconName: 'SquareDot',
    description: 'Béton pour les éléments verticaux de structure',
    fields: [
      { name: 'dimA', label: 'Dimension A (largeur)', type: 'number', unit: 'm', defaultValue: 0.25, step: 0.05, min: 0 },
      { name: 'dimB', label: 'Dimension B (longueur)', type: 'number', unit: 'm', defaultValue: 0.3, step: 0.05, min: 0 },
      { name: 'height', label: 'Hauteur poteau', type: 'number', unit: 'm', defaultValue: 3.2, step: 0.1, min: 0 },
      { name: 'count', label: 'Nombre de poteaux', type: 'number', unit: 'pcs', defaultValue: 1, step: 1, min: 1 },
    ],
  },
  {
    id: 'dalle_plancher',
    name: '5. Dalle / Plancher',
    iconName: 'TableRows',
    description: 'Volume de béton pour dalles de planchers',
    fields: [
      { name: 'surface', label: 'Surface', type: 'number', unit: 'm²', defaultValue: 100, step: 1, min: 0 },
      { name: 'thickness', label: 'Épaisseur de dalle', type: 'number', unit: 'm', defaultValue: 0.15, step: 0.01, min: 0 },
    ],
  },
  {
    id: 'maconnerie',
    name: '6. Maçonnerie (Briques)',
    iconName: 'BrickWall',
    description: 'Calcul du nombre de briques pour murs',
    fields: [
      { name: 'length', label: 'Longueur cumulée des murs', type: 'number', unit: 'm', defaultValue: 12, step: 0.1, min: 0 },
      { name: 'height', label: 'Hauteur des murs', type: 'number', unit: 'm', defaultValue: 2.8, step: 0.1, min: 0 },
      {
        name: 'brickType',
        label: 'Type de brique (Tunisie)',
        type: 'select',
        defaultValue: 'cloison8',
        options: [
          { value: 'cloison8', label: 'Cloison 8 trous (~25 briques/m²)' },
          { value: 'double12', label: 'Double cloison 12 trous (~33 briques/m²)' },
        ],
      },
    ],
  },
  {
    id: 'enduit_peinture',
    name: '7. Enduit & Peinture',
    iconName: 'Paintbrush',
    description: 'Surface d’enduit et peinture en déduisant les ouvertures',
    fields: [
      { name: 'length', label: 'Longueur cumulée', type: 'number', unit: 'm', defaultValue: 15, step: 0.1, min: 0 },
      { name: 'height', label: 'Hauteur', type: 'number', unit: 'm', defaultValue: 2.8, step: 0.1, min: 0 },
      { name: 'openingsArea', label: 'Surface des ouvertures (portes/fenêtres)', type: 'number', unit: 'm²', defaultValue: 4, step: 0.5, min: 0 },
    ],
  },
  {
    id: 'carrelage',
    name: '8. Carrelage & Revêtement',
    iconName: 'Grid3X3',
    description: 'Carrelage de sol avec coefficient de perte ajustable',
    fields: [
      { name: 'length', label: 'Longueur de pièce', type: 'number', unit: 'm', defaultValue: 6, step: 0.1, min: 0 },
      { name: 'width', label: 'Largeur de pièce', type: 'number', unit: 'm', defaultValue: 5, step: 0.1, min: 0 },
      { name: 'lossRate', label: 'Taux de perte (Tunisie)', type: 'number', unit: '%', defaultValue: 10, step: 1, min: 0 },
    ],
  },
  {
    id: 'acier',
    name: '9. Acier (Ferraillage)',
    iconName: 'Wrench',
    description: 'Poids d’acier selon le diamètre et la longueur cumulée des barres',
    fields: [
      { name: 'diameter', label: 'Diamètre nominal', type: 'number', unit: 'mm', defaultValue: 12, step: 2, min: 4 },
      { name: 'totalLength', label: 'Longueur totale des barres', type: 'number', unit: 'm', defaultValue: 240, step: 1, min: 0 },
      { name: 'lossRate', label: 'Taux de perte', type: 'number', unit: '%', defaultValue: 5, step: 1, min: 0 },
    ],
  },
  {
    id: 'coffrage',
    name: '10. Coffrage',
    iconName: 'SquareDot',
    description: 'Surface de coffrage en bois ou métallique',
    fields: [
      { name: 'perimeter', label: 'Périmètre de l’élément', type: 'number', unit: 'm', defaultValue: 1.1, step: 0.1, min: 0 },
      { name: 'height', label: 'Hauteur', type: 'number', unit: 'm', defaultValue: 3.2, step: 0.1, min: 0 },
    ],
  },
  {
    id: 'escalier',
    name: '11. Escalier',
    iconName: 'FoldDown',
    description: 'Béton pour la paillasse inclinée de l’escalier',
    fields: [
      { name: 'inclinedLength', label: 'Longueur inclinée de paillasse', type: 'number', unit: 'm', defaultValue: 4.5, step: 0.1, min: 0 },
      { name: 'width', label: 'Largeur d’escalier', type: 'number', unit: 'm', defaultValue: 1.2, step: 0.05, min: 0 },
      { name: 'thickness', label: 'Épaisseur paillasse', type: 'number', unit: 'm', defaultValue: 0.15, step: 0.01, min: 0 },
    ],
  },
  {
    id: 'toiture_etancheite',
    name: '12. Toiture / Étanchéité',
    iconName: 'Umbrella',
    description: 'Surface d’étanchéité avec relevés d’acrotères et pertes',
    fields: [
      { name: 'length', label: 'Longueur de dalle', type: 'number', unit: 'm', defaultValue: 10, step: 0.1, min: 0 },
      { name: 'width', label: 'Largeur de dalle', type: 'number', unit: 'm', defaultValue: 8, step: 0.1, min: 0 },
      { name: 'acroterionHeight', label: 'Hauteur relevé acrotère', type: 'number', unit: 'm', defaultValue: 0.5, step: 0.05, min: 0 },
      { name: 'lossRate', label: 'Taux de perte', type: 'number', unit: '%', defaultValue: 10, step: 1, min: 0 },
    ],
  },
];
