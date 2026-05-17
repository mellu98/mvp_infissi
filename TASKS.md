# Tasks

## Fatto

- [x] Foundation Next.js 14 / TypeScript strict / Tailwind / Vitest.
- [x] Prisma schema 13 modelli multi-tenant-ready + migration iniziale.
- [x] Motore prezzi deterministico in modulo puro.
- [x] 61 test pricing/parser/ingestion verdi.
- [x] NextAuth v5 credentials + bcrypt + JWT + middleware.
- [x] Dashboard con widget aggregati.
- [x] CRM clienti + note + lead status.
- [x] Catalogo prodotti + optional + badge DEMO.
- [x] Settings azienda editabili.
- [x] Upload e review listini (CSV/XLSX/PDF/DOCX + OCR stub).
- [x] Preventivi con righe calcolate deterministicamente + duplica.
- [x] Parser nota libera (regex euristico) con conferma manuale.
- [x] PDF preventivo e contratto con `@react-pdf/renderer`, salvati come `Document`.
- [x] Seed Link Infissi con dati anagrafici reali + 18 prodotti demo.
- [x] Dockerfile multi-stage + docker-compose dev + docker-compose.coolify.
- [x] Documentazione completa (README, ARCHITECTURE, COOLIFY, DEPLOYMENT, ENVIRONMENT, SECURITY, DELIVERY_REPORT).
- [x] Hardening sicurezza: `next-auth` aggiornato a 5.0.0-beta.31.
- [x] Smoke test browser end-to-end con DB attivo (verificato manualmente).
- [x] Migrazione Prisma iniziale committata.

## Prima del deploy staging

- [ ] Validare PDF generati su dati reali (firma, intestazione, righe complesse con optional).
- [ ] Provisionare server Hetzner + Coolify (vedi `COOLIFY.md` step 1-13).
- [ ] Configurare dominio DNS + HTTPS via Coolify.
- [ ] Backup automatico DB + volume uploads attivati.
- [ ] Decidere se attivare seed demo su staging (`ALLOW_PROD_SEED=true`).

## Hardening dipendenze (branch dedicato)

- [ ] Migrare `xlsx@0.18.5` → `exceljs` per chiudere 2 advisory high (no fix npm ufficiale).
- [ ] Upgrade `next@14.2.13` → `next@16.x` (major) per chiudere 22 CVE.
  - Cambiamenti previsti: `params` async, middleware API, next/headers, next/dynamic.
  - Stima: 1-2 giorni + test E2E.
- [ ] Integrare Dependabot / Snyk in CI per audit continuo.

## Fuori MVP (post-staging)

- [ ] OCR reale per immagini (tesseract.js o cloud OCR).
- [ ] Provider AI reale (Anthropic Claude) per parsing listini complessi e note libere.
- [ ] Template PDF modificabili da UI (oggi solo `quoteTerms`/`contractTerms` da settings).
- [ ] Email transazionali (SMTP campo presente, invio non implementato).
- [ ] Multi-tenant UI (schema pronto, manca switcher).
- [ ] Test E2E Playwright per flusso login → cliente → preventivo → PDF.
- [ ] Endpoint export/delete dati cliente per GDPR.
- [ ] Rate limiting e antivirus su upload.
- [ ] Cancellazione soft per preventivi (oggi hard delete).
