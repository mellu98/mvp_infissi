# Security

## Stato MVP

Questo MVP è pensato per demo/staging e primo hardening, non per produzione pubblica senza revisione.

## Autenticazione

- NextAuth v5 credentials.
- Password seed hashata con bcrypt cost 12.
- Session JWT con `companyId` e `role`.
- Middleware protegge dashboard/API non pubbliche.

## Dati e tenant

I servizi Prisma filtrano per `companyId`. Questo riduce leakage cross-tenant, ma prima di multi-tenant reale serve audit dedicato.

## File upload

- Storage locale sotto `LOCAL_UPLOAD_DIR`.
- File serviti da `/api/files/[...key]` solo ad utenti autenticati.
- Chiavi storage validate contro path traversal nel provider locale.

## Dipendenze

`npm audit --omit=dev` segnala vulnerabilità produttive:

- `next@14.2.13` — advisories anche critici/high; npm suggerisce upgrade major.
- `next-auth@5.0.0-beta.20` — advisory moderato, fix in beta più recente.
- `xlsx@0.18.5` — advisories high senza fix npm ufficiale.

Decisione consigliata: pianificare un branch dedicato di upgrade, non farlo “al volo” mentre si implementano feature. Prima capire breaking changes, poi testare.

## Backup

Prima di produzione:

- backup automatico PostgreSQL giornaliero;
- retention minima 14-30 giorni;
- test periodico restore;
- backup volume `/app/uploads`.

## Non incluso

- Rate limiting avanzato.
- Audit security completo.
- Antivirus upload.
- OCR/AI provider reali.
