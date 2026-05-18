# Guida Deploy su Coolify (Hetzner)

Guida rapida per deployare il progetto MVP Infissi su un server Hetzner gestito da Coolify.

## Prerequisiti

- Server Hetzner (CX22 o superiore: 2 vCPU, 4 GB RAM consigliati)
- Coolify installato sul server (`curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash`)
- Accesso alla repository GitHub: `https://github.com/mellu98/mvp_infissi`
- Dominio puntato al server con record A (es. `app.tuodominio.it`)

## Step 1: Crea progetto e collega repository

1. Dashboard Coolify → **Projects → + New Project** → nome: `mvp-infissi`
2. **Resources → + New Resource → Application → Public Repository**
3. Inserisci URL repo: `https://github.com/mellu98/mvp_infissi`
4. Branch: `main` — Build pack: **Dockerfile**

## Step 2: Crea database PostgreSQL

1. **Resources → + New Resource → Database → PostgreSQL 16**
2. Nome: `mvp-infissi-db` — Database: `mvp_infissi`
3. Annota la **`DATABASE_URL`** che Coolify genera automaticamente

## Step 3: Configura variabili d'ambiente

Vai su Application → **Environment Variables** e incolla tutte le righe seguenti, personalizzando i valori indicati.

### Variabili obbligatorie

```env
NODE_ENV=production
PORT=3000

# Dominio dell'app (sostituisci con il tuo)
APP_URL=https://app.tuodominio.it
NEXT_PUBLIC_APP_URL=https://app.tuodominio.it

# Database (copia la stringa dal database creato su Coolify)
DATABASE_URL=postgresql://user:password@host:5432/mvp_infissi?schema=public&sslmode=require

# Auth (genera NEXTAUTH_SECRET con: openssl rand -base64 32)
NEXTAUTH_URL=https://app.tuodominio.it
NEXTAUTH_SECRET=INSERISCI_QUI_LA_CHIAVE_GENERATA
AUTH_TRUST_HOST=true

# Storage
STORAGE_PROVIDER=local
LOCAL_UPLOAD_DIR=/app/uploads

# AI (mock per MVP)
AI_PROVIDER=mock

# Seed (true solo per ambiente demo, false in produzione)
ALLOW_PROD_SEED=false
```

### Variabili opzionali

```env
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
SMTP_HOST=
SMTP_USER=
SMTP_PASSWORD=
```

## Step 4: Configura volume per gli upload

Application → **Storages → + Add Volume**

- Source: `mvp-infissi-uploads`
- Destination: `/app/uploads`

Questo volume persiste tra i redeploy.

## Step 5: Dominio e HTTPS

Application → **Domains → + Add Domain** → inserisci il tuo dominio.

Coolify gestisce automaticamente il certificato Let's Encrypt via Traefik.

## Step 6: Primo deploy

Clicca **Deploy**. Al termine, l'app risponde su `https://app.tuodominio.it`.

## Step 7: Migrazioni database

Una tantum dopo il primo deploy, apri il terminale dall'app su Coolify:

```bash
npm run db:deploy
```

Questo crea tutte le tabelle nel database.

## Step 8: Seed dati demo (solo staging)

Se vuoi caricare dati demo per testare:

```bash
ALLOW_PROD_SEED=true npm run db:seed
```

**ATTENZIONE:** in produzione con dati reali non eseguire il seed.

## Credenziali demo (dopo seed)

| Utente | Email | Password | Ruolo |
|---|---|---|---|
| Admin | `admin@linkinfissi.demo` | `password-demo-123` | ADMIN |
| Vendite | `vendite@linkinfissi.demo` | `password-demo-123` | SALES |

## Healthcheck

L'app espone un endpoint di controllo:

```
GET /api/health
```

Deve rispondere con status `200` e JSON:

```json
{ "status": "ok", "db": "ok" }
```

## Troubleshooting rapido

| Problema | Causa | Soluzione |
|---|---|---|
| App crasha all'avvio | Manca `DATABASE_URL` | Verifica variabili d'ambiente |
| Login non funziona | Manca `AUTH_TRUST_HOST=true` | Aggiungi e riavvia |
| Upload fallisce | Volume non montato | Verifica Storage su `/app/uploads` |
| PDF vuoto/errore 500 | Mancano impostazioni azienda | Vai su `/settings` e salva |

## Variabili minime per produzione

Se vuoi solo l'essenziale, queste sono strettamente necessarie:

```env
APP_URL=https://app.tuodominio.it
NEXT_PUBLIC_APP_URL=https://app.tuodominio.it
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://app.tuodominio.it
NEXTAUTH_SECRET=...
AUTH_TRUST_HOST=true
STORAGE_PROVIDER=local
LOCAL_UPLOAD_DIR=/app/uploads
AI_PROVIDER=mock
ALLOW_PROD_SEED=false
NODE_ENV=production
PORT=3000
```
