import {
  MAX_NAME_LENGTH,
  MAX_CLUE_LENGTH,
  ROOM_CODE_LENGTH
} from "../config/index.js";
import { GameError } from "./errors.js";
import { Filter } from "bad-words";

const filter = new Filter();

export function cleanName(name) {
  const trimmed = String(name || "").trim();
  let cleaned = trimmed.slice(0, MAX_NAME_LENGTH) || "Player";
  // Basic XSS prevention: remove HTML tags
  cleaned = cleaned.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return filter.isProfane(cleaned) ? filter.clean(cleaned) : cleaned;
}

export function normalizeCode(code) {
  return String(code || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, ROOM_CODE_LENGTH);
}

export function validateCode(code) {
  const normalized = normalizeCode(code);
  if (normalized.length !== ROOM_CODE_LENGTH) {
    throw new GameError(
      `Room code must be exactly ${ROOM_CODE_LENGTH} letters.`,
      "INVALID_ROOM_CODE"
    );
  }
  return normalized;
}

export function sanitizeClue(clue) {
  let cleaned = String(clue || "")
    .trim()
    .split(/\s+/)[0]
    ?.replace(/[^\p{L}\p{N}-]/gu, "")
    .slice(0, MAX_CLUE_LENGTH);
    
  if (!cleaned) {
    throw new GameError("Clue must be one valid word containing only letters, numbers, or hyphens.", "INVALID_CLUE");
  }
  
  if (filter.isProfane(cleaned)) {
    throw new GameError("Please choose an appropriate word.", "PROFANITY_DETECTED");
  }
  
  return cleaned;
}
