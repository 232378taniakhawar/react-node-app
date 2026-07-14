# Three-Tier Guestbook App (React + Node + PostgreSQL)

A true three-tier application: each tier is its own container, and they only talk to each other over the network — never by sharing files or code directly.

| Tier | Technology | Container | Port on your machine |
|---|---|---|---|
| 1. Frontend | React (built with Vite, served by nginx) | `guestbook-frontend` | `8082` |
| 2. Backend  | Node.js + Express (REST API) | `guestbook-backend` | `5001` |
| 3. Database | PostgreSQL | `guestbook-db` | `5432` |

## Folder Structure
```
react-node-app/
├── docker-compose.yaml
├── frontend/
│   ├── Dockerfile           # multi-stage: build React, then serve with nginx
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx          # calls the backend API
│       └── App.css
└── backend/
    ├── Dockerfile
    ├── package.json
    └── server.js            # Express REST API, connects to PostgreSQL
```

## How to Run

### 1. Build and start all three containers
```bash
cd react-node-app
docker compose up -d --build
```
This will:
1. Build the React app and package it into an nginx image (frontend)
2. Build the Node/Express API image (backend)
3. Pull the official PostgreSQL image (database)
4. Start all three, connected on an internal Docker network

The first build takes a bit longer than usual since it has to install npm packages and compile the React app.

### 2. Open the app
Go to **http://localhost:8082** in your browser.

### 3. Check all three containers are running
```bash
docker compose ps
```
You should see `guestbook-frontend`, `guestbook-backend`, and `guestbook-db`, all "Up".

### 4. Watch logs if something isn't working
```bash
docker compose logs -f backend
```
(swap `backend` for `frontend` or `db` to check a different tier)

### 5. Stop everything
```bash
docker compose down
```
Add `-v` to also wipe the database volume for a clean restart:
```bash
docker compose down -v
```

## How the Three Tiers Talk to Each Other

```
Your Browser  →  Frontend (React, port 8082)
                     │  fetch() calls made FROM your browser
                     ▼
              Backend (Express API, port 5001)
                     │  SQL queries, using service name "db"
                     ▼
              Database (PostgreSQL, port 5432)
```

- **Frontend → Backend**: your browser calls `http://localhost:5001/api/...` directly — this is a real network request leaving your browser, not something happening inside Docker.
- **Backend → Database**: the backend connects using the hostname `db` (the service name in `docker-compose.yaml`), which only resolves inside Docker's internal network — your browser never talks to the database directly.

This is the key difference from the earlier two-tier version: the frontend is now a **separate container with no server-side logic of its own** — it's just static files that make API calls, exactly like a real production frontend/backend split.

## API Endpoints (Backend Tier)
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/messages` | Fetch all guestbook messages |
| POST | `/api/messages` | Add a new message (`{ "name": "...", "message": "..." }`) |
| GET | `/api/health` | Health check |

You can test the backend directly, independent of the frontend:
```bash
curl http://localhost:5001/api/messages
```

## Notes
- Passwords in `docker-compose.yaml` are plain text for local learning/testing only — use a `.env` file or Docker secrets for anything real.
- If port `5432` is already used by a PostgreSQL install on your machine, change the host-side port mapping in `docker-compose.yaml` (e.g., `"5433:5432"`).
