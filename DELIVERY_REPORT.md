# Delivery Report — MVP Infissi (Link Infissi SRL)

## Obiettivo

MVP per **LINK INFISSI SRL Unipersonale**: CRM, listini, catalogo, configuratore preventivi con motore prezzi deterministico, generazione PDF preventivo e contratto. Deploy target: Hetzner via Coolify.

## Stato attuale

✅ **Pronto per deploy staging.** Smoke test browser completato con database attivo: login → dashboard → creazione cliente → preventivo con calcolo riga → parser nota libera → generazione PDF preventivo e contratto. Tutto funzionante end-to-end.

### Metriche

- **61/61** test Vitest verdi.
- **TypeScript strict**: nessun errore (`npx tsc --noEmit` exit 0).
- **ESLint**: nessun warning.
- **Prisma schema**: validato e formattato.
- **`npm audit --omit=dev`**: 3 vulnerabilità prod (1 critical, 1 high, 1 moderate). Vedi `SECURITY.md` per dettagli e roadmap.

## Incluso nel MVP

### Funzionalità

- Autenticazione credentials con bcrypt + ruoli (ADMIN / SALES / TECHNICIAN).
- Dashboard con contatori clienti, preventivi (per stato), valore totale, listini da revisionare, prodotti attivi.
- CRM clienti (privati e aziende) + note interne con audit log per autore.
- Catalogo prodotti con 6 formule prezzo (FIXED, PER_SQM, PER_LM, BASE_PLUS_AREA, BASE_PLUS_OPTIONS, CUSTOM stub) + optional con 4 tipi prezzo.
- Badge DEMO sui prezzi non reali (configurabile per prodotto).
- Settings azienda editabili (anagrafica, IVA default, condizioni preventivo e contratto, numerazione progressiva annuale).
- Upload listini CSV / XLSX / PDF / DOCX (immagini accettate, OCR stub).
- Review listino: tabella editabile con badge confidenza, bulk approve, import idempotente nel catalogo (upsert per SKU).
- Preventivi:
  - Creazione wizard con numerazione progressiva `{prefix}{anno}-{0000}` atomica.
  - Aggiunta righe con calcolo deterministico server-side + spiegazione testuale (es. *"Area 2,88 mq × 45 €/mq = 129,60 € + IVA 22%"*).
  - Optional con 4 tipi (FIXED, PER_SQM, PER_LM, PERCENTAGE).
  - Sconto per riga + sconto globale per preventivo.
  - Duplica preventivo, transizione stato (DRAFT → CALCULATED → SENT → ACCEPTED / REJECTED / EXPIRED).
  - Parser nota libera euristico con conferma manuale obbligatoria.
- PDF preventivo e contratto via `@react-pdf/renderer`:
  - Intestazione Link Infissi con dati reali (P.IVA 02916820182, Via Borsellino 73 Zinasco, +39 392 4114301, linkinfissi@gmail.com).
  - Tabella righe con misure, prezzi, optional, spiegazione calcolo.
  - Totali e condizioni standard (Made in Italy, garanzia, supporto detrazioni, modalità pagamento, GDPR).
  - Spazi firma cliente / azienda.
- Documenti generati salvati come `Document` collegati al preventivo + log audit.
- Audit log su ogni operazione critica (clienti, preventivi, listini, prodotti, PDF, login).

### Infrastruttura

- Dockerfile multi-stage (deps → builder → runner) ottimizzato per Next standalone su `node:20-alpine`.
- `docker-compose.yml` per dev locale (app + Postgres + volumi).
- `docker-compose.coolify.yml` per Coolify (app-only, DB esterno).
- Healthcheck `/api/health` con ping DB.
- Volume persistente per uploads.
- Multi-tenant schema con `companyId` su tutti i record applicativi.

### Documentazione

- `README.md` — 13 sezioni operative (setup, comandi, DB, seed, test, listini, validazione, preventivi, PDF, architettura, limiti, roadmap).
- `ARCHITECTURE.md` — decisioni pragmatiche, layer, flussi end-to-end, pre-produzione checklist.
- `COOLIFY.md` — 13 step deploy + smoke test post-deploy + troubleshooting.
- `DEPLOYMENT.md`, `ENVIRONMENT.md`, `SECURITY.md`, `TASKS.md`, `DELIVERY_REPORT.md`.

## Non incluso (dichiarato come stub)

| Area | Stato | Dove |
|---|---|---|
| OCR immagini | Stub con warning chiaro | `src/lib/ingestion/image.ts` |
| Anthropic / OpenAI provider | Stub con fallback a heuristics | `src/lib/ai/{anthropic,openai}.ts` |
| Appwrite storage | Stub che lancia `StorageError` | `src/lib/storage/appwrite.ts` |
| `CUSTOM_FORMULA` pricing | Throw — usare `manualPriceOverride` | `src/lib/pricing/formulas.ts` |
| Email transazionali | Campi SMTP in env, nessun client | — |
| Multi-tenant UI | Schema pronto, UI single-tenant | — |
| Test E2E browser | Solo unit Vitest; smoke test manuale | — |
| Backup automatico | Documentato in `SECURITY.md` come step manuale | — |
| Rate limiting | Solo middleware auth base | — |

## Credenziali demo

- Email: `admin@linkinfissi.demo`
- Password: `password-demo-123`
- Ruolo: ADMIN

Anche disponibile `vendite@linkinfissi.demo` con ruolo SALES.

## Rischi noti

- **Dipendenze**: 1 critical (`next@14.2.13` — 22 CVE chiusi solo via upgrade Next 16 major), 1 high senza fix npm ufficiale (`xlsx@0.18.5`), gestiti in branch dedicato post-staging. Vedi `SECURITY.md`.
- **PDF da validare visivamente** su dati reali del cliente prima della demo: aprire un preventivo seed, generare PDF, controllare layout e contenuto.
- **Antivirus su upload**: non incluso. Mitigato dal fatto che solo utenti autenticati possono caricare. ClamAV sidecar consigliato per produzione.
- **OCR**: solo stub. Listini come scansioni/immagini richiedono inserimento manuale prodotti.

## Prossimi step consigliati

1. **Deploy staging su Coolify/Hetzner** seguendo `COOLIFY.md` (13 step).
2. **Validazione PDF** su dati reali (intestazione, righe complesse).
3. **Hardening dipendenze** in branch dedicato: `xlsx → exceljs`, `next 14 → 16`.
4. **Test E2E Playwright** per il flusso critico login → cliente → preventivo → PDF.
5. **Provider AI reale Anthropic** dietro feature flag, per parsing listini complessi.
6. **Backup automatico** PostgreSQL + volume uploads.

## Verifica locale rapida

```bash
npm install --legacy-peer-deps
docker compose up -d postgres
npm run db:generate
npm run db:migrate
npm run db:seed
npm run test
npm run dev
# → http://localhost:3000, login admin@linkinfissi.demo / password-demo-123
```
