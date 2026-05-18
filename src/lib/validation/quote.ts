import { z } from 'zod';

const optionalNumber = z.preprocess(
  (v) => (v === '' || v == null ? null : typeof v === 'string' ? Number(v.replace(',', '.')) : v),
  z.number().nullable()
);

const requiredNumber = z.preprocess(
  (v) => (v === '' || v == null ? null : typeof v === 'string' ? Number(v.replace(',', '.')) : v),
  z.number().min(0)
);

const optionalId = z.preprocess(
  (v) => (v === '' || v == null ? undefined : v),
  z.string().trim().min(1).optional()
);

// Max length defensive cap: long free-text fields are bound to prevent both
// accidental DB bloat and ReDoS via the heuristic parser regex on giant inputs.
const MAX_TEXT = 5000;
const MAX_NOTE_PARSER = 2000;

export const quoteCreateSchema = z.object({
  customerId: z.string().trim().min(1),
  validUntilDays: z.preprocess(
    (v) => (v === '' || v == null ? 30 : typeof v === 'string' ? parseInt(v, 10) : v),
    z.number().int().min(1).max(365)
  ),
  notes: z.string().max(MAX_TEXT).optional(),
  internalNotes: z.string().max(MAX_TEXT).optional(),
  vatRate: requiredNumber.default(22),
});

export const quoteItemSchema = z.object({
  productId: optionalId,
  description: z.string().trim().min(1).max(500),
  quantity: requiredNumber.default(1),
  widthCm: optionalNumber,
  heightCm: optionalNumber,
  lengthCm: optionalNumber,
  discountPercentage: requiredNumber.default(0),
  manualPriceOverride: optionalNumber,
  selectedOptionIds: z.array(z.string().trim().min(1)).max(50).default([]),
  notes: z.string().max(MAX_TEXT).optional(),
});

export const quoteStatusUpdateSchema = z.object({
  status: z.enum(['DRAFT', 'CALCULATED', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED']),
});

export const parseNoteSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, 'Inserisci una nota.')
    .max(MAX_NOTE_PARSER, `Nota troppo lunga (max ${MAX_NOTE_PARSER} caratteri).`),
});

export type QuoteCreateInput = z.infer<typeof quoteCreateSchema>;
export type QuoteItemInput = z.infer<typeof quoteItemSchema>;
