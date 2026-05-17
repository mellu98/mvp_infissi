# Coolify

## Setup consigliato

1. Crea un progetto Coolify.
2. Crea un database PostgreSQL 16.
3. Copia la `DATABASE_URL` generata.
4. Crea una nuova risorsa applicazione dal repository Git.
5. Usa `Dockerfile` come build pack Docker.
6. Imposta dominio e `NEXTAUTH_URL`.
7. Genera `NEXTAUTH_SECRET`.
8. Imposta `AUTH_TRUST_HOST=true`.
9. Imposta `STORAGE_PROVIDER=local`.
10. Monta volume persistente su `/app/uploads`.
11. Imposta `AI_PROVIDER=mock`.
12. Esegui `npm run db:deploy` come comando una tantum.
13. Verifica `/api/health`.

## Variabili minime

```env
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://tuo-dominio.it
NEXTAUTH_SECRET=...
AUTH_TRUST_HOST=true
STORAGE_PROVIDER=local
LOCAL_UPLOAD_DIR=/app/uploads
AI_PROVIDER=mock
ALLOW_PROD_SEED=false
```

## Seed demo

Solo per ambienti demo:

```bash
ALLOW_PROD_SEED=true npm run db:seed
```

Credenziali seed:

- `admin@linkinfissi.demo`
- `password-demo-123`
