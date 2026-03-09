# Deploy backend

## Deploy with Supabase (recommended)

Supabase hosts your **database** (Postgres), not the Nest app. Deploy the API on **Render** or **Railway**, and point it at your Supabase project.

1. **Get your Supabase database URL**
   - [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Settings** → **Database**.
   - Under **Connection string** choose **URI** and copy it (use the **Connection pooling** URI if you see it; port `5432` or `6543`).
   - Replace the password placeholder with your DB password.

2. **Deploy the API** (choose one)
   - **Render**: [Option A](#option-a-render) below — use Docker or the native build/start commands. Set `DATABASE_URL` to the Supabase URI from step 1.
   - **Railway**: [Option B](#option-b-railway) below — same idea; add `DATABASE_URL` (Supabase), `GEMINI_API_KEY`, `JWT_SECRET`.

3. **Run migrations** (once, after first deploy)
   - With `DATABASE_URL` in your `.env` (Supabase URI) run:
   ```bash
   npx prisma migrate deploy --schema=src/prisma/schema.prisma
   ```
   - Or run this in a Render/Railway shell with their env vars.

Your API will live at e.g. `https://your-app.onrender.com/api/...` and will use Supabase Postgres as the database.

---

## Environment variables (set on your host)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Postgres connection string (e.g. Supabase) |
| `PORT` | No | Server port (default 3080). Render/Railway set this automatically. |
| `GEMINI_API_KEY` | Yes | For chat feature |
| `JWT_SECRET` | Yes | Secret used to sign JWT tokens |

---

## Option A: Render

1. [Render](https://render.com) → New → **Web Service**.
2. Connect your repo.
3. **Build**
   - **Environment**: Docker (use the repo `dockerfile`).
   - Or Native:
     - **Build Command**: `npm ci && npx prisma generate --schema=src/prisma/schema.prisma && npm run build`
     - **Start Command**: `node dist/main.js`
     - **Root Directory**: (leave empty)
4. **Environment**: Add `DATABASE_URL`, `GEMINI_API_KEY`, `JWT_SECRET`. Do not set `PORT` (Render sets it).
5. (Optional) Run migrations once after first deploy:  
   **Shell** in dashboard or locally:  
   `npx prisma migrate deploy --schema=src/prisma/schema.prisma`

---

## Option B: Railway

1. [Railway](https://railway.app) → New Project → **Deploy from GitHub** (this repo).
2. **Settings** → **Build**:
   - **Builder**: Dockerfile (use repo `dockerfile`).
   - Or **Nixpacks** with:
     - **Build Command**: `npm ci && npx prisma generate --schema=src/prisma/schema.prisma && npm run build`
     - **Start Command**: `node dist/main.js`
3. **Variables**: Add `DATABASE_URL`, `GEMINI_API_KEY`, `JWT_SECRET`. `PORT` is set by Railway.
4. Run migrations once (Railway CLI or **Settings** → run command):  
   `npx prisma migrate deploy --schema=src/prisma/schema.prisma`

---

## Run migrations after deploy

From your machine (with `DATABASE_URL` pointing at the deployed DB):

```bash
npx prisma migrate deploy --schema=src/prisma/schema.prisma
```

Or run the same command in the host’s shell/one-off job if available.

---

## API base URL

- Global prefix: **`/api`**
- Versioning: URI (e.g. `/api/v1/...` if `DEFAULT_VERSION` is set).
- Example: `https://your-service.onrender.com/api/...`
