# FakeIt

FakeIt is a mobile-first real-time party game inspired by imposter word games. One player secretly becomes the imposter, everyone else receives a topic, and the group tries to spot the fake through one-word clues, discussion, and voting.

## Features

- **Real-time Gameplay:** Low-latency rooms powered by Socket.io.
- **Robust State Management:** Redis-backed persistence and robust reconnection support (30-second grace periods).
- **Anti-Cheat:** Advanced logic to prevent duplicate clues and profanity filtering while allowing party-friendly self-votes.
- **Dynamic Content:** Over 200 topics across 10 categories, plus support for Custom Topics.
- **Scoring & Leaderboards:** Advanced scoring logic with a dynamic post-round leaderboard.
- **Security & Stability:** Helmet headers, Winston logging, and strict input validation.
- **Modern UI:** React client using TailwindCSS, Lucide icons, and beautiful glassmorphic elements.

## Architecture

FakeIt is structured as a monorepo:

```text
/
├── client/         # React + Vite frontend
│   ├── src/
│   │   ├── components/ # UI components (Lobby, Phases, FinalGameOver, ui)
│   │   ├── hooks/      # useGame hook for unified state management
│   │   └── App.jsx     # Main game router
│
├── server/         # Express + Socket.io backend
│   ├── src/
│   │   ├── config/     # Environment configurations
│   │   ├── events/     # Socket.io event handlers
│   │   ├── game/       # Core game logic (Room, phases, scoring)
│   │   ├── store/      # Persistence layer (Redis / Memory fallback)
│   │   └── utils/      # Validation, rate limiting, and structured logging
│   └── index.js    # Entry point
│
├── API.md          # Full REST and Socket API Documentation
├── CONTRIBUTING.md # Contribution guide
├── Dockerfile      # Multi-stage production build
└── docker-compose.yml # Local development orchestration
```

## Setup & Development

**Requirements:**
- Node.js 20+
- (Optional) Docker for running Redis locally

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Start Local Servers:**
   This will start both the React frontend and the Node backend using local Memory store.
   ```bash
   npm run dev
   ```

3. **Start with Redis (Recommended for testing persistence):**
   ```bash
   docker-compose up
   ```

## Production Deployment

The project is fully dockerized and ready for production.

```bash
docker build -t fakeit .
docker run -p 3001:3001 -e NODE_ENV=production fakeit
```

The Docker container serves both the Node API and the static React bundle over a single port.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3001 | Port for the Express server |
| `NODE_ENV` | development | `production` enables JSON logging and static serving |
| `REDIS_URL` | | Connection string for Redis. If missing, defaults to Memory Store |
| `LOG_LEVEL` | info | Sets Winston logging level (`debug`, `info`, `warn`, `error`) |
| `CLIENT_ORIGIN` | * | Comma-separated list of allowed CORS origins |
| `VITE_SOCKET_URL` | | Frontend Socket.io server URL. Set this in Vercel when the API is hosted separately on Render |

### Vercel + Render Checklist

- In Vercel, set `VITE_SOCKET_URL` to your Render backend URL, for example `https://your-render-service.onrender.com`.
- In Render, set `CLIENT_ORIGIN` to your Vercel frontend URL. Use a comma-separated list if you have preview/custom domains.
- If you intentionally allow any frontend origin during testing, set `CLIENT_ORIGIN=*`.
- Redeploy the Vercel frontend after changing `VITE_SOCKET_URL`; Vite reads it at build time.
- Keep `REDIS_URL` configured on Render if you want reconnects and rooms to survive server restarts.

## Documentation

- **[API Documentation](./API.md):** Comprehensive details on REST endpoints and WebSocket events.
- **[Contributing](./CONTRIBUTING.md):** Guidelines for adding features and running tests.
