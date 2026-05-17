# MVP Infissi

Web app full-stack per **LINK INFISSI SRL Unipersonale**: CRM, catalogo prodotti, listini, preventivi con motore prezzi deterministico e generazione PDF.

## Stack

- Next.js 14 App Router + React 18
- TypeScript strict
- PostgreSQL 16 + Prisma 5
- NextAuth v5 credentials
- Tailwind + componenti UI locali stile shadcn
- Vitest per pricing engine, parser note e ingestion
- `@react-pdf/renderer` per preventivo/contratto PDF

## Setup locale

```bash
npm install --legacy-peer-deps
cp .env.example .env.local
docker compose up -d postgres
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Login demo dopo il seed:

- Email: `admin@linkinfissi.demo`
- Password: `password-demo-123`

## Verifiche

```bash
npm run test
npx tsc --noEmit
npm run lint
```

Nota: non usare l'AI per calcolare prezzi. L'AI/mock parser suggerisce righe candidate; il prezzo viene sempre dal motore deterministico in `src/lib/pricing`.

## Stato MVP

Implementati:

- Auth credentials + ruoli
- Dashboard
- CRM clienti + note
- Catalogo prodotti + optional
- Upload/review listini
- Preventivi con righe calcolate
- Parser note libere con conferma manuale
- PDF preventivo e contratto
- Seed demo
- Docker/Coolify base

Ancora da completare per produzione:

- Migrazione iniziale Prisma committabile
- Hardening dipendenze segnalate da `npm audit`
- Backup DB e policy retention
- Test E2E Playwright
- Provider AI reali e OCR reale, oggi volutamente stub/mock
