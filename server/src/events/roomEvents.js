import { logger } from "../utils/logger.js";
import { wrapHandler } from "../utils/socketWrapper.js";

export function registerRoomEvents(socket, io, game) {
  socket.on("create-room", wrapHandler(socket, ({ playerName }, ack) => {
    const { room, player } = game.createRoom(socket.id, playerName);
    socket.data.playerId = player.id;
    socket.join(room.code);
    socket.join(player.id);
    ack?.({ ok: true, room: game.safeRoom(room), playerId: player.id });
    socket.emit("toast", { message: `Room ${room.code} created.` });
    io.to(room.code).emit("room-state", game.safeRoom(room));
  }));

  socket.on("join-room", wrapHandler(socket, ({ roomCode, playerName }, ack) => {
    const { room, player } = game.joinRoom(roomCode, socket.id, playerName);
    socket.data.playerId = player.id;
    socket.join(room.code);
    socket.join(player.id);
    ack?.({ ok: true, room: game.safeRoom(room), playerId: player.id });
    io.to(room.code).emit("player-joined", {
      playerId: player.id,
      playerName
    });
    io.to(room.code).emit("toast", {
      message: `${playerName || "A player"} joined.`
    });
    io.to(room.code).emit("room-state", game.safeRoom(room));
  }));

  socket.on("reconnect-session", wrapHandler(socket, ({ playerId }, ack) => {
    const { room, player } = game.reconnectPlayer(playerId, socket.id);
    if (!room || !player) {
      return ack?.({ ok: false, error: "Session expired or room not found." });
    }
    
    socket.data.playerId = player.id;
    socket.join(room.code);
    socket.join(player.id);
    ack?.({ ok: true, room: game.safeRoom(room), playerId: player.id });
    
    logger.info("Player reconnected", { roomCode: room.code, playerId });
    socket.emit("toast", { message: "Reconnected to game." });
    if (room.phase === "role") {
      socket.emit("role-assigned", game.roleFor(room, player.id));
    }
    io.to(room.code).emit("room-state", game.safeRoom(room));
  }));

  socket.on("set-category", wrapHandler(socket, ({ roomCode, category }, ack) => {
    const room = game.setCategory(roomCode, socket.data.playerId, category);
    ack?.({ ok: true });
    io.to(room.code).emit("room-state", game.safeRoom(room));
  }));

  socket.on("update-settings", wrapHandler(socket, ({ roomCode, settings }, ack) => {
    const room = game.updateSettings(roomCode, socket.data.playerId, settings);
    ack?.({ ok: true });
    io.to(room.code).emit("room-state", game.safeRoom(room));
  }));

  socket.on("add-custom-topic", wrapHandler(socket, ({ roomCode, topic }, ack) => {
    const room = game.addCustomTopic(roomCode, socket.data.playerId, topic);
    ack?.({ ok: true });
    socket.emit("toast", { message: `Added custom topic: ${topic}` });
    io.to(room.code).emit("room-state", game.safeRoom(room));
  }));

  socket.on("leave-room", wrapHandler(socket, ({ roomCode }, ack) => {
    const playerId = socket.data.playerId;
    if (!playerId) return;
    
    const changes = game.removePlayer(playerId);
    for (const change of changes) {
      if (change.room) {
        io.to(change.code).emit("player-disconnected", {
          playerId: change.removed.id,
          playerName: change.removed.name
        });
        io.to(change.code).emit("room-state", game.safeRoom(change.room));
      }
      socket.leave(change.code);
    }
    socket.leave(roomCode);
    socket.data.playerId = null;
    ack?.({ ok: true });
  }));

  socket.on("disconnect", wrapHandler(socket, () => {
    const playerId = socket.data.playerId;
    if (!playerId) return; // Not in a game
    
    logger.info("Socket disconnected, starting grace period", { socketId: socket.id, playerId });
    
    // Instead of immediate removal, mark disconnected and start 30s timer
    const changes = game.markPlayerDisconnected(playerId, socket.id, (removalChanges) => {
      // This callback fires if the grace period expires without reconnection
      for (const change of removalChanges) {
        if (!change.room) continue;
        io.to(change.code).emit("player-disconnected", {
          playerId: change.removed.id,
          playerName: change.removed.name
        });
        io.to(change.code).emit("toast", {
          message: `${change.removed.name} left.`
        });
        if (change.room.phase === "results") {
          io.to(change.code).emit("reveal-results", change.room.results);
        }
        io.to(change.code).emit("room-state", game.safeRoom(change.room));
      }
    });

    // Immediately notify remaining players that this player's connection dropped (optional, updates UI to show offline state)
    for (const change of changes) {
      if (change.room) {
        io.to(change.code).emit("room-state", game.safeRoom(change.room));
      }
    }
  }));
}
