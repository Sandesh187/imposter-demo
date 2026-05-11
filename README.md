# FakeIt

FakeIt is a mobile-first real-time party game inspired by imposter word games. One player secretly becomes the imposter, everyone else receives a topic, and the group tries to spot the fake through one-word clues, discussion, and voting.

## Features

- Real-time rooms with 4-letter room codes
- Host-controlled lobby, category selection, and replay
- Private role assignment per device
- Server-owned timers, clues, votes, scoring, and phase changes
- Mobile-first React UI with animated reveals, toasts, avatars, and confetti
- In-memory Node.js + Express + Socket.io backend
- Deploy-ready Dockerfile

## Setup

```bash
npm install
npm run dev
```

The client runs at `http://localhost:5173` and proxies API/socket traffic to the server at `http://localhost:3001`.

## Production

```bash
npm install
npm run build
npm start
```

The server serves the built React app from `client/dist` and listens on `PORT` or `3001`.

## Docker

```bash
docker build -t fakeit .
docker run -p 3001:3001 fakeit
```

Open `http://localhost:3001`.

## Project Structure

```text
/client
  /src
    /components
    /hooks
    App.jsx
/server
  index.js
  gameLogic.js
  topics.js
package.json
Dockerfile
```

## Socket Events

The server implements the required game events:

- `create-room`, `join-room`, `player-joined`
- `start-game`, `role-assigned`
- `submit-clue`, `clue-received`
- `phase-change`
- `submit-vote`, `vote-received`
- `reveal-results`
- `play-again`, `player-disconnected`

Additional helper events are used for reliability and UX: `room-state`, `confirm-role`, `set-category`, `submit-topic-guess`, `leave-room`, `error-message`, and `toast`.
