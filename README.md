# ThatFridge

## Stack
- `backend/` — Laravel API
- `frontend/` — Next.js app
- Postgres + Redis via Docker Compose

## Setup

1. Clone repo, start infra:
   ```bash
   docker-compose up -d
   ```

2. Backend:
   ```bash
   cd backend
   cp .env.example .env
   composer install
   php artisan key:generate
   ```
   Edit `.env`, replace existing `DB_CONNECTION` line and set DB to match `docker-compose.yml`:
   ```
   DB_CONNECTION=pgsql
   DB_HOST=127.0.0.1
   DB_PORT=5433
   DB_DATABASE=thatfridge
   DB_USERNAME=devuser
   DB_PASSWORD=devpassword
   ```
   Note: container maps to host port `5433` (not default `5432`) to avoid clashing with a locally installed Postgres.

   Then:
   ```bash
   php artisan migrate
   php artisan serve
   ```

3. Frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Requirements
- PHP 8.2+, Composer
- Node 18+
- Docker
