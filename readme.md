<div align="center">

# 🎯 Job Hunt Copilot

**An AI-powered resume intelligence platform that parses your resume, scores it, extracts your skills, and surfaces matched job opportunities — all in one pipeline.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Frontend-6366f1?style=for-the-badge&logo=render)](https://resumer-fronend.onrender.com)
[![API](https://img.shields.io/badge/API-Backend-10b981?style=for-the-badge&logo=fastapi)](https://resumer-api.onrender.com/docs)
[![Phase](https://img.shields.io/badge/Phase-0%20%E2%80%94%20Core%20Pipeline-f59e0b?style=for-the-badge)]()
[![License](https://img.shields.io/badge/License-MIT-gray?style=for-the-badge)]()

</div>

---

## 🌐 Live Deployment

| Service | URL | Status |
|---|---|---|
| **Frontend** | https://resumer-fronend.onrender.com | ✅ Live |
| **Backend API** | Render Web Service | ✅ Live |
| **API Docs** | `/docs` on the backend URL | ✅ Live |

---

## ✨ What It Does

1. **Upload your resume** — PDF or DOCX, up to 10MB
2. **Tell it your goals** — target role, seniority, work preference, timeline
3. **Watch it process in real-time** — SSE-powered live progress updates
4. **Get your results dashboard:**
   - Resume health score across 5 dimensions
   - Extracted skills (confirmed, inferred, missing)
   - Top 3 career strengths + AI-generated elevator pitch
   - Suggested target roles with fit scores and salary estimates
   - Matched job listings with skill gap analysis & battle plans

---

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│         Next.js 14 Frontend         │
│         (Render Static Site)        │
└──────────────┬──────────────────────┘
               │  REST + Server-Sent Events (SSE)
┌──────────────▼──────────────────────┐
│          FastAPI Backend            │  ──► Supabase (PostgreSQL)
│          (Render Web Service)       │
└──────────────┬──────────────────────┘
               │  Celery Task Queue
┌──────────────▼──────────────────────┐
│         Upstash Redis (Broker)      │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│         Celery Workers              │
│  ┌──────────────┐  ┌─────────────┐  │
│  │ Resume Agent │  │ Job Scout   │  │  ──► DuckDuckGo + Playwright
│  │  (LangGraph) │  │  (LangGraph)│  │  ──► ChromaDB (Embeddings)
│  └──────────────┘  └─────────────┘  │  ──► Groq / Gemini (LLMs)
└─────────────────────────────────────┘
```

---

## 📁 Project Structure

```
resumer/                              # Monorepo root
├── apps/
│   ├── api/                          # FastAPI backend
│   │   ├── main.py                   # API routes & server entry point
│   │   ├── celery_app.py             # Celery + Redis broker config
│   │   ├── tasks.py                  # Background task pipeline
│   │   ├── agents/                   # LangGraph AI agents
│   │   │   ├── resume_agent.py       # Resume parsing & skill extraction
│   │   │   └── job_scout_agent.py    # Job search & gap analysis
│   │   ├── services/                 # Core services
│   │   │   ├── parser.py             # PDF/DOCX resume parser
│   │   │   ├── health_score.py       # ATS scoring engine
│   │   │   ├── llm.py                # LLM client (Groq + Gemini fallback)
│   │   │   ├── embeddings.py         # ChromaDB embedding service
│   │   │   └── redis_url.py          # Redis connection helper
│   │   ├── Dockerfile                # Production container
│   │   ├── .dockerignore             # Docker build exclusions
│   │   └── requirements.txt          # Python dependencies
│   └── web/                          # Next.js 14 frontend
│       ├── app/
│       │   ├── page.tsx              # Upload + goal profiling page
│       │   ├── processing/page.tsx   # Real-time progress tracker
│       │   └── results/[userId]/     # Results dashboard
│       ├── components/               # Reusable UI components
│       ├── public/                   # Static assets
│       └── package.json
├── supabase/
│   └── migrations/                   # SQL schema migrations
├── docker-compose.yml                # Local development stack
├── .gitignore
└── README.md
```

---

## 🛠️ Tech Stack

### Backend
| Layer | Technology |
|---|---|
| API Framework | FastAPI |
| Task Queue | Celery 5 |
| Message Broker | Upstash Redis |
| AI Orchestration | LangGraph + LangChain |
| LLMs | Groq (llama-3.1-70b) · Gemini (fallback) |
| Resume Parsing | PyMuPDF · pdfplumber · python-docx |
| Embeddings | sentence-transformers + ChromaDB |
| Web Scraping | Playwright + BeautifulSoup |
| Database | Supabase (PostgreSQL) |
| Containerization | Docker |

### Frontend
| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Charts | Recharts |
| State | Zustand |
| HTTP / Streaming | Fetch API + SSE |

---

## 🚀 Local Development

### Prerequisites
- Python 3.11+
- Node.js 18+
- Docker Desktop
- An Upstash Redis instance (free tier works)

### 1. Clone & configure environment

```bash
git clone https://github.com/Jedi3301/resumer
cd resumer
cp .env.example .env  # then fill in your values
```

Required environment variables:

```env
GROQ_API_KEY=           # Groq API key (llama-3.1-70b-versatile)
GEMINI_API_KEY=          # Google Gemini API key (fallback LLM)
SUPABASE_URL=            # Supabase project URL
SUPABASE_ANON_KEY=       # Supabase anon key
SUPABASE_SERVICE_KEY=    # Supabase service role key
UPSTASH_REDIS_URL=       # Upstash Redis URL (rediss://...)
UPSTASH_REDIS_TOKEN=     # Upstash Redis REST token
CHROMA_PERSIST_PATH=./chroma_db
```

### 2. Run the backend stack

```bash
docker-compose up --build
```

This starts:
- **FastAPI** on `http://localhost:8000`
- **Celery Worker** (background task processor)
- **Redis** (local broker, override with Upstash for prod parity)

### 3. Run the frontend

```bash
cd apps/web
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`.

### 4. Run database migrations

Open your Supabase project → SQL Editor → paste and run:

```
supabase/migrations/20240507_initial_schema.sql
```

---

## ☁️ Deployment (Render)

### Backend — Web Service

| Setting | Value |
|---|---|
| **Root Directory** | `apps/api` |
| **Runtime** | Docker |
| **Dockerfile Path** | `apps/api/Dockerfile` |
| **Health Check Path** | `/health` |

**Environment variables to set in Render:**
```
GROQ_API_KEY, GEMINI_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY,
SUPABASE_SERVICE_KEY, UPSTASH_REDIS_URL, UPSTASH_REDIS_TOKEN,
CHROMA_PERSIST_PATH=/app/chroma_db
```

### Frontend — Static Site

| Setting | Value |
|---|---|
| **Root Directory** | `apps/web` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `out` |

**Environment variables to set in Render:**
```
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check (used by Render) |
| `GET` | `/api/health` | Extended health status |
| `POST` | `/api/resume/upload` | Upload resume + trigger pipeline |
| `GET` | `/api/resume/{task_id}` | Poll task status |
| `GET` | `/api/resume/stream/{task_id}` | SSE stream of live progress |
| `GET` | `/api/jobs/{user_id}` | Fetch matched jobs from Redis |
| `POST` | `/api/jobs/gap/{job_id}` | Get gap analysis for a job |

Full interactive docs available at `/docs` on the backend URL.

---

## 🗺️ Roadmap

### Phase 0 — Core Pipeline ✅ *(current)*
- [x] Resume upload (PDF / DOCX / plain text)
- [x] Real-time processing with SSE
- [x] ATS health scoring (5 dimensions)
- [x] Skill extraction via LangGraph agent
- [x] Role recommendations with fit scores
- [x] Results dashboard with skill universe
- [x] Dockerized backend
- [x] Deployed to Render (frontend + backend)

### Phase 1 — Job Intelligence 🔜
- [ ] Live job scraping via Playwright
- [ ] Skill gap analysis per job listing
- [ ] AI-generated battle plan (week-by-week study plan)
- [ ] Resume → JD keyword match scoring

### Phase 2 — Personalization 🔮
- [ ] User authentication (Supabase Auth)
- [ ] Resume version history
- [ ] Saved job lists and tracking
- [ ] Email digest of new matches

---

## 🤝 Contributing

This is an early-stage project. Feel free to open issues or PRs. For significant changes, please open an issue first to discuss scope.

---

<div align="center">

Built with ⚡ by [Jedi3301](https://github.com/Jedi3301)

</div>