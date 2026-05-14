# Fullstack Template

A production-ready fullstack template with **MVP architecture**, **custom ORM**, **FastAPI**, **Supabase**, **React + Vite + TypeScript**, **Tailwind CSS**, **Docker**, **CI/CD**, and **multi-language (RTL/LTR)** support.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (React)                   │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │  Pages   │  │Components│  │  Contexts/Hooks    │  │
│  │ (Views)  │  │ (Present)│  │ (State/Preloader)  │  │
│  └────┬─────┘  └────┬─────┘  └────────┬──────────┘  │
│       └──────────────┼────────────────┘              │
│                      ▼                               │
│              ┌───────────────┐                       │
│              │   API Layer   │                       │
│              │ (Axios Client)│                       │
│              └───────┬───────┘                       │
└──────────────────────┼──────────────────────────────┘
                       │ HTTP (REST)
┌──────────────────────┼──────────────────────────────┐
│  Backend (FastAPI)   ▼                               │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │   API    │  │ Service  │  │  Custom ORM       │  │
│  │  Routes  │──│   Layer  │──│  (Supabase Rest)  │  │
│  │ (Routes) │  │  (Use)   │  │  (Gateway/Repo)   │  │
│  └──────────┘  └──────────┘  └────────┬──────────┘  │
│                                       │              │
└───────────────────────────────────────┼──────────────┘
                                        │
                                 ┌──────┴──────┐
                                 │  Supabase   │
                                 │ (PostgreSQL)│
                                 └─────────────┘
```

## Features

### Core
- **MVP Architecture** - Model-View-Presenter pattern for clean separation
- **Custom ORM** - Lightweight, extensible ORM for Supabase REST API
- **JWT Auth** - Access + Refresh token authentication
- **Preloading System** - Background data preloading for instant UX
- **Multi-language** - i18n with Arabic (RTL) and English (LTR) support

### Frontend
- **React 18** + **Vite** + **TypeScript**
- **Tailwind CSS** for styling
- **Axios** with interceptors (auto-refresh token)
- **React Router** for client-side routing
- **Protected Routes** with auth guards
- **RTL/LTR Layout Wrapper** - single wrapper mirrors all children

### Backend
- **FastAPI** with async support
- **Custom Supabase ORM** (CRUD, filtering, pagination)
- **JWT** token management
- **Pydantic** schemas for validation
- **Health check** endpoint

### DevOps
- **Docker Compose** - multi-container setup
- **Dockerfiles** - multi-stage production builds
- **Nginx** - reverse proxy with security headers, SSL, caching
- **GitHub Actions** - CI/CD pipeline (lint, test, build, deploy)
- **Makefile** - common commands
- **Vercel** + **Render** deployment configs

## 🤖 Using AI to Bootstrap a Project?
If you are using an AI agent to build a project from this template, immediately direct it to read **[skills/ai-init-project.md](./skills/ai-init-project.md)**. This guide explicitly tells the AI what code is structural (do not touch) and what is demonstrational (modify/remove), ensuring a perfect, error-free start to your new project.

## Quick Start

### 1. Clone and Setup

```bash
git clone <your-repo> my-project
cd my-project

# Copy environment files
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 2. Configure Environment

Edit `.env` with your Supabase credentials and secrets.

### 3. Run with Docker (Recommended)

```bash
make docker-build
make start
```

### 4. Run in Development

```bash
# Terminal 1 - Backend
cd backend
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173`

## Project Structure

```
fullstack-template/
├── .env.example              # Root environment variables
├── .gitignore
├── Makefile                  # Common commands
├── docker-compose.yml        # Multi-container setup
├── README.md
│
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI app entry
│   │   ├── api/v1/           # Route handlers
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   └── health.py
│   │   ├── core/
│   │   │   ├── config.py     # Settings
│   │   │   ├── security.py   # JWT, password hashing
│   │   │   └── dependencies.py
│   │   ├── orm/              # Custom ORM (⭐ core)
│   │   │   ├── supabase_orm.py
│   │   │   └── query.py
│   │   ├── models/           # Data models
│   │   ├── schemas/          # Pydantic schemas
│   │   ├── services/         # Business logic
│   │   └── utils/
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx          # React entry
│   │   ├── App.tsx           # Root with providers
│   │   ├── api/              # API client layer
│   │   ├── contexts/         # Auth, Preloader, Locale
│   │   ├── hooks/            # useAuth, usePreloader, useLocale
│   │   ├── components/
│   │   │   ├── Layout/       # LayoutWrapper, Header, Footer
│   │   │   ├── ui/           # Button, Input
│   │   │   └── auth/         # ProtectedRoute
│   │   ├── pages/            # Home, Login, Register, Dashboard
│   │   ├── i18n/             # en.json, ar.json
│   │   ├── types/            # TypeScript interfaces
│   │   └── utils/
│   ├── nginx/                # Nginx config for SPA
│   ├── Dockerfile
│   ├── vercel.json
│   └── package.json
│
├── deploy/
│   ├── nginx.conf            # Production reverse proxy
│   └── render.yaml           # Render deployment
│
└── .github/workflows/
    └── ci-cd.yml             # GitHub Actions pipeline
```

## Custom ORM

The ORM is designed to be lightweight and extensible. Add only the methods you need.

```python
# Usage
users = await supabase_orm.find_by(
    User,
    supabase_orm.query(User)
        .eq("is_active", True)
        .order("created_at", "desc")
        .limit(10)
)

# Create
user = await supabase_orm.create(User, {
    "email": "test@example.com",
    "hashed_password": hashed_pw,
})

# Available query methods
QueryBuilder
  ├── .eq() / .neq()           # Equality
  ├── .gt() / .gte() / .lt() / .lte()  # Comparison
  ├── .like() / .ilike()       # Pattern matching
  ├── .is_null() / .is_not_null()
  ├── .in_()                   # IN clause
  ├── .order()                 # Sorting
  ├── .limit() / .offset()     # Pagination
  └── .range()                 # Range queries
```

## Adding a New Module (Example: Posts)

### Backend

```python
# backend/app/models/post.py
from pydantic import BaseModel
from datetime import datetime

class Post(BaseModel):
    id: str
    title: str
    content: str
    user_id: str
    created_at: datetime | None = None

    @staticmethod
    def _table() -> str:
        return "posts"

# backend/app/api/v1/posts.py
from fastapi import APIRouter, Depends
from app.orm.supabase_orm import supabase_orm
from app.models.post import Post

router = APIRouter(prefix="/posts", tags=["posts"])

@router.get("/")
async def list_posts():
    return await supabase_orm.find_all(Post)
```

### Frontend

```typescript
// frontend/src/types/post.ts
export interface Post {
  id: string
  title: string
  content: string
  user_id: string
  created_at: string | null
}

// frontend/src/api/posts.ts
import api from './client'
import type { Post } from '@/types/post'

export const postsApi = {
  list: () => api.get<Post[]>('/posts'),
}

// In a component with preloading
const { data: posts, loading } = usePreload('posts', () => postsApi.list().then(r => r.data), true)
```

## Database Schema (Supabase)

```sql
-- Users table (required)
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    is_superuser BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

## Deployment

### Vercel (Frontend)
```bash
cd frontend
npx vercel --prod
```

### Docker (Full Stack)
```bash
make docker-build
make start
```

### Render
Push to GitHub and connect your Render dashboard. Use `deploy/render.yaml` for Blueprint deployment.

### AWS / Oracle / Any VPS
```bash
# Build and push images
make docker-build
make docker-push

# On server
docker-compose pull
docker-compose up -d
```

## CI/CD Pipeline

The GitHub Actions pipeline runs:
1. **Lint** - ruff (Python) + eslint (TypeScript)
2. **Test** - pytest + vitest
3. **Build** - Docker images → GitHub Container Registry
4. **Deploy** - SSH to production server + Vercel

## License

MIT
