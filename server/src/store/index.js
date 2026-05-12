import { MemoryStore } from "./MemoryStore.js";
import { logger } from "../utils/logger.js";

/**
 * Create the appropriate store based on environment config.
 * Returns { store, init() } where init() must be awaited before accepting connections.
 */
export function createStore() {
  const redisUrl = process.env.REDIS_URL;

  if (redisUrl) {
    // Dynamic import so ioredis isn't loaded when not needed
    return {
      async init() {
        const { RedisStore } = await import("./RedisStore.js");
        const store = new RedisStore(redisUrl);
        await store.loadAll();
        return store;
      }
    };
  }

  logger.info("Using in-memory store (no REDIS_URL set)");
  return {
    async init() {
      return new MemoryStore();
    }
  };
}
