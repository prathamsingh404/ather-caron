# Aether Carbon - AI Carbon Footprint Tracker

Production-style Next.js app for carbon activity logging, analytics, AI insights, receipt OCR intake, and report generation.

## Tech Stack

- `Next.js 14` (App Router)
- `TypeScript`
- `Tailwind CSS`
- `Prisma` + `PostgreSQL`
- `Groq SDK` for AI insight/report/chat generation

## Project Structure

```text
src/
  app/
    page.tsx                       # Landing page
    dashboard/                     # Dashboard and feature pages
    api/                           # Backend API routes
  components/                      # Reusable UI components
  lib/                             # Business logic, AI helpers, auth, db utils
prisma/
  schema.prisma                    # Database schema
docker-compose.yml                 # Local DB + web container setup
```

## Prerequisites

- Node.js 20+
- Docker Desktop (recommended for local PostgreSQL)

## Environment Setup

Create `.env.local` from `.env.example` and fill values:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/carbon_tracker"
GROQ_API_KEY="your_real_key_here"
AUTH_SECRET="a_long_random_secret"
```

## Database Setup

### Option A: Local PostgreSQL via Docker

```bash
docker compose up -d db
npm run db:setup
```

### Option B: Existing Postgres/Supabase

Point `DATABASE_URL` to your database, then:

```bash
npm run db:setup
```

## Run the App

### Reliable mode (recommended)

```bash
npm run dev:prod
```

This runs `next build` then `next start` for stable asset serving.

### Development mode

```bash
npm run dev
```

Open `http://localhost:3000`.

## Useful Commands

```bash
npm run lint
npm run db:generate
npm run db:push
npm run db:studio
```

## API Endpoints

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/me`
- `GET /api/calculate-emissions`
- `GET /api/dashboard/summary`
- `POST /api/ai-chat`
- `POST /api/generate-report`
- `POST /api/ocr-scan`
- `GET|POST /api/insights`
- `GET|POST /api/activities`

## Notes

- Cookie-based routes are explicitly configured as dynamic to avoid static-render conflicts.
- Keep secrets only in local `.env` files and rotate any key that was shared in chat/screenshots.
