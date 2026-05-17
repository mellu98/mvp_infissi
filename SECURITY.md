# Security

## Stato MVP

Questo MVP è pensato per demo/staging e primo hardening, non per produzione pubblica senza revisione finale.

## Autenticazione

- **NextAuth v5** (versione `5.0.0-beta.31`+) con CredentialsProvider.
- Password seed hashate con **bcrypt cost 12**.
- Session JWT con `companyId` e `role` (ADMIN / SALES / TECHNICIAN).
- Middleware (`src/middleware.ts`) protegge tutte le route dashboard e API non pubbliche.
- Solo `/api/auth/*`, `/api/health`, `/api/files/*` (con check sessione interno) sono fuori dal gate del middleware.

## Multi-tenancy

Tutti i servizi Prisma filtrano per `companyId` dalla session JWT. Questo riduce leakage cross-tenant, ma prima di abilitare multi-tenant reale (più aziende reali) serve audit dedicato: rivedere ogni `findFirst`/`findMany`/`update`/`delete` per assicurarsi che il filtro sia presente.

## File upload

- Storage locale sotto `LOCAL_UPLOAD_DIR` (default `/app/uploads` in container).
- File serviti da `/api/files/[...key]` **solo a utenti autenticati**.
- Chiavi storage validate contro path traversal nel provider locale (`src/lib/storage/local.ts`).
- Limite dimensione file listino: **25 MB** (vedi `pricelists.service.ts`).
- Estensioni accettate: csv, xlsx, xls, pdf, docx, doc, png, jpg, jpeg.

### Mancanze note
- Niente antivirus su upload (consigliato `ClamAV` sidecar per produzione).
- Niente protezione ZIP-bomb sui `.xlsx` (formato in realtà ZIP).
- Niente content-type sniffing forzato lato server.

## Dipendenze

Stato al `npm audit --omit=dev` corrente: **3 vulnerabilità prod** (1 critical, 1 high, 1 moderate).

| Package | Severity | Stato | Strategia |
|---|---|---|---|
| `next@14.2.13` | critical (multi-CVE) | **Fix solo via upgrade a Next 16** | Branch dedicato `upgrade/next-16` con piano di migrazione (server actions, params API, middleware). NON fare al volo. |
| `postcss` (transitiva di next) | moderate | Fix con upgrade Next | Idem |
| `xlsx@0.18.5` | high (2 CVE) | **No fix npm ufficiale** | Migrazione a `exceljs` consigliata. Mitigazione attuale: solo utenti autenticati possono caricare file; categoria di rischio principalmente DoS via ReDoS e Prototype Pollution su input controllato. |
| `next-auth` | ✅ moderate fixata | Aggiornato a `5.0.0-beta.31` | Done |

### Roadmap hardening dipendenze

1. **xlsx → exceljs**: refactor `src/lib/ingestion/xlsx.ts` con `exceljs` (API simile, mantenute le stesse semantiche). Stima: 1 ora di lavoro + test.
2. **Next 16**: branch dedicato. Cambiamenti notevoli: `params` ora async, middleware API leggermente diversa, `next/headers` ricontrollato. Stima: 1-2 giorni di lavoro + test E2E.

### Comandi utili

```bash
npm audit --omit=dev          # solo prod deps
npm audit --json | jq '.vulnerabilities | keys'
npm outdated                   # versioni disponibili
```

## Backup

Prima di produzione reale:

- **Backup automatico PostgreSQL** giornaliero (Coolify ha built-in scheduling, oppure cron `pg_dump`).
- **Retention** minima 14-30 giorni, idealmente 90 per audit.
- **Test periodico restore** mensile.
- **Backup volume `/app/uploads`** via snapshot Hetzner o sync rsync verso bucket S3-compatible.

Documentato nei comandi in `COOLIFY.md`.

## GDPR

Dati personali trattati:
- Anagrafica clienti (nome, indirizzo, codice fiscale, email, telefono).
- Eventuale partita IVA per clienti business.
- Note interne dei venditori (possono contenere informazioni sensibili).

Provvedimenti attuali:
- Audit log su ogni operazione su `Customer` e `Quote` (`src/lib/audit.ts`).
- Cancellazione cliente fa cascade su note e a `SetNull` su preventivi (mantiene storico ma anonimizza).
- Privacy placeholder nel contratto PDF (`Reg. UE 2016/679` citato nei `contractTerms`).

Mancanze:
- Informativa privacy completa da redigere e linkare nel footer.
- Endpoint export/delete dati cliente (diritto all'oblio).
- Cifratura at-rest del DB (gestita di solito da PostgreSQL provider o LUKS volume).

## Audit log

Ogni operazione critica scrive `AuditLog`:
- creazione/modifica/eliminazione cliente
- aggiunta note
- upload e approvazione listino
- creazione/aggiornamento prodotto
- creazione/modifica/eliminazione preventivo + righe
- cambio stato preventivo
- generazione PDF
- update impostazioni

Vedi `src/lib/audit.ts`.

## Non incluso (consapevolmente)

- **Rate limiting** avanzato (no `next-ratelimit` o reverse proxy rules).
- **Antivirus** su upload.
- **2FA / TOTP** per utenti.
- **OAuth provider** (solo credentials).
- **CAPTCHA** sul login.
- **HSTS / CSP** header (Coolify/Traefik di solito li gestisce).
- **Vulnerability scanner CI**: integrare Snyk/GitHub Dependabot prima del deploy.
