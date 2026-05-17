import { z } from 'zod';

const requiredString = z.string().trim().min(1, 'Campo obbligatorio.');

export const companySettingsSchema = z.object({
  legalName: requiredString,
  vatNumber: requiredString,
  taxCode: requiredString,
  address: requiredString,
  city: requiredString,
  province: requiredString,
  postalCode: requiredString,
  country: z.string().default('Italia'),
  email: z.string().email(),
  phone: requiredString,
  website: z.string().optional(),
  defaultVatRate: z.preprocess(
    (v) => (typeof v === 'string' ? Number(v.replace(',', '.')) : v),
    z.number().min(0).max(100)
  ),
  currency: z.string().default('EUR'),
  quoteValidityDays: z.preprocess(
    (v) => (typeof v === 'string' ? parseInt(v, 10) : v),
    z.number().int().min(1).max(365)
  ),
  quoteNumberPrefix: z.string().optional(),
  quoteTerms: z.string().optional(),
  contractTerms: z.string().optional(),
});

export type CompanySettingsInput = z.infer<typeof companySettingsSchema>;
