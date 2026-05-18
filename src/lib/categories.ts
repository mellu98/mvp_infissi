export const PRODUCT_CATEGORY_LABELS: Record<string, string> = {
  WINDOW: 'Finestre / Serramenti',
  INTERIOR_DOOR: 'Porte interne',
  ARMORED_DOOR: 'Porte blindate',
  SHUTTER: 'Tapparelle',
  PERSIANA: 'Persiane',
  MOSQUITO_SCREEN: 'Zanzariere',
  ACCESSORY: 'Accessori',
  INSTALLATION: 'Posa',
  TRANSPORT: 'Trasporto',
  TAX_SUPPORT: 'Supporto detrazioni',
  OTHER: 'Altro',
};

export const PRODUCT_CATEGORIES = Object.keys(PRODUCT_CATEGORY_LABELS) as Array<
  keyof typeof PRODUCT_CATEGORY_LABELS
>;

export const PRICING_FORMULA_LABELS: Record<string, string> = {
  FIXED_PRICE: 'Prezzo fisso',
  PER_SQUARE_METER: 'Al metro quadro',
  PER_LINEAR_METER: 'Al metro lineare',
  BASE_PLUS_AREA: 'Base + area',
  BASE_PLUS_OPTIONS: 'Base + optional',
  CUSTOM_FORMULA: 'Formula personalizzata',
};

export const OPTION_PRICE_TYPE_LABELS: Record<string, string> = {
  FIXED: 'Fisso',
  PER_SQUARE_METER: 'Al metro quadro',
  PER_LINEAR_METER: 'Al metro lineare',
  PERCENTAGE: 'Percentuale (%)',
};

/**
 * Human-readable unit-price label that explains where the number comes from,
 * depending on the product's pricing formula.
 */
export function unitPriceLabel(formula: string | null | undefined): string {
  switch (formula) {
    case 'FIXED_PRICE':
      return 'Prezzo fisso da catalogo';
    case 'PER_SQUARE_METER':
      return 'Prezzo al mq da catalogo';
    case 'PER_LINEAR_METER':
      return 'Prezzo al metro lineare da catalogo';
    case 'BASE_PLUS_AREA':
      return 'Prezzo base + area da catalogo';
    case 'BASE_PLUS_OPTIONS':
      return 'Prezzo base + optional da catalogo';
    case 'CUSTOM_FORMULA':
      return 'Prezzo formula personalizzata';
    default:
      return 'Prezzo unitario';
  }
}
