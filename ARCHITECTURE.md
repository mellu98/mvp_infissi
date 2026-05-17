# Architettura

## Principio non negoziabile

Il prezzo finale è calcolato **solo** dal motore deterministico in `src/lib/pricing`.
Parser AI/mock e ingestion producono **candidati**, mai prezzi finali automatici non validati. Ogni riga sospetta finisce in revisione manuale prima di entrare in catalogo o in un preventivo.

## Decisioni architetturali pragmatiche (MVP)

### Perché PostgreSQL + Prisma e non Appwrite

Il dominio è fortemente relazionale (clienti → preventivi → righe → prodotti → optional → listini → candidate rows → documenti → audit). PostgreSQL gestisce naturalmente:

- Vincoli di integrità referenziale (`onDelete: Cascade`/`Restrict`).
- Query aggregate per dashboard.
- Indici composti per multi-tenant.
- Transazioni ACID per le ricalcolature totali del preventivo.

Appwrite è ottimo per auth e storage gestiti, ma il suo modello document-based non si presta bene a query relazionali profonde. Per il MVP **Appwrite è opzionale**: l'adapter `AppwriteStorageProvider` esiste come stub e documentazione (`src/lib/storage/appwrite.ts`), ma il default è `LocalStorageProvider`.

### Pricing engine — modulo puro

`src/lib/pricing/` non importa nulla di Prisma o React: solo `number`, `string` e oggetti POJO. Questo permette di:

- Testarlo in isolamento con Vitest (14 file di test, 60+ assertion).
- Riusarlo nel seed, nel servizio quotes e in eventuali futuri job batch.
- Sostituire il backend (Prisma) senza toccare la logica prezzo.

### Float vs Decimal per i prezzi

Scelta MVP: **Float**. Il motore arrotonda sempre a 2 decimali con `round2` (gestione `Number.EPSILON` per evitare il classico 1.005 → 1.00). Per amounts ≤ 1M questa scelta non introduce errori percepibili. Se in futuro servono importi superiori o aggregazioni di milioni di righe, migrare a `Decimal @db.Decimal(12,2)` è un cambio mirato in `schema.prisma` + casting esplicito nel motore.

### Multi-tenant ready

Tutti i 13 modelli applicativi hanno `companyId`. Ogni `findFirst/findMany` nei servizi filtra per `companyId` preso dalla session (`session.user.companyId`). Per il MVP esiste una sola azienda (`demo-link-infissi` dal seed), ma:

- Schema indici già preparato (`@@index([companyId, ...])`).
- Helper `getCurrentCompanyId()` in `src/lib/auth/guards.ts`.
- UI non espone selezione azienda — quando si vorrà venderlo a più clienti basta aggiungere uno switcher e un middleware più sofisticato.

## Layer principali

```
src/
├── app/                          # Next.js App Router (route + Server Components)
│   ├── (auth)/login/             # pagina login
│   ├── (dashboard)/              # area protetta (sidebar + topbar)
│   │   ├── dashboard/            # widget aggregati
│   │   ├── customers/            # CRUD CRM
│   │   ├── products/             # catalogo + optional
│   │   ├── pricelists/           # upload + review
│   │   ├── quotes/               # creazione + dettaglio + righe
│   │   └── settings/             # impostazioni azienda (ADMIN only)
│   └── api/
│       ├── auth/[...nextauth]/   # NextAuth handlers
│       ├── health/               # /api/health
│       ├── files/[...key]/       # streaming file (auth-protetto)
│       └── quotes/
│           ├── [id]/pdf/         # genera PDF preventivo
│           ├── [id]/contract/    # genera PDF contratto
│           └── parse-note/       # parser nota libera
├── components/                   # UI client + presentational
│   ├── ui/                       # shadcn-style primitives
│   ├── layout/                   # sidebar, topbar, demo-badge
│   ├── customers/, products/, quotes/, pricelists/, settings/
│   └── forms/                    # RHF + Zod
├── lib/                          # dominio puro + adapter
│   ├── pricing/                  # MOTORE PREZZI — pure functions
│   ├── ai/                       # provider AI + parser euristici
│   ├── ingestion/                # CSV/XLSX/PDF/DOCX + OCR stub
│   ├── documents/                # @react-pdf/renderer templates
│   ├── storage/                  # LocalStorage + AppwriteStorage stub
│   ├── validation/               # schemi Zod condivisi
│   ├── auth/                     # guards lato server
│   ├── audit.ts                  # log audit
│   └── db.ts                     # Prisma singleton
├── server/
│   ├── services/                 # use case (DB + audit)
│   └── actions/                  # Next.js Server Actions
├── auth.config.ts                # edge-safe NextAuth config (middleware)
├── auth.ts                       # full NextAuth + Credentials + Prisma
└── middleware.ts                 # auth gate per tutte le route protette
```

## Flusso preventivo end-to-end

```
1. Server Action createQuote
   └── reserveNextQuoteNumber()  → progressivo {prefix}{year}-{0000}
       ↳ atomic in transazione su CompanySettings.quoteCounterValue

2. Server Action addQuoteItem (transazione)
   ├── load product + optional (filtrato per companyId, active)
   ├── snapshot productSnapshot + optionSnapshots (immutabili)
   ├── calculateQuoteLine(snapshot, input, settings)
   │     ↳ formule + sconto + IVA + spiegazione testuale
   ├── insert QuoteItem
   └── recalculateQuoteTotalsTx → aggrega tutte le righe

3. UI mostra dettaglio + tabella righe + parser nota libera affianco

4. PDF su richiesta
   └── /api/quotes/[id]/pdf → renderToBuffer(<QuotePdf/>) → Document + log audit
```

## Flusso listini end-to-end

```
1. /pricelists/new (Server Action multipart)
   ├── upload via StorageProvider in {companyId}/pricelists/{YYYY/MM}/{uuid}-{name}
   ├── crea Pricelist (status: UPLOADED)
   ├── ingestFile() → RawIngestion (rows + warnings)
   ├── normalizeIngestion() → CandidateRow[]
   ├── persistCandidates → PricelistItemCandidate[]
   └── status: NEEDS_REVIEW

2. /pricelists/[id]/review
   ├── tabella righe con confidence Alta/Media/Bassa
   ├── modifica inline (server action updateCandidate)
   ├── toggle approvato (server action toggleCandidate)
   └── pulsante "Importa" (server action importApprovedCandidatesToCatalog)
       └── per ogni riga approvata: upsert Product per (companyId, sku)
       └── status: APPROVED
```

## Provider adapters

### StorageProvider (`src/lib/storage`)

```ts
uploadFile({ buffer, fileName, mimeType, prefix? }): Promise<{ key, url }>
getFileUrl(key): Promise<string>
readFile(key): Promise<Buffer>
deleteFile(key): Promise<void>
listFiles(prefix?): Promise<FileMeta[]>
```

- **`LocalStorageProvider`** (default): scrive in `LOCAL_UPLOAD_DIR`. URL serviti via `/api/files/[...key]` con auth check.
- **`AppwriteStorageProvider`** (stub): metodi che lanciano `StorageError`. Per attivarlo serve installare `node-appwrite` e implementare i metodi descritti nel file.

### AIProvider (`src/lib/ai`)

```ts
parsePricelist(text, hints?): Promise<CandidateRow[]>
parseQuoteNote(text, catalog): Promise<QuoteNoteResult>
normalizeProductRows(rows): Promise<CandidateRow[]>
```

- **`MockAIProvider`** (default): heuristics regex locali. `parseQuoteNoteHeuristic` estrae quantità (numeri e parole italiane), dimensioni (con `misura` keyword per disambiguazione), colore, materiale, varianti, servizi (posa/trasporto/detrazioni). Matching catalogo via score tokenization con boost per modelli noti (K5000, Zeus, Coveral...).
- **`AnthropicAIProvider`** / **`OpenAIProvider`**: stub. Loggano warning e fallano sui metodi heuristic. Per attivarli installare SDK e implementare con Zod-validated structured output.

### AuthProvider (NextAuth v5)

- Edge-safe `auth.config.ts` per il middleware (no Prisma).
- Full `auth.ts` con `CredentialsProvider` + bcrypt + `prisma.user.findFirst`.
- Session JWT con `companyId`, `role`, `email`, `name`.
- Helper `requireSession` / `requireRole(['ADMIN'])` / `getCurrentCompanyId()` per Server Actions e pages.

## Multi-tenancy

Schema pronto, UI single-tenant. Punti dove servirà refactor quando si attiva multi-tenant:

1. `src/auth.ts` → aggiungere endpoint per scegliere azienda dopo login se l'utente ha accesso a più tenant.
2. `src/lib/auth/guards.ts` → leggere `companyId` da cookie/query oltre che da session.
3. Layout dashboard → aggiungere switcher azienda nella topbar.
4. Tutti i `Server Actions` → ricontrollare che usino sempre `getCurrentCompanyId()` (non companyId hardcoded).

## Pre-produzione checklist

Prima di vendere il MVP a un cliente reale serve:

1. **Dominio** registrato e DNS configurato.
2. **Accesso Coolify** funzionante (server Hetzner provisioned).
3. **Database**: scegliere tra PostgreSQL gestito da Coolify o servizio esterno (RDS / Hetzner Cloud / Supabase). Per Link Infissi va benissimo containerizzato.
4. **Appwrite endpoint + project ID + bucket ID**: solo se si decide di attivarlo. Per il MVP non serve.
5. **SMTP**: scegliere provider (Postmark/SendGrid/Brevo) se servono notifiche. Per il MVP non serve.
6. **Backup**: definire policy retention + script `pg_dump` + sync volume uploads.
7. **Dimensione storage**: stimare crescita PDF/listini. Per Link Infissi attesi <10 GB/anno.
8. **Numero utenti**: stimare. Per Link Infissi <5 utenti operativi.
9. **Policy privacy/GDPR**: redigere e linkare nel footer (placeholder oggi nei contratti).
10. **Audit security** sul layer auth e upload (rate limiting, antivirus, ZIP-bomb protection sui listini).

## Stub esplicitamente dichiarati

| Modulo | File | Stato |
|---|---|---|
| OCR immagini | `src/lib/ingestion/image.ts` | Mock, restituisce warning chiaro |
| Anthropic AI | `src/lib/ai/anthropic.ts` | Fallback a heuristics + console.warn |
| OpenAI | `src/lib/ai/openai.ts` | Idem |
| Appwrite storage | `src/lib/storage/appwrite.ts` | Throw StorageError su ogni metodo |
| `CUSTOM_FORMULA` pricing | `src/lib/pricing/formulas.ts` | Throw — usare `manualPriceOverride` |
| Email transazionali | nessun file | Campi SMTP in env ma nessun client |
| Rate limiting | nessun file | Middleware base solo per auth |
