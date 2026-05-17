# MVP Infissi — Piano di Implementazione

## Contesto

Il cliente **LINK INFISSI SRL Unipersonale** (Zinasco, PV) vende serramenti, porte, zanzariere, tapparelle, persiane e servizi di posa. Oggi prende misure e appunti a mano, perdendo molto tempo per creare preventivi e contratti.

Obiettivo MVP: web app full-stack che copra **CRM + gestione listini + catalogo prodotti + configuratore preventivi + motore prezzi deterministico + generatore PDF preventivo/contratto**, deployabile su Hetzner via Coolify, multi-tenant-ready ma con singola azienda al lancio.

**Principio chiave**: l'AI aiuta a leggere e suggerire, MAI a calcolare prezzi. Il prezzo finale è sempre frutto di un motore deterministico su dati validati manualmente.

---

## Stack (deciso con utente)

| Layer | Scelta | Note |
|---|---|---|
| Framework | **Next.js 14 App Router** + React 18 | Ecosistema libreria stabile per ingestion |
| Lang | TypeScript strict | |
| UI | Tailwind + shadcn/ui + React Hook Form + Zod | TanStack Table per liste |
| DB | **PostgreSQL 16** + Prisma 5 | Core relazionale; Appwrite NON sostituisce |
| Auth | **NextAuth v5** (credentials provider) | Ruoli ADMIN / SALES / TECHNICIAN |
| PDF | **@react-pdf/renderer** | Template dichiarativi modificabili da codice |
| Ingestion | `xlsx`, `pdf-parse`, `mammoth`, OCR stub | Niente OCR reale nel MVP |
| AI | `MockAIProvider` di default | Stub `AnthropicAIProvider` / `OpenAIProvider` |
| Storage | `LocalStorageProvider` (volume Docker) | Stub `AppwriteStorageProvider` |
| Test | Vitest | Focus su pricing engine + parser |
| Deploy | Docker multi-stage + docker-compose (dev + Coolify) | Healthcheck + volumi persistenti |

### Decisioni pragmatiche (documentate poi in `ARCHITECTURE.md`)
- **Pricing CUSTOM_FORMULA**: per MVP, solo le 5 formule predefinite + manualPriceOverride. CUSTOM_FORMULA implementato come stub che lancia errore controllato — niente `eval` insicuro.
- **OCR immagini**: completamente mock, dichiarato in codice e doc. Adapter pronto.
- **Multi-tenant**: tutte le query `findMany/findUnique` filtrano per `companyId`. Helper `getCurrentCompanyId()` da sessione.
- **Numerazione preventivi**: progressivo per azienda + anno (es. `2026-0001`), reset annuale.
- **Demo prices**: flag booleano `demoPrice` sui prodotti seed + badge UI "DEMO" visibile.

---

## Struttura del Progetto

```
mvp_infissi/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── (auth)/login/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx                  # sidebar + topbar
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── customers/{page,new,[id]}
│   │   │   ├── products/{page,new,[id]}
│   │   │   ├── pricelists/{page,new,[id],[id]/review}
│   │   │   ├── quotes/{page,new,[id]}
│   │   │   └── settings/page.tsx
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── pricelists/[id]/extract/route.ts
│   │   │   ├── quotes/[id]/pdf/route.ts
│   │   │   ├── quotes/[id]/contract/route.ts
│   │   │   ├── quotes/parse-note/route.ts
│   │   │   └── health/route.ts
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                             # shadcn primitives
│   │   ├── layout/{Sidebar,Topbar,DemoBadge}
│   │   ├── customers/, products/, quotes/, pricelists/
│   │   └── forms/                          # RHF + Zod
│   ├── lib/
│   │   ├── pricing/
│   │   │   ├── engine.ts                   # calculateQuoteLine
│   │   │   ├── formulas.ts                 # 5 formule
│   │   │   ├── rounding.ts
│   │   │   └── types.ts
│   │   ├── ai/
│   │   │   ├── provider.ts                 # interface AIProvider
│   │   │   ├── mock.ts                     # MockAIProvider
│   │   │   ├── anthropic.ts                # stub
│   │   │   ├── openai.ts                   # stub
│   │   │   └── note-parser.ts              # parseQuoteNote heuristic
│   │   ├── storage/
│   │   │   ├── provider.ts                 # interface
│   │   │   ├── local.ts                    # filesystem
│   │   │   └── appwrite.ts                 # stub
│   │   ├── ingestion/
│   │   │   ├── csv.ts, xlsx.ts, pdf.ts, docx.ts, image.ts (mock)
│   │   │   └── normalize.ts                # → CandidateRow[]
│   │   ├── documents/
│   │   │   ├── quote-pdf.tsx               # @react-pdf component
│   │   │   ├── contract-pdf.tsx
│   │   │   └── templates.ts
│   │   ├── auth/
│   │   │   ├── config.ts                   # NextAuth v5 config
│   │   │   └── guards.ts                   # requireRole, requireCompany
│   │   ├── validation/                     # schemi Zod condivisi
│   │   ├── audit.ts                        # logAuditEvent
│   │   └── db.ts                           # Prisma client singleton
│   ├── server/
│   │   ├── services/
│   │   │   ├── customers.service.ts
│   │   │   ├── products.service.ts
│   │   │   ├── pricelists.service.ts
│   │   │   ├── quotes.service.ts
│   │   │   └── documents.service.ts
│   │   └── actions/                        # Next Server Actions
│   └── middleware.ts                       # auth gate
├── tests/
│   ├── pricing/
│   │   ├── fixed.test.ts, per-sqm.test.ts, base-plus-area.test.ts
│   │   ├── rounding.test.ts, vat.test.ts, discount.test.ts
│   │   └── min-billable.test.ts
│   ├── parser/note-parser.test.ts
│   └── ingestion/normalize.test.ts
├── public/                                 # logo placeholder
├── docker/
│   └── postgres-init/
├── Dockerfile                              # multi-stage Next.js
├── docker-compose.yml                      # dev locale (app + postgres + volume)
├── docker-compose.coolify.yml              # app only (DB esterno Coolify)
├── .env.example
├── .env.production.example
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── vitest.config.ts
├── README.md
├── ARCHITECTURE.md
├── DEPLOYMENT.md
├── COOLIFY.md
├── ENVIRONMENT.md
├── SECURITY.md
├── TASKS.md
└── DELIVERY_REPORT.md
```

---

## Database (Prisma schema)

13 modelli con `companyId` su ognuno (tranne `Company` / `User` root):

- **Company** ← root tenant
- **CompanySettings** (1:1 con Company)
- **User** (role: ADMIN | SALES | TECHNICIAN, password hash bcrypt)
- **Customer** (type: PRIVATE | BUSINESS, leadStatus enum)
- **CustomerNote**
- **Pricelist** (status: UPLOADED | EXTRACTED | NEEDS_REVIEW | APPROVED | REJECTED)
- **PricelistItemCandidate** (confidence Float, rawText, validationErrors Json, approved Bool)
- **Product** (`demoPrice: Bool`, `pricingFormula` enum, JSON varianti/optional)
- **ProductOption** (priceType: FIXED | PER_SQM | PER_LM | PERCENTAGE)
- **Quote** (status: DRAFT | CALCULATED | SENT | ACCEPTED | REJECTED | EXPIRED, `quoteNumber String`)
- **QuoteItem** (snapshot prezzo + spiegazione calcolo)
- **Document** (type: QUOTE_PDF | CONTRACT_PDF | UPLOADED_PRICELIST | OTHER, storageKey)
- **AuditLog** (action, entityType, entityId, metadata Json)

**Indici**: `companyId`, `customerId`, `quoteId`, `productId`, `status`, `createdAt`, `quoteNumber`, `email`, `sku`.
**Unique**: `(companyId, quoteNumber)`, `(companyId, sku)`, `(companyId, email)` su User.

---

## Pricing Engine — design

Modulo puro in `src/lib/pricing/`, **zero dipendenze da Prisma o React** (testabile in isolamento).

**Funzione principale**: `calculateQuoteLine(input: LineInput, product: ProductSnapshot, options: OptionSnapshot[], settings: { vatRate, currency }) → LineCalculation`

**Formule supportate**:
| Formula | Calcolo |
|---|---|
| `FIXED_PRICE` | `unitPrice = basePrice` |
| `PER_SQUARE_METER` | `unitPrice = pricePerSqm × max(area, minBillable)` |
| `PER_LINEAR_METER` | `unitPrice = pricePerLm × linearMeters` |
| `BASE_PLUS_AREA` | `unitPrice = basePrice + pricePerSqm × area` |
| `BASE_PLUS_OPTIONS` | `unitPrice = basePrice + Σ options` |

**Regole**:
- `areaMq = widthCm × heightCm / 10000` (con `Math.round` a 4 decimali interni)
- `linearMeters = lengthCm / 100`
- `billableAreaMq = max(areaMq, product.minBillableQuantity)`
- `optionsTotal` = somma optional (con priceType propri: FIXED, PER_SQM, PER_LM, PERCENTAGE su subtotal)
- `discountAmount` = `(unitPrice + optionsTotal) × discountPct × quantity`
- `vatAmount` = `taxableAmount × vatRate`
- Tutti arrotondamenti finali **a 2 decimali con banker's rounding** (`rounding.ts`)
- `manualPriceOverride` bypassa il calcolo unitPrice ma mantiene optional/sconto/IVA

**Output**: include `explanation` leggibile (es. "Zanzariera avvolgibile: area 1,20 × 2,40 = 2,88 mq × 45 €/mq = 129,60 € + IVA 22%").

**Test (Vitest)**: 20+ casi che coprono ogni formula, minimo fatturabile, sconto riga + sconto totale, IVA, arrotondamenti, override manuale, optional di ogni tipo.

---

## Provider Adapters

### StorageProvider (interface)
```ts
uploadFile(buffer, fileName, mimeType): Promise<{ key, url }>
getFileUrl(key): Promise<string>
deleteFile(key): Promise<void>
listFiles(prefix?): Promise<FileMeta[]>
```
- **LocalStorageProvider**: scrive su `LOCAL_UPLOAD_DIR` (default `/app/uploads`), serve via API route `/api/files/[key]`.
- **AppwriteStorageProvider**: stub funzionale con SDK se `APPWRITE_ENABLED=true`, altrimenti throw.

### AIProvider (interface)
```ts
parsePricelist(text, hints): Promise<CandidateRow[]>
parseQuoteNote(text, catalog): Promise<QuoteNoteResult>
normalizeProductRows(rows): Promise<CandidateRow[]>
```
- **MockAIProvider**: euristiche regex + matching fuzzy sul catalogo (usa Levenshtein semplice).
- **AnthropicAIProvider / OpenAIProvider**: stub con TODO chiaro.

### AuthProvider (NextAuth v5)
- Credentials provider con bcrypt
- Session JWT con `companyId` + `role`
- Middleware redirect a `/login` se non autenticato
- Helper `requireRole(['ADMIN'])` per Server Actions

---

## Ordine di Implementazione

### Fase A — Foundation
1. `package.json`, `tsconfig.json`, `next.config.js`, `tailwind.config.ts`, `vitest.config.ts`, `.gitignore`, `.env.example`, `.env.production.example`
2. `prisma/schema.prisma` completo + prima migration
3. `src/lib/db.ts` (singleton Prisma)
4. `src/lib/pricing/` completo + 20+ test Vitest
5. Provider adapters (Storage local, AI mock, Auth config)

### Fase B — Layout & Auth
6. NextAuth v5 setup (`src/app/api/auth/[...nextauth]/route.ts`, `src/lib/auth/config.ts`, `src/middleware.ts`)
7. Login page `/login` + logout
8. shadcn/ui setup (`npx shadcn-ui@latest init` + componenti base: button, card, input, select, table, dialog, form, toast, dropdown-menu, tabs, badge, separator)
9. `(dashboard)/layout.tsx` con Sidebar + Topbar + DemoBadge

### Fase C — CRM
10. Dashboard `/dashboard` con widget aggregati
11. Customers CRUD (`/customers`, `new`, `[id]`, `[id]/edit`)
12. CustomerNote inline nella scheda cliente

### Fase D — Catalogo
13. Products CRUD (`/products`, `new`, `[id]`, `[id]/edit`) con DemoBadge
14. ProductOption gestito inline sulla scheda prodotto
15. Settings `/settings`

### Fase E — Listini
16. Upload + ingestion (xlsx, csv, pdf, docx) → `PricelistItemCandidate[]`
17. UI review `/pricelists/[id]/review` con tabella editabile (TanStack Table), bulk approve, validation errors visibili
18. Import → Product (idempotente, con `confidence` minima richiesta)

### Fase F — Preventivi
19. Wizard `/quotes/new` step-by-step (cliente → prodotti → misure → optional → calcolo riga → riepilogo)
20. Vista `/quotes/[id]` con stato, modifica, duplica
21. Parser nota libera (`/api/quotes/parse-note`) + UI conferma manuale prima di creare righe
22. Quote status transitions + audit log

### Fase G — Documenti PDF
23. `quote-pdf.tsx` con @react-pdf/renderer (intestazione Link Infissi, tabella prodotti, IVA, firma)
24. `contract-pdf.tsx` con template editabile
25. API routes generazione + salvataggio Document + collegamento a Quote/Customer

### Fase H — Infra & Seed
26. Seed Link Infissi: 1 Company, CompanySettings, 1 ADMIN, 5 customers, 18+ products (con `demoPrice=true`), 2 pricelists, 3 quotes, note demo
27. `Dockerfile` multi-stage (deps → builder → runner), `docker-compose.yml` dev (app + postgres + volume uploads), `docker-compose.coolify.yml` app-only
28. Healthcheck `/api/health` (DB ping)

### Fase I — Docs & verifica
29. README.md, ARCHITECTURE.md, COOLIFY.md, DEPLOYMENT.md, ENVIRONMENT.md, SECURITY.md, TASKS.md
30. Run `npm install`, `npm run db:generate`, `npm run db:migrate`, `npm run db:seed`, `npm run test`, `npm run dev` — verifica end-to-end
31. DELIVERY_REPORT.md finale

---

## File Critici (da creare)

**Core**:
- `prisma/schema.prisma` + `prisma/seed.ts`
- `src/lib/pricing/engine.ts` + `formulas.ts` + `rounding.ts`
- `src/lib/ai/note-parser.ts` + `mock.ts`
- `src/lib/ingestion/{csv,xlsx,pdf,docx}.ts` + `normalize.ts`
- `src/lib/documents/{quote-pdf,contract-pdf}.tsx`
- `src/lib/auth/config.ts` + `src/middleware.ts`

**UI critica**:
- `src/app/(dashboard)/layout.tsx`
- `src/app/(dashboard)/quotes/new/page.tsx` (wizard)
- `src/app/(dashboard)/pricelists/[id]/review/page.tsx` (review listino)

**Infra**:
- `Dockerfile`, `docker-compose.yml`, `docker-compose.coolify.yml`
- `.env.example`, `.env.production.example`

---

## Riutilizzo / Librerie

Tutto greenfield, ma uso package community testati:
- `next-auth@5.0.0-beta` (canary stabile)
- `@prisma/client@5`, `prisma@5`
- `@react-pdf/renderer@3`
- `xlsx`, `pdf-parse`, `mammoth`
- `bcryptjs`, `zod`, `react-hook-form`, `@hookform/resolvers`
- `@tanstack/react-table`
- `lucide-react` per icone
- `class-variance-authority`, `clsx`, `tailwind-merge` (richiesti da shadcn)
- `date-fns`

---

## Verifica End-to-End

Dopo l'implementazione, eseguo manualmente:

```bash
npm install
docker compose up -d postgres    # solo DB
npx prisma migrate dev
npx prisma db seed
npm run test                     # tutti i test pricing + parser passano
npm run dev                      # http://localhost:3000
```

**Smoke test funzionale**:
1. Login con `admin@linkinfissi.demo` / `password-demo-123`
2. Dashboard mostra contatori dal seed
3. Apro un cliente demo (Mario Rossi) → vedo note + preventivi collegati
4. Creo nuovo preventivo: aggiungo riga "Zanzariera avvolgibile laterale bianca 120×240" → calcolo automatico mostra `2,88 mq × 45 €/mq = 129,60 € + IVA`
5. Provo parser nota libera con frase di esempio → vedo righe candidate
6. Upload listino CSV → vedo candidate rows → approvo → diventano prodotti
7. Genero PDF preventivo → scarico, controllo intestazione Link Infissi + tabella + firma
8. Genero PDF contratto → controllo template
9. `/api/health` ritorna 200 con DB ok
10. `docker compose build` completa senza errori

**Verifica deploy**:
- `Dockerfile` builda standalone Next.js (`output: 'standalone'` in `next.config.js`)
- `.env.example` contiene tutte le variabili documentate
- `COOLIFY.md` descrive 13 step di setup (creare progetto → Git → Docker → DB → env → migrations → seed → healthcheck → dominio → test)

---

## Cosa NON è incluso nel MVP (documentato in DELIVERY_REPORT.md)

- OCR reale (immagini → testo): adapter stub
- AI provider reale (Anthropic/OpenAI): stub interfacce
- Email transactional (SMTP config presente ma non spedisce)
- Multi-tenant UI (CompanyId è singolo nella session)
- Gestione template PDF da UI (solo da codice)
- Backup automatico DB (documentato in SECURITY.md come step manuale)
- Test E2E Playwright (solo unit test Vitest)
- Rate limiting avanzato (solo placeholder middleware)

Tutto chiaramente etichettato in `DELIVERY_REPORT.md` con stato e prossimi step.

---

## Stima ordine di grandezza

- ~80 file TypeScript/TSX
- ~13 modelli Prisma + 1 migration iniziale
- ~25 test Vitest
- ~7 documenti markdown
- 1 Dockerfile + 2 docker-compose

Implementazione in **un'unica sessione lunga** seguendo l'ordine A → I sopra.
