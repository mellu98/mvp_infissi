# Environment

## Variabili obbligatorie

- `DATABASE_URL` — connessione PostgreSQL.
- `NEXTAUTH_SECRET` — segreto random, almeno 32 byte.
- `NEXTAUTH_URL` — URL pubblico dell'app.
- `AUTH_TRUST_HOST=true` — necessario dietro proxy/Coolify.
- `STORAGE_PROVIDER=local`
- `LOCAL_UPLOAD_DIR=/app/uploads` in Docker, `./uploads` in locale.
- `AI_PROVIDER=mock` per MVP.

## Seed

`npm run db:seed` resetta solo il tenant demo con id `demo-link-infissi`.

In produzione il seed è bloccato se:

```env
NODE_ENV=production
ALLOW_PROD_SEED=false
```

Per forzare il seed in produzione, impostare `ALLOW_PROD_SEED=true` consapevolmente.

## Sicurezza secret

Generare `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

Non committare `.env`, `.env.local` o secret reali.
