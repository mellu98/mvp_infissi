# Delivery Report

## Obiettivo

MVP per LINK INFISSI SRL: CRM, listini, catalogo, preventivi, motore prezzi deterministico e documenti PDF.

## Incluso

- Autenticazione credentials con ruoli.
- Dashboard con metriche base.
- Clienti e note.
- Catalogo prodotti, optional e badge prezzi demo.
- Ingestion listini CSV/XLSX/PDF/DOCX e OCR mock.
- Review listini e import candidati a catalogo.
- Preventivi con calcolo righe deterministicamente lato server.
- Parser appunti sopralluogo euristico/mock con conferma manuale.
- PDF preventivo e contratto salvati come `Document`.
- Seed demo Link Infissi.
- Dockerfile e compose per deploy.

## Non incluso

- OCR reale.
- AI provider reale Anthropic/OpenAI.
- Invio email.
- Backup automatico.
- Test E2E browser.
- Hardening finale dipendenze.

## Verifiche disponibili

```bash
npm run test
npx tsc --noEmit
npm run lint
```

Ultimo stato verificato: tutti passano. Non è stata eseguita build per rispettare la regola di progetto.

## Credenziali demo

- Email: `admin@linkinfissi.demo`
- Password: `password-demo-123`

## Rischi aperti

- La directory non è ancora una repository Git.
- Mancano migrazioni Prisma versionate.
- `npm audit --omit=dev` segnala vulnerabilità su Next/NextAuth/xlsx.
- PDF da validare visivamente su dati reali.
