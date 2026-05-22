import { logger } from "../utils/logger.js";
import { wrapHandler } from "../utils/socketWrapper.js";

export function registerGameEvents(socket, io, game, helpers) {
  const { sendPhase, sendRoles, sendRoomState } = helpers;

  socket.on("start-game", wrapHandler(socket, ({ roomCode }, ack) => {
    const room = game.startGame(roomCode, socket.data.playerId);
    ack?.({ ok: true });
    sendPhase(room);
    sendRoles(room);
  }));

  socket.on("confirm-role", wrapHandler(socket, ({ roomCode }, ack) => {
    const room = game.confirmRole(roomCode, socket.data.playerId);
    ack?.({ ok: true });
    if (room?.phase === "clue") {
      sendPhase(room);
    } else {
      sendRoomState(room);
    }
  }));

  socket.on("submit-clue", wrapHandler(socket, ({ roomCode, clue }, ack) => {
    const room = game.submitClue(roomCode, socket.data.playerId, clue);
    ack?.({ ok: true });
    io.to(room.code).emit("clue-received", room.clues.at(-1));
    if (room.phase === "discussion") {
      sendPhase(room);
    } else {
      sendRoomState(room);
    }
  }));

  socket.on("submit-vote", wrapHandler(socket, ({ roomCode, targetId }, ack) => {
    const room = game.submitVote(roomCode, socket.data.playerId, targetId);
    ack?.({ ok: true });
    io.to(room.code).emit("vote-received", {
      voterId: socket.data.playerId,
      voteTotal: Object.keys(room.votes).length
    });
    socket.emit("toast", { message: "Vote locked." });
    if (room.phase === "results") {
      io.to(room.code).emit("reveal-results", room.results);
      sendPhase(room);
    } else {
      sendRoomState(room);
    }
  }));

  socket.on("submit-topic-guess", wrapHandler(socket, ({ roomCode, guess }, ack) => {
    const room = game.submitTopicGuess(roomCode, socket.data.playerId, guess);
    ack?.({ ok: true });
    socket.emit("toast", { message: "Topic guess locked." });
    if (room.phase === "results") {
      io.to(room.code).emit("reveal-results", room.results);
      sendPhase(room);
    } else {
      sendRoomState(room);
    }
  }));

  socket.on("play-again", wrapHandler(socket, ({ roomCode }, ack) => {
    const room = game.playAgain(roomCode, socket.data.playerId);
    ack?.({ ok: true });
    sendPhase(room);
    if (room.phase === "role") sendRoles(room);
  }));

  socket.on("new-game", wrapHandler(socket, ({ roomCode }, ack) => {
    const room = game.newGame(roomCode, socket.data.playerId);
    ack?.({ ok: true });
    sendPhase(room);
  }));

  socket.on("end-game", wrapHandler(socket, ({ roomCode }, ack) => {
    const room = game.endGame(roomCode, socket.data.playerId);
    ack?.({ ok: true });
    sendPhase(room);
  }));

  socket.on("kick-disconnected-player", wrapHandler(socket, ({ roomCode, targetId }, ack) => {
    const changes = game.kickDisconnectedPlayer(roomCode, socket.data.playerId, targetId);
    ack?.({ ok: true });
    for (const change of changes) {
      if (!change.room) continue;
      io.to(change.code).emit("player-disconnected", {
        playerId: change.removed.id,
        playerName: change.removed.name
      });
      io.to(change.code).emit("toast", {
        message: `${change.removed.name} was removed.`
      });
      if (change.room.phase === "results" || change.room.phase === "final") {
        io.to(change.code).emit("reveal-results", change.room.results);
      }
      sendRoomState(change.room);
    }
  }));
}
