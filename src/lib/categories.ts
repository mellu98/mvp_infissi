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
