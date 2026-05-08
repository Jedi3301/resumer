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

## Directory Structure

```text
resumer/
├── apps/
│   ├── api/                  # Backend FastAPI application
│   │   ├── main.py           # API routing and server entry point
│   │   ├── celery_app.py     # Celery background task config
│   │   ├── tasks.py          # Defined celery workers
│   │   ├── services/         # Integrations (LLM, Redis, Scraper, Parser)
│   │   └── Dockerfile        # Container specs for API and workers
│   └── web/                  # Frontend Next.js 14 web application
│       ├── app/              # Next.js App Router (pages & layouts)
│       ├── components/       # Reusable React components (UI)
│       ├── public/           # Static assets
│       └── package.json      # Frontend dependencies
├── packages/
│   └── agents/               # AI LangGraph Agents & Orchestration
│       ├── job_scout_agent.py
│       └── resume_agent.py
├── supabase/                 # Database migrations and config
├── docker-compose.yml        # Multi-container orchestration (API, Redis, Celery)
└── .env                      # Environment variables
```

## How It Works

### Frontend (`apps/web`)
The user interface is built using **Next.js 14** (App Router) combined with **Tailwind CSS** and **Framer Motion** for a responsive, modern experience. 
- **User Upload**: Users provide a resume and describe their target job goals.
- **Real-time Progress**: The frontend communicates with the backend via **Server-Sent Events (SSE)**, receiving real-time updates as the backend agents analyze the resume and scrape job matches.
- **Results & Analysis**: Once processing is complete, the frontend queries the database to display the structured resume profile, job matches, and custom gap analysis to help the user land the job.

### Backend (`apps/api` & `packages/agents`)
The backend is a high-performance **FastAPI** service coordinating complex, long-running AI tasks through **Celery** and **Redis**.
- **API Endpoints**: FastAPI receives file uploads and provides status endpoints (REST + SSE stream).
- **Task Orchestration**: Long-running processes (like AI parsing and web scraping) are pushed to a Redis message broker. Celery workers pick up these tasks in the background to ensure the main API remains responsive.
- **AI Agents**: The core logic is powered by **LangGraph** agents (`packages/agents`):
  - *Resume Agent*: Parses the uploaded resume using an LLM (Groq or Gemini), extracting skills, experience, and structuring them into JSON format.
  - *Job Scout Agent*: Searches the web for jobs matching the extracted profile, scrapes job descriptions, and analyzes them.
- **Storage**: User profiles and match data are stored in Supabase (PostgreSQL), while local embeddings use ChromaDB.

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