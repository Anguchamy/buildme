# build.me — Social Media Content Planner & Scheduler

A production-ready SaaS platform for managing and scheduling social media content across 7 platforms.

## Features

- 📅 **Content Calendar** — Plan posts with FullCalendar (drag & drop rescheduling)
- ⊞ **Instagram Grid Planner** — Visual 3-column grid with DnD reorder
- ✏️ **Multi-Platform Composer** — Create posts for Instagram, TikTok, Facebook, Twitter, LinkedIn, YouTube, Pinterest
- ✨ **AI Caption Generator** — GPT-4o powered captions + hashtag suggestions
- 📊 **Analytics Dashboard** — Engagement metrics with Recharts
- 🖼️ **Media Library** — S3 uploads + Shutterstock search + Pinterest assets
- 🔗 **OAuth Integrations** — Connect all 7 platforms
- 🔐 **JWT Auth** — Secure with access/refresh token rotation

## Tech Stack

**Backend:** Spring Boot 3.4, Java 21, PostgreSQL, Redis, Flyway, Spring Security 6, JJWT 0.12
**Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Zustand, React Query v5, FullCalendar, Framer Motion
**Infra:** Docker, nginx, AWS S3 (media)

## Quick Start

### Prerequisites
- Java 21+
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 15 (or use Docker)

### Option 1: Docker Compose (recommended)

```bash
# Copy env file and configure
cp .env.example .env

# Start all services
docker-compose up -d

# App will be at http://localhost
# API docs at http://localhost/swagger-ui.html
```

### Option 2: Local Development

**Start infrastructure:**
```bash
docker-compose up postgres redis -d
```

**Backend:**
```bash
cd backend
mvn spring-boot:run
# API runs at http://localhost:8080
# Swagger UI: http://localhost:8080/swagger-ui.html
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
# App runs at http://localhost:3000
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_SECRET` | ≥256 bit secret for JWT signing | (required) |
| `DATABASE_URL` | PostgreSQL JDBC URL | `jdbc:postgresql://localhost:5432/buildme_db` |
| `DB_USERNAME` | DB username | `buildme` |
| `DB_PASSWORD` | DB password | `buildme_password` |
| `REDIS_HOST` | Redis hostname | `localhost` |
| `OPENAI_API_KEY` | OpenAI API key for AI captions | (optional) |
| `SHUTTERSTOCK_API_KEY` | Shutterstock API key | (optional) |
| `S3_BUCKET` | AWS S3 bucket name | `buildme-media` |
| `AWS_REGION` | AWS region | `us-east-1` |
| `INSTAGRAM_CLIENT_ID` | Instagram app client ID | (optional) |
| `FACEBOOK_APP_ID` | Facebook app ID | (optional) |
| `TWITTER_CLIENT_ID` | Twitter OAuth client ID | (optional) |
| `LINKEDIN_CLIENT_ID` | LinkedIn app client ID | (optional) |
| `TIKTOK_CLIENT_KEY` | TikTok app client key | (optional) |
| `YOUTUBE_CLIENT_ID` | Google/YouTube OAuth client ID | (optional) |
| `PINTEREST_APP_ID` | Pinterest app ID | (optional) |

## Database Schema

9 Flyway migrations creating tables:
`users`, `workspaces`, `workspace_members`, `social_accounts`, `posts`, `post_media`, `media_assets`, `scheduled_posts`, `analytics`, `hashtag_sets`, `subscriptions`

## API Documentation

Swagger UI available at `http://localhost:8080/swagger-ui.html` after starting the backend.

## Verification Checklist

```bash
# 1. Health check
curl http://localhost:8080/actuator/health

# 2. Register user
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","fullName":"Test User"}'

# 3. Check DB migrations
psql -U buildme buildme_db -c '\dt'

# 4. Frontend loads
open http://localhost:3000
```

## Project Structure

```
buildme/
├── backend/
│   ├── src/main/java/com/buildme/
│   │   ├── BuildMeApplication.java
│   │   ├── config/          # Security, Redis, CORS, Swagger
│   │   ├── controller/      # REST controllers
│   │   ├── dto/             # Request/Response records
│   │   ├── exception/       # Custom exceptions + handler
│   │   ├── model/           # JPA entities + enums
│   │   ├── repository/      # Spring Data JPA repos
│   │   ├── service/         # Business logic
│   │   └── util/            # JWT, DateUtil
│   └── src/main/resources/
│       ├── application.properties
│       └── db/migration/    # V1-V9 Flyway migrations
├── frontend/
│   └── src/
│       ├── api/             # Axios + API modules
│       ├── components/      # Reusable components
│       ├── hooks/           # React Query hooks
│       ├── pages/           # Route pages
│       ├── store/           # Zustand stores
│       ├── types/           # TypeScript types
│       └── utils/           # Helper functions
├── docker-compose.yml
└── README.md
```
