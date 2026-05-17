import { z } from 'zod';

const numberOrNull = z.preprocess(
  (v) => (v === '' || v == null ? null : typeof v === 'string' ? Number(v.replace(',', '.')) : v),
  z.number().nullable()
);
const positiveNumber = z.preprocess(
  (v) => (v === '' || v == null ? 0 : typeof v === 'string' ? Number(v.replace(',', '.')) : v),
  z.number().min(0)
);

export const productCategoryEnum = z.enum([
  'WINDOW',
  'INTERIOR_DOOR',
  'ARMORED_DOOR',
  'SHUTTER',
  'PERSIANA',
  'MOSQUITO_SCREEN',
  'ACCESSORY',
  'INSTALLATION',
  'TRANSPORT',
  'TAX_SUPPORT',
  'OTHER',
]);

export const pricingFormulaEnum = z.enum([
  'FIXED_PRICE',
  'PER_SQUARE_METER',
  'PER_LINEAR_METER',
  'BASE_PLUS_AREA',
  'BASE_PLUS_OPTIONS',
  'CUSTOM_FORMULA',
]);

export const productCreateSchema = z.object({
  sku: z.string().trim().min(1, 'SKU obbligatorio.').max(80),
  name: z.string().trim().min(1, 'Nome obbligatorio.').max(200),
  category: productCategoryEnum.default('OTHER'),
  description: z.string().optional(),
  material: z.string().optional(),
  color: z.string().optional(),
  unit: z.string().default('pz'),
  basePrice: positiveNumber.default(0),
  pricePerSquareMeter: numberOrNull,
  pricePerLinearMeter: numberOrNull,
  minBillableQuantity: numberOrNull,
  pricingFormula: pricingFormulaEnum.default('FIXED_PRICE'),
  active: z.preprocess((v) => v === 'on' || v === true || v === 'true', z.boolean()).default(true),
  supplier: z.string().optional(),
  technicalNotes: z.string().optional(),
  demoPrice: z.preprocess((v) => v === 'on' || v === true || v === 'true', z.boolean()).default(false),
});

export const productUpdateSchema = productCreateSchema;

export const productOptionSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().optional(),
  price: positiveNumber.default(0),
  priceType: z.enum(['FIXED', 'PER_SQUARE_METER', 'PER_LINEAR_METER', 'PERCENTAGE']).default('FIXED'),
  active: z.preprocess((v) => v === 'on' || v === true || v === 'true', z.boolean()).default(true),
});

export type ProductInput = z.infer<typeof productCreateSchema>;
export type ProductOptionInput = z.infer<typeof productOptionSchema>;
