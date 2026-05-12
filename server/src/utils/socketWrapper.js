import { logger } from "./logger.js";
import { GameError } from "./errors.js";

export function wrapHandler(socket, handler) {
  return async (...args) => {
    try {
      // Day 9: Rate limiting (max 10 events per second)
      if (!socket.data.rateLimit) {
        socket.data.rateLimit = { count: 0, resetTime: Date.now() + 1000 };
      }
      
      if (Date.now() > socket.data.rateLimit.resetTime) {
        socket.data.rateLimit.count = 0;
        socket.data.rateLimit.resetTime = Date.now() + 1000;
      }
      
      socket.data.rateLimit.count++;
      if (socket.data.rateLimit.count > 10) {
        throw new GameError("You are doing that too fast. Please slow down.", "RATE_LIMITED");
      }

      await handler(...args);
    } catch (error) {
      const isGameError = error instanceof GameError;
      const errorCode = isGameError ? error.code : "INTERNAL_ERROR";
      const errorMsg = error.message;

      if (isGameError) {
        logger.warn("Game error", { error: errorMsg, code: errorCode, socketId: socket.id });
      } else {
        logger.error("Unhandled socket error", { error: errorMsg, stack: error.stack, socketId: socket.id });
      }

      // Always emit error-message so the client toast system picks it up
      socket.emit("error-message", errorMsg);

      // Also call the ack callback if one was provided (it's always the last arg)
      const ack = args.find((a) => typeof a === "function");
      if (ack) {
        ack({ ok: false, error: errorMsg, code: errorCode });
      }
    }
  };
}

