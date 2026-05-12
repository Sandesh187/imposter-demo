import winston from "winston";

const isProd = process.env.NODE_ENV === "production";

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    isProd ? winston.format.json() : winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
      const ts = timestamp.slice(0, 19).replace("T", " ");
      const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : "";
      return `[${ts}] ${level.toUpperCase()}: ${message} ${metaStr} ${stack || ""}`;
    })
  ),
  transports: [new winston.transports.Console()]
});
