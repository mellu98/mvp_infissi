import { z } from 'zod';

const optionalString = z.preprocess(
  (v) => (v === '' || v == null ? undefined : v),
  z.string().trim().optional()
);
const optionalEmail = z.preprocess(
  (v) => (v === '' || v == null ? undefined : v),
  z.string().email('Email non valida.').optional()
);

export const customerCreateSchema = z
  .object({
    type: z.enum(['PRIVATE', 'BUSINESS']),
    firstName: optionalString,
    lastName: optionalString,
    companyName: optionalString,
    taxCode: optionalString,
    vatNumber: optionalString,
    email: optionalEmail,
    phone: optionalString,
    address: optionalString,
    city: optionalString,
    province: optionalString,
    postalCode: optionalString,
    notes: optionalString,
    leadStatus: z.enum(['NEW', 'CONTACTED', 'SURVEY', 'QUOTE_SENT', 'ACCEPTED', 'LOST']).default('NEW'),
  })
  .refine(
    (data) =>
      data.type === 'BUSINESS'
        ? !!data.companyName
        : !!(data.firstName || data.lastName),
    {
      message: 'Per cliente privato indicare nome o cognome. Per azienda indicare ragione sociale.',
      path: ['firstName'],
    }
  );

export const customerUpdateSchema = customerCreateSchema;

export const customerNoteSchema = z.object({
  content: z.string().trim().min(1, 'Contenuto obbligatorio.').max(5000, 'Max 5000 caratteri.'),
});

export type CustomerInput = z.infer<typeof customerCreateSchema>;
export type CustomerNoteInput = z.infer<typeof customerNoteSchema>;
