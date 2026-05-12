import { logger } from "../utils/logger.js";
import { GameError } from "../utils/errors.js";

export function errorHandler(err, req, res, next) {
  if (err instanceof GameError) {
    logger.warn("Game error in HTTP request", { error: err.message, code: err.code, path: req.path });
    return res.status(err.statusCode).json({ ok: false, error: err.message, code: err.code });
  }

  logger.error("Unhandled HTTP error", { error: err.message, stack: err.stack, path: req.path });
  res.status(500).json({ ok: false, error: "Internal Server Error" });
}
