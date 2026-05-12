import Redis from "ioredis";
import { serializeRoom, deserializeRoom } from "./serializer.js";
import { logger } from "../utils/logger.js";
import { ROOM_TTL_SECONDS } from "../config/index.js";

const ROOM_PREFIX = "fakeit:room:";

/**
 * Redis-backed store with a local Map cache.
 *
 * Reads are instant (from the in-memory cache).
 * Writes update the cache AND async-persist to Redis.
 * On construction, all rooms are loaded from Redis into the cache.
 */
export class RedisStore {
  constructor(redisUrl) {
    this._cache = new Map();
    this._redis = new Redis(redisUrl);

    this._redis.on("error", (err) => {
      logger.error("Redis connection error", { error: err.message });
    });
    this._redis.on("connect", () => {
      logger.info("Redis connected");
    });
  }

  /**
   * Load all persisted rooms from Redis into the local cache.
   * Call this once at startup before accepting connections.
   */
  async loadAll() {
    try {
      const keys = await this._redis.keys(`${ROOM_PREFIX}*`);
      if (keys.length === 0) {
        logger.info("Redis: no persisted rooms found");
        return;
      }

      const values = await this._redis.mget(...keys);
      let loaded = 0;
      for (let i = 0; i < keys.length; i++) {
        if (!values[i]) continue;
        try {
          const room = deserializeRoom(values[i]);
          const code = keys[i].replace(ROOM_PREFIX, "");
          // Timers cannot survive a restart — reset timed phases to a safe state
          room.timerId = null;
          this._cache.set(code, room);
          loaded++;
        } catch (parseErr) {
          logger.warn("Redis: failed to parse room", { key: keys[i], error: parseErr.message });
        }
      }
      logger.info(`Redis: restored ${loaded} room(s) from persistence`);
    } catch (err) {
      logger.error("Redis: failed to load rooms", { error: err.message });
    }
  }

  // ── Synchronous interface (identical to MemoryStore) ──

  get(code) {
    return this._cache.get(code);
  }

  set(code, room) {
    this._cache.set(code, room);
    // Fire-and-forget async persist
    this._persist(code, room);
  }

  delete(code) {
    this._cache.delete(code);
    this._redis.del(`${ROOM_PREFIX}${code}`).catch((err) => {
      logger.warn("Redis: delete failed", { code, error: err.message });
    });
  }

  has(code) {
    return this._cache.has(code);
  }

  entries() {
    return this._cache.entries();
  }

  get size() {
    return this._cache.size;
  }

  // ── Internal ──

  _persist(code, room) {
    try {
      const json = serializeRoom(room);
      this._redis
        .setex(`${ROOM_PREFIX}${code}`, ROOM_TTL_SECONDS, json)
        .catch((err) => {
          logger.warn("Redis: persist failed", { code, error: err.message });
        });
    } catch (err) {
      logger.warn("Redis: serialize failed", { code, error: err.message });
    }
  }

  async disconnect() {
    await this._redis.quit();
  }
}
