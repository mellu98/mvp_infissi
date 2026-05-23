import { z } from 'zod';
import { productCategoryEnum, pricingFormulaEnum } from './product';

export const pricelistMetaSchema = z.object({
  name: z.string().trim().min(1).max(200),
  supplier: z.string().optional(),
  category: productCategoryEnum.default('OTHER'),
  notes: z.string().optional(),
});

export const candidateRowUpdateSchema = z.object({
  productName: z.string().trim().min(1).optional(),
  category: productCategoryEnum.optional(),
  sku: z.string().optional(),
  description: z.string().optional(),
  basePrice: z.preprocess((v) => (v === '' || v == null ? null : Number(v)), z.number().nullable()),
  pricePerLinearMeter: z.preprocess(
    (v) => (v === '' || v == null ? null : Number(v)),
    z.number().nullable()
  ),
  unit: z.string().optional(),
  color: z.string().optional(),
  material: z.string().optional(),
  variant: z.string().optional(),
  pricingFormula: pricingFormulaEnum.optional(),
  approved: z.preprocess((v) => v === 'on' || v === true || v === 'true', z.boolean()).optional(),
});

export type PricelistMetaInput = z.infer<typeof pricelistMetaSchema>;
