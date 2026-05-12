import express from "express";

const startTime = Date.now();
// In a real app we might read this from package.json
const packageVersion = "1.0.0";

export function createApiRouter(store) {
  const router = express.Router();

  // Health check endpoint
  router.get("/health", (req, res) => {
    let totalPlayers = 0;
    for (const [, room] of store.entries()) {
      totalPlayers += room.players.length;
    }

    res.json({
      ok: true,
      uptime: Math.floor((Date.now() - startTime) / 1000),
      rooms: store.size,
      players: totalPlayers,
      version: packageVersion
    });
  });

  // Room exists check
  router.get("/rooms/:code/exists", (req, res) => {
    const code = req.params.code.toUpperCase();
    const exists = store.has(code);
    res.json({ exists });
  });

  // Public stats
  router.get("/stats", (req, res) => {
    let totalPlayers = 0;
    let totalRoundsPlayed = 0;
    for (const [, room] of store.entries()) {
      totalPlayers += room.players.length;
      totalRoundsPlayed += (room.round || 1) - 1;
    }

    res.json({
      totalRooms: store.size,
      totalPlayers,
      totalRoundsPlayed
    });
  });

  return router;
}
