# FakeIt API Documentation

## REST API Endpoints

The backend provides several basic HTTP endpoints, primarily for health checks and room validation.

### `GET /api/health`
Returns the health status of the server.

**Response**
```json
{
  "ok": true,
  "uptime": 3600,
  "rooms": 12,
  "players": 48,
  "version": "1.0.0"
}
```

### `GET /api/rooms/:code/exists`
Checks if a room exists by its 4-letter code. Useful for validating join links before initializing a socket connection.

**Response**
```json
{
  "ok": true,
  "exists": true
}
```

### `GET /api/stats`
Returns global game statistics.

**Response**
```json
{
  "ok": true,
  "totalRooms": 150,
  "totalPlayers": 600,
  "totalRoundsPlayed": 450
}
```

---

## WebSocket Events (Socket.io)

Most of the game logic is handled over real-time WebSockets.

### Client-to-Server Events (Emitted by Client)

| Event Name | Payload | Description |
|------------|---------|-------------|
| `create-room` | `{ playerName: string }` | Creates a new game room and joins it as the host. |
| `join-room` | `{ roomCode: string, playerName: string }` | Joins an existing room. |
| `reconnect-session` | `{ sessionToken: string }` | Re-establishes a dropped connection using a saved session token. |
| `set-category` | `{ roomCode: string, category: string }` | Host only. Changes the active topic category. |
| `add-custom-topic`| `{ roomCode: string, topic: string }` | Host only. Adds a custom topic word to the room. |
| `update-settings` | `{ roomCode: string, settings: object }` | Host only. Updates timers and game modes. |
| `start-game` | `{ roomCode: string }` | Host only. Starts the game from the lobby. |
| `confirm-role` | `{ roomCode: string }` | Player confirms they have read their role. |
| `submit-clue` | `{ roomCode: string, clue: string }` | Submits a 1-word clue during the clue phase. |
| `submit-vote` | `{ roomCode: string, targetId: string }` | Casts a vote to eliminate a player. |
| `submit-topic-guess`| `{ roomCode: string, guess: string }` | Imposter only. Submits a guess for the secret topic. |
| `play-again` | `{ roomCode: string }` | Host only. Starts a new round. |
| `new-game` | `{ roomCode: string }` | Host only. Resets the room to the lobby. |

### Server-to-Client Events (Listened by Client)

| Event Name | Payload | Description |
|------------|---------|-------------|
| `session-created` | `{ sessionToken: string, playerId: string }` | Fired when successfully joining/creating a room. Save the token locally. |
| `room-state` | `RoomObject` | Contains the complete public state of the room. Fired constantly when state changes. |
| `player-joined` | `PlayerObject` | A new player joined the lobby. |
| `player-left` | `PlayerObject` | A player disconnected or was removed. |
| `role-assigned` | `{ role: string, topic: string \| null, category: string }` | Tells the client their role for the round. |
| `clue-submitted` | `{ playerId: string, playerName: string, clue: string }` | Someone just submitted a clue. |
| `clue-timeout` | `{ playerId: string, playerName: string, clue: "Pass" }` | Someone failed to answer in time. |
| `phase-change` | `{ phase: string, timer: number }` | Phase changed (e.g. Clue -> Discussion). |
| `reveal-results`| `ResultsObject` | End of round results (who was eliminated, etc.). |
| `error-message` | `string` | Human-readable error message (e.g. "Room is full"). |
