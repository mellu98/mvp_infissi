# Architettura

## Principio chiave

Il prezzo finale è calcolato solo dal motore deterministico in `src/lib/pricing`.
Parser AI/mock e ingestion producono candidati, mai prezzi finali automatici non validati.

## Layer principali

- `src/app` — routing Next.js App Router, pagine e API route.
- `src/components` — componenti UI/client form.
- `src/lib` — codice di dominio puro o adapter condivisi:
  - `pricing` — motore prezzi puro, senza Prisma/React.
  - `ai` — provider interface, MockAIProvider, parser note/listini.
  - `ingestion` — CSV/XLSX/PDF/DOCX/image mock.
  - `documents` — template PDF dichiarativi.
  - `storage` — LocalStorageProvider + stub Appwrite.
  - `auth` — guard server-side.
- `src/server/services` — use-case server-side con Prisma e audit.
- `src/server/actions` — Server Actions per form.
- `prisma/schema.prisma` — modello relazionale multi-tenant-ready.

## Multi-tenancy

Tutti i servizi filtrano per `companyId`. L'MVP ha un'unica azienda demo, ma schema e query sono già impostati per tenant.

## Preventivi

Flusso:

1. Server Action crea `Quote` con numero progressivo annuale.
2. UI aggiunge righe con prodotto/misure/optional.
3. `quotes.service.ts` chiama `calculateQuoteLine`.
4. Totali aggregati con `calculateQuoteTotals`.
5. Audit log per creazione, righe, stato e documenti.

## PDF

`documents.service.tsx` carica quote + settings, renderizza con `@react-pdf/renderer`, salva il PDF via `StorageProvider` e registra `Document`.

## Stub dichiarati

- OCR immagini: `src/lib/ingestion/image.ts`
- Provider Anthropic/OpenAI: fallback euristico/mock
- Appwrite storage: interfaccia presente, implementazione MVP locale
