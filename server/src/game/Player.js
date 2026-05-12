import { AVATAR_COLORS } from "../config/index.js";
import { cleanName } from "../utils/validation.js";
import crypto from "node:crypto";

export function decoratePlayer(socketId, name, isHost = false) {
  return {
    id: crypto.randomUUID(),
    socketId: socketId,
    name: cleanName(name),
    score: 0,
    connected: true,
    disconnectTimerId: null,
    isHost,
    eliminated: false,
    eliminatedRound: null,
    avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]
  };
}

export function publicPlayer(player) {
  return {
    id: player.id,
    name: player.name,
    score: player.score,
    connected: player.connected,
    isHost: player.isHost,
    eliminated: Boolean(player.eliminated),
    eliminatedRound: player.eliminatedRound || null,
    avatarColor: player.avatarColor
  };
}
