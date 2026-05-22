import "dotenv/config";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { createApp } from "./src/app.js";
import { createGame } from "./src/game/Room.js";
import { registerEvents } from "./src/events/index.js";
import { createStore } from "./src/store/index.js";
import { PORT, CLIENT_ORIGIN } from "./src/config/index.js";
import { logger } from "./src/utils/logger.js";

async function main() {
  // Initialize store (loads persisted rooms from Redis if configured)
  const storeFactory = createStore();
  const store = await storeFactory.init();

  const app = createApp(store);
  const server = createServer(app);
  const allowedOrigins = CLIENT_ORIGIN.split(",").map((origin) => origin.trim());

  const io = new Server(server, {
    cors: {
      origin: allowedOrigins.includes("*") ? "*" : allowedOrigins
    }
  });

  const game = createGame(store);
  registerEvents(io, game);

  server.listen(PORT, () => {
    logger.info(`FakeIt server running on port ${PORT}`, {
      store: process.env.REDIS_URL ? "redis" : "memory",
      rooms: store.size,
      clientOrigin: CLIENT_ORIGIN
    });
  });
}

main().catch((err) => {
  logger.error("Failed to start server", { error: err.message, stack: err.stack });
  process.exit(1);
});
