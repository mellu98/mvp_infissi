# Deployment

## Locale con Docker

```bash
docker compose up -d postgres
npm install --legacy-peer-deps
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

## Container app

Il `Dockerfile` usa:

1. `npm ci --legacy-peer-deps`
2. `npx prisma generate`
3. `npm run build`
4. runtime Next standalone su `node:20-alpine`

Nota: questo repository vieta di eseguire build manualmente durante le modifiche agente. Il Dockerfile definisce la build, ma non è stata eseguita in questa sessione.

## Migrazioni produzione

Prima del primo avvio:

```bash
npm run db:deploy
```

Per caricare dati demo:

```bash
ALLOW_PROD_SEED=true npm run db:seed
```

Usarlo solo su ambienti demo/staging.

## Healthcheck

Endpoint:

```text
/api/health
```

Verifica app + ping Prisma sul database.
