# Deploy su Coolify (Hetzner)

Guida operativa per portare il MVP in staging/produzione su un server Hetzner gestito da Coolify.

## Prerequisiti

- Server Hetzner (CX22 o superiore consigliato — 2 vCPU, 4 GB RAM).
- Coolify installato sul server (`curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash`).
- Repository Git accessibile (GitHub/GitLab/self-hosted).
- Dominio puntato al server con record A verso l'IP pubblico (es. `app.linkinfissi.it`).
- Email SMTP non obbligatoria per il MVP (campi presenti, invio non implementato).

## 13 step di setup

### 1. Crea progetto su Coolify

Dashboard Coolify → **Projects → + New Project** → `mvp-infissi`.

### 2. Collega repository Git

**Resources → + New Resource → Application → Public Repository** (o privato con deploy key).

Branch: `main`. Build pack: **Dockerfile**.

### 3. Scegli Docker Compose o Dockerfile

Due opzioni:

**Opzione A — Solo Dockerfile (consigliata)**. Coolify builda con `Dockerfile` presente in repo e gestisce il DB come risorsa separata.

**Opzione B — `docker-compose.coolify.yml`**. App-only, DB esterno. Utile se Coolify ha un proxy/build personalizzato.

### 4. Crea PostgreSQL

**Resources → + New Resource → Database → PostgreSQL 16**.

Nome: `mvp-infissi-db`. Database: `mvp_infissi`. Username/password generati. Annota la **`DATABASE_URL`**.

Alternativa: usare un PostgreSQL esterno (RDS, Supabase, Hetzner Cloud DB) e incollare la URL.

### 5. Imposta `DATABASE_URL`

Application → **Environment Variables**:

```
DATABASE_URL=postgresql://user:pass@host:5432/mvp_infissi?schema=public&sslmode=require
```

### 6. Genera `NEXTAUTH_SECRET`

Sul server o in locale:

```bash
openssl rand -base64 32
```

Salva il valore in Env: `NEXTAUTH_SECRET=...`.

### 7. Configura `APP_URL` / `NEXTAUTH_URL`

```
APP_URL=https://app.linkinfissi.it
NEXTAUTH_URL=https://app.linkinfissi.it
NEXT_PUBLIC_APP_URL=https://app.linkinfissi.it
AUTH_TRUST_HOST=true
```

`AUTH_TRUST_HOST=true` è **obbligatorio** dietro proxy.

### 8. Configura storage

**Local (consigliato per MVP)**:

```
STORAGE_PROVIDER=local
LOCAL_UPLOAD_DIR=/app/uploads
```

In Application → **Storages → + Add Volume**:

- Source: `mvp-infissi-uploads`
- Destination: `/app/uploads`

Quel volume persiste tra redeploy.

**Appwrite (opzionale)**: lasciare `STORAGE_PROVIDER=local` per il MVP. L'adapter `AppwriteStorageProvider` è uno stub volutamente non implementato (vedi `src/lib/storage/appwrite.ts`).

### 9. Esegui migrazioni Prisma

Una tantum dopo il primo deploy. Da Coolify → **Application → Terminal**:

```bash
npm run db:deploy
```

Genera le tabelle dalla migration iniziale `prisma/migrations/20260517120000_init/`.

### 10. Seed iniziale (solo demo)

Solo per ambiente staging/demo:

```bash
ALLOW_PROD_SEED=true npm run db:seed
```

In produzione reale per cliente: **NON eseguire seed**. L'admin va creato manualmente o tramite uno script dedicato.

### 11. Healthcheck

`GET /api/health` deve rispondere `200`:

```json
{ "status": "ok", "db": "ok", "uptime": 42.1, "timestamp": "..." }
```

Coolify monitora questo endpoint via Dockerfile `HEALTHCHECK` definito in `docker-compose*.yml`.

### 12. Dominio e HTTPS

Application → **Domains → + Add Domain** → `app.linkinfissi.it`.

Coolify gestisce certificato Let's Encrypt automaticamente via Traefik. Verifica che il record DNS A punti al server prima di richiedere il certificato.

### 13. Smoke test post-deploy

Apri il dominio e verifica:

1. **Login** con `admin@linkinfissi.demo` / `password-demo-123` (solo se hai eseguito seed).
2. **Dashboard** mostra i contatori dal seed (5 clienti, 18 prodotti, 3 preventivi).
3. **Crea cliente** nuovo (Privato/Azienda).
4. **Upload listino** CSV di test → `/pricelists/new` → vedi candidate rows in `/pricelists/[id]/review`.
5. **Validazione prodotto**: spunta una riga, importa nel catalogo.
6. **Creazione preventivo**: `/quotes/new`, aggiungi una zanzariera 120×240, verifica calcolo `2,88 mq × 45 €/mq = 129,60 €`.
7. **Generazione PDF**: clicca "PDF preventivo" → si apre PDF con intestazione Link Infissi.
8. **Contratto**: clicca "Contratto" → PDF con termini contrattuali.

## Variabili minime

```env
APP_URL=https://app.linkinfissi.it
NEXT_PUBLIC_APP_URL=https://app.linkinfissi.it
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://app.linkinfissi.it
NEXTAUTH_SECRET=...
AUTH_TRUST_HOST=true
STORAGE_PROVIDER=local
LOCAL_UPLOAD_DIR=/app/uploads
AI_PROVIDER=mock
ALLOW_PROD_SEED=false
NODE_ENV=production
PORT=3000
```

## Credenziali seed demo

- Email: `admin@linkinfissi.demo`
- Password: `password-demo-123`

Ruolo: ADMIN. C'è anche un utente `vendite@linkinfissi.demo` (ruolo SALES) per testare permessi.

## Limiti e troubleshooting

| Sintomo | Causa probabile | Soluzione |
|---|---|---|
| Login non funziona, "Untrusted Host" | Manca `AUTH_TRUST_HOST=true` | Aggiungere alla env e riavviare |
| PDF vuoto/errore 500 | Mancano impostazioni azienda | Vai su `/settings` e salva |
| Upload fallisce | Volume `/app/uploads` non montato | Riconfigurare Storage in Coolify |
| `npm audit` segnala advisories | next/next-auth/xlsx — vedi `SECURITY.md` | Branch upgrade dedicato |
| `prisma migrate deploy` chiede shadow DB | Permessi DB | Usa `DIRECT_URL` o `prisma db push` |

## Backup

- **PostgreSQL**: configurare backup automatico Coolify o dump giornaliero (`pg_dump`) verso S3-compatible.
- **Volume `/app/uploads`**: snapshot Hetzner volume o sync rsync verso bucket.
- Retention consigliata: 14-30 giorni. Test restore mensile.

Vedi `SECURITY.md` per dettagli.
