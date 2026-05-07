# Job Hunt Copilot

Phase 0 of an AI-powered job hunt copilot.

## Architecture

```text
               +-------------------+
               |  Next.js 14 Web   |
               |  (apps/web)       |
               +--------+----------+
                        | REST / SSE
               +--------v----------+
               |   FastAPI App     |  --> Supabase (PostgreSQL)
               |   (apps/api)      |
               +--------+----------+
                        | Celery Broker
               +--------v----------+
               |   Redis (Local)   |
               +--------+----------+
                        |
               +--------v----------+
               |  Celery Workers   |  --> ChromaDB (Local Embeddings)
               |  (Agents & Lang)  |  --> DuckDuckGo + Playwright
               +-------------------+
```

## Setup

1. **Environment Variables**:
   Copy `.env.example` to `.env` and fill in the values:
   - `GROQ_API_KEY`: Groq key (llama-3.1-70b-versatile)
   - `GEMINI_API_KEY`: Google Gemini key for fallback
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`: Supabase credentials
   - `UPSTASH_REDIS_URL`: (Optional) Upstash Redis, defaults to local docker Redis.
   - `UPSTASH_REDIS_TOKEN`: (Optional)

2. **Run Backend (API & Celery & Redis)**:
   ```bash
   docker-compose up --build
   ```

3. **Run Frontend (Next.js)**:
   ```bash
   cd apps/web
   npm install
   npm run dev
   ```

4. **Database Migration**:
   Run the SQL migration in `supabase/migrations/20240507_initial_schema.sql` inside your Supabase SQL editor.