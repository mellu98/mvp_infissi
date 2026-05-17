# MVP Infissi — Link Infissi SRL

Web app full-stack per **LINK INFISSI SRL Unipersonale**: CRM clienti, gestione listini, catalogo prodotti, configuratore preventivi con motore prezzi deterministico, generazione PDF preventivo e contratto.

> **Principio chiave**: l'AI assiste nella lettura dei listini e nell'interpretazione di note libere; **il prezzo finale è SEMPRE calcolato da un motore deterministico** (`src/lib/pricing`) su dati validati manualmente. L'AI non inventa prezzi.

---

## 1. Stack

- Next.js 14 App Router + React 18 + TypeScript strict
- PostgreSQL 16 + Prisma 5 (schema multi-tenant-ready)
- NextAuth v5 credentials (ruoli `ADMIN` / `SALES` / `TECHNICIAN`)
- Tailwind + componenti UI locali in stile shadcn
- `@react-pdf/renderer` per PDF preventivo e contratto
- Vitest per pricing engine, parser note, ingestion (61 test)
- Docker multi-stage + docker-compose (dev locale + Coolify)

## 2. Setup locale

```bash
npm install --legacy-peer-deps
cp .env.example .env.local
docker compose up -d postgres
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

App in ascolto su `http://localhost:3000`.

## 3. Comandi npm utili

| Comando | Descrizione |
|---|---|
| `npm run dev` | Dev server Next.js |
| `npm run build` | Build di produzione (`prisma generate` + `next build`) |
| `npm run start` | Avvia il build di produzione (porta 3000) |
| `npm run lint` | Lint ESLint |
| `npm run test` | Vitest one-shot |
| `npm run test:watch` | Vitest in watch |
| `npm run db:generate` | Genera Prisma Client |
| `npm run db:migrate` | Applica migrations (dev) |
| `npm run db:deploy` | Applica migrations (produzione) |
| `npm run db:seed` | Seed demo Link Infissi |
| `npm run db:studio` | Prisma Studio |
| `npm run db:reset` | Reset completo (DROP + migrate + seed) |

## 4. Database

PostgreSQL 16 in Docker (dev). Schema in `prisma/schema.prisma`, 13 modelli con `companyId` per tutti i record applicativi.

```bash
docker compose up -d postgres     # solo il DB
npm run db:migrate                 # applica migration iniziale
npm run db:studio                  # ispezione visuale
```

## 5. Seed

Resetta il tenant demo (`demo-link-infissi`) e popola:

- 1 azienda Link Infissi con dati anagrafici reali (modificabili da `/settings`)
- 2 utenti demo (ADMIN + SALES)
- 5 clienti (privati e aziende)
- 18 prodotti dimostrativi con flag `demoPrice=true` (zanzariere, serramenti K5000/Coveral/Termalmix, porte blindate Zeus/Poseidon, porte interne Metropolitan/Luxury, tapparelle, persiana Vogue, accessori, posa, trasporto, supporto detrazioni)
- 2 listini (uno approvato, uno in revisione)
- 3 preventivi (Mario Rossi zanzariere SENT, Neri serramenti ACCEPTED, Studio Verdi porte DRAFT)
- Audit log iniziale

Login demo:

- Email: `admin@linkinfissi.demo`
- Password: `password-demo-123`

In produzione il seed è bloccato salvo `ALLOW_PROD_SEED=true`.

## 6. Test pricing engine

```bash
npm run test
```

Test coverage in `tests/`:

- `pricing/` — 14 file, copre tutte le formule + arrotondamenti + sconto + IVA + manuale + min fatturabile
- `parser/` — note libere + listini
- `ingestion/` — CSV → CandidateRow

Per verificare manualmente un calcolo:

```ts
import { calculateQuoteLine } from '@/lib/pricing';
const r = calculateQuoteLine({
  product: { name: 'K5000', basePrice: 260, pricePerSquareMeter: 210, pricingFormula: 'BASE_PLUS_AREA' },
  widthCm: 100, heightCm: 210,
});
// r.unitPrice = 701, r.total = 855.22
```

## 7. Caricare un listino

1. `/pricelists/new` → carica file CSV/Excel/PDF/DOCX (max 25 MB).
2. Il sistema salva il file in `LOCAL_UPLOAD_DIR` e crea `Pricelist` in stato `UPLOADED`.
3. Ingestion (`src/lib/ingestion`) estrae righe → `PricelistItemCandidate` con `confidence`.
4. Stato diventa `NEEDS_REVIEW`.

Per immagini (JPG/PNG): caricamento accettato ma OCR è **stub** — vedi `src/lib/ingestion/image.ts`. Inserimento manuale.

## 8. Validare prodotti estratti

1. `/pricelists/[id]/review` mostra tutte le righe candidate con badge di confidenza (Alta/Media/Bassa).
2. Modifica inline per nome, SKU, categoria, formula, prezzi.
3. Spunta le righe da importare.
4. Click "Importa" → crea `Product`. Se esiste già lo SKU, aggiorna invece di duplicare.
5. Listino passa a `APPROVED`.

## 9. Creare un preventivo

Due flussi disponibili:

**A — Wizard manuale**
1. `/quotes/new?customerId=...` → seleziona cliente, validità, IVA, sconto globale.
2. Sul detail preventivo: form "Aggiungi riga" con prodotto + misure + optional + sconto riga.
3. Il motore deterministico calcola e mostra spiegazione (es. *"K5000 — Area 2,10 mq × tariffa = 701,00 €..."*).
4. Totali subtotale/sconti/IVA/totale aggiornati automaticamente.

**B — Da nota libera**
1. Stesso detail preventivo, pannello "Da nota libera".
2. Incolla: *"Cliente vuole 3 zanzariere avvolgibili laterali bianche 120x240."*
3. Parser euristico produce righe candidate (mai prezzo automatico).
4. Conferma manuale sempre richiesta prima del calcolo prezzo.

## 10. Generare PDF

Dal detail preventivo:

- **PDF preventivo** → `/api/quotes/[id]/pdf` (inline). Include intestazione Link Infissi, tabella righe con spiegazione, totali, condizioni, firma.
- **PDF contratto** → `/api/quotes/[id]/contract`. Template con parti, oggetto, riepilogo economico, condizioni operative, modalità pagamento, tempi consegna, privacy GDPR, firma.

Ogni generazione salva un `Document` collegato al preventivo + log audit.

## 11. Architettura

Vedi `ARCHITECTURE.md` per il dettaglio. In sintesi:

- `src/lib/pricing` — motore puro, zero deps da Prisma/React, testabile in isolamento
- `src/lib/ai` — `MockAIProvider` (default), `AnthropicAIProvider`/`OpenAIProvider` stub
- `src/lib/storage` — `LocalStorageProvider` (default), `AppwriteStorageProvider` stub
- `src/lib/ingestion` — CSV / XLSX / PDF / DOCX + OCR stub
- `src/lib/documents` — template `@react-pdf/renderer`
- `src/server/services` — use-case business logic
- `src/server/actions` — Next.js Server Actions
- `prisma/schema.prisma` — modello relazionale

## 12. Limiti noti del MVP

- **OCR immagini**: stub, non implementato. Documentato in `src/lib/ingestion/image.ts`.
- **Provider AI reali**: stub, fallback a heuristics locali.
- **Email transazionali**: campi SMTP presenti in env, non utilizzati.
- **Multi-tenant UI**: schema pronto, UI mostra solo l'azienda demo.
- **Template PDF**: modificabili solo da codice; `quoteTerms`/`contractTerms` editabili da `/settings`.
- **Test E2E browser**: solo unit test Vitest. Smoke test manuale documentato in `DELIVERY_REPORT.md`.
- **Backup**: documentato come step manuale in `SECURITY.md`.
- **Dipendenze**: `npm audit` segnala advisories su `next`, `next-auth`, `xlsx` — hardening dedicato post-staging.

## 13. Roadmap consigliata

Vedi `TASKS.md`. Priorità prossima:

1. Deploy staging su Coolify/Hetzner (vedi `COOLIFY.md`).
2. Validazione PDF su dati reali.
3. Upgrade sicurezza dipendenze in branch dedicato.
4. Aggiungere test E2E Playwright per flusso login → cliente → preventivo → PDF.
5. Implementare provider AI reale (Anthropic) dietro feature flag.

## Documenti del repository

- `ARCHITECTURE.md` — architettura dettagliata, decisioni, dove entra Appwrite
- `COOLIFY.md` — deploy Hetzner via Coolify, 13 step
- `DEPLOYMENT.md` — Dockerfile e migrazioni produzione
- `ENVIRONMENT.md` — variabili d'ambiente
- `SECURITY.md` — autenticazione, upload, backup, GDPR, audit
- `TASKS.md` — checklist fatto / da fare / fuori MVP
- `DELIVERY_REPORT.md` — sintesi stato attuale per il cliente
