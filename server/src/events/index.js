import { registerRoomEvents } from "./roomEvents.js";
import { registerGameEvents } from "./gameEvents.js";
import { logger } from "../utils/logger.js";

export function registerEvents(io, game) {
  // Shared helpers used by game events
  function sendRoomState(room) {
    if (!room) return;
    io.to(room.code).emit("room-state", game.safeRoom(room));
  }

  function sendPhase(room) {
    io.to(room.code).emit("phase-change", {
      phase: room.phase,
      timer: room.timer
    });
    sendRoomState(room);
  }

  function sendRoles(room) {
    for (const player of room.players) {
      io.to(player.id).emit("role-assigned", game.roleFor(room, player.id));
    }
  }

  const helpers = { sendRoomState, sendPhase, sendRoles };

  // Bridge: timer-driven phase changes keep sockets synchronized
  game.onRoomChanged((room, event, payload) => {
    if (event === "clue-timeout") {
      io.to(room.code).emit("clue-received", payload);
      sendRoomState(room);
      return;
    }
    if (event === "reveal-results") {
      io.to(room.code).emit("reveal-results", room.results);
      sendPhase(room);
      return;
    }
    if (event === "phase-change") {
      sendPhase(room);
      return;
    }
    sendRoomState(room);
  });

  io.on("connection", (socket) => {
    logger.info("Socket connected", { socketId: socket.id });
    registerRoomEvents(socket, io, game);
    registerGameEvents(socket, io, game, helpers);
  });
}
