import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { game } from "./gameLogic.js";

const app = express();
const server = createServer(app);
const port = process.env.PORT || 3001;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(__dirname, "../client/dist");

app.use(cors());
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || "*"
  }
});

function sendRoomState(room) {
  if (!room) {
    return;
  }
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

// Timer-driven phase changes happen inside gameLogic. This bridge keeps sockets
// synchronized even when nobody clicks at the exact moment a timer expires.
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
  socket.on("create-room", ({ playerName }, ack) => {
    try {
      const room = game.createRoom(socket.id, playerName);
      socket.join(room.code);
      ack?.({ ok: true, room: game.safeRoom(room), playerId: socket.id });
      socket.emit("toast", { message: `Room ${room.code} created.` });
      sendRoomState(room);
    } catch (error) {
      ack?.({ ok: false, error: error.message });
      socket.emit("error-message", error.message);
    }
  });

  socket.on("join-room", ({ roomCode, playerName }, ack) => {
    try {
      const room = game.joinRoom(roomCode, socket.id, playerName);
      socket.join(room.code);
      ack?.({ ok: true, room: game.safeRoom(room), playerId: socket.id });
      io.to(room.code).emit("player-joined", {
        playerId: socket.id,
        playerName
      });
      io.to(room.code).emit("toast", { message: `${playerName || "A player"} joined.` });
      sendRoomState(room);
    } catch (error) {
      ack?.({ ok: false, error: error.message });
      socket.emit("error-message", error.message);
    }
  });

  socket.on("set-category", ({ roomCode, category }, ack) => {
    try {
      const room = game.setCategory(roomCode, socket.id, category);
      ack?.({ ok: true });
      sendRoomState(room);
    } catch (error) {
      ack?.({ ok: false, error: error.message });
      socket.emit("error-message", error.message);
    }
  });

  socket.on("start-game", ({ roomCode }, ack) => {
    try {
      const room = game.startGame(roomCode, socket.id);
      ack?.({ ok: true });
      sendPhase(room);
      sendRoles(room);
    } catch (error) {
      ack?.({ ok: false, error: error.message });
      socket.emit("error-message", error.message);
    }
  });

  socket.on("confirm-role", ({ roomCode }, ack) => {
    try {
      const room = game.confirmRole(roomCode, socket.id);
      ack?.({ ok: true });
      if (room?.phase === "clue") {
        sendPhase(room);
      } else {
        sendRoomState(room);
      }
    } catch (error) {
      ack?.({ ok: false, error: error.message });
      socket.emit("error-message", error.message);
    }
  });

  socket.on("submit-clue", ({ roomCode, clue }, ack) => {
    try {
      const room = game.submitClue(roomCode, socket.id, clue);
      ack?.({ ok: true });
      io.to(room.code).emit("clue-received", room.clues.at(-1));
      if (room.phase === "discussion") {
        sendPhase(room);
      } else {
        sendRoomState(room);
      }
    } catch (error) {
      ack?.({ ok: false, error: error.message });
      socket.emit("error-message", error.message);
    }
  });

  socket.on("submit-vote", ({ roomCode, targetId }, ack) => {
    try {
      const room = game.submitVote(roomCode, socket.id, targetId);
      ack?.({ ok: true });
      io.to(room.code).emit("vote-received", {
        voterId: socket.id,
        voteTotal: Object.keys(room.votes).length
      });
      io.to(socket.id).emit("toast", { message: "Vote locked." });
      if (room.phase === "results") {
        io.to(room.code).emit("reveal-results", room.results);
        sendPhase(room);
      } else {
        sendRoomState(room);
      }
    } catch (error) {
      ack?.({ ok: false, error: error.message });
      socket.emit("error-message", error.message);
    }
  });

  socket.on("submit-topic-guess", ({ roomCode, guess }, ack) => {
    try {
      const room = game.submitTopicGuess(roomCode, socket.id, guess);
      ack?.({ ok: true });
      io.to(socket.id).emit("toast", { message: "Topic guess locked." });
      if (room.phase === "results") {
        io.to(room.code).emit("reveal-results", room.results);
        sendPhase(room);
      } else {
        sendRoomState(room);
      }
    } catch (error) {
      ack?.({ ok: false, error: error.message });
      socket.emit("error-message", error.message);
    }
  });

  socket.on("play-again", ({ roomCode }, ack) => {
    try {
      const room = game.playAgain(roomCode, socket.id);
      ack?.({ ok: true });
      sendPhase(room);
      if (room.phase === "role") {
        sendRoles(room);
      }
    } catch (error) {
      ack?.({ ok: false, error: error.message });
      socket.emit("error-message", error.message);
    }
  });

  socket.on("new-game", ({ roomCode }, ack) => {
    try {
      const room = game.newGame(roomCode, socket.id);
      ack?.({ ok: true });
      sendPhase(room);
    } catch (error) {
      ack?.({ ok: false, error: error.message });
      socket.emit("error-message", error.message);
    }
  });

  socket.on("end-game", ({ roomCode }, ack) => {
    try {
      const room = game.endGame(roomCode, socket.id);
      ack?.({ ok: true });
      sendPhase(room);
    } catch (error) {
      ack?.({ ok: false, error: error.message });
      socket.emit("error-message", error.message);
    }
  });

  socket.on("leave-room", ({ roomCode }, ack) => {
    const changes = game.removePlayer(socket.id);
    for (const change of changes) {
      if (change.room) {
        io.to(change.code).emit("player-disconnected", {
          playerId: socket.id,
          playerName: change.removed.name
        });
        sendRoomState(change.room);
      }
      socket.leave(change.code);
    }
    socket.leave(roomCode);
    ack?.({ ok: true });
  });

  socket.on("disconnect", () => {
    const changes = game.removePlayer(socket.id);
    for (const change of changes) {
      if (!change.room) {
        continue;
      }
      io.to(change.code).emit("player-disconnected", {
        playerId: socket.id,
        playerName: change.removed.name
      });
      io.to(change.code).emit("toast", { message: `${change.removed.name} left.` });
      if (change.room.phase === "results") {
        io.to(change.code).emit("reveal-results", change.room.results);
      }
      sendRoomState(change.room);
    }
  });
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use(express.static(clientDist));
app.get("*", (_req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

server.listen(port, () => {
  console.log(`FakeIt server running on port ${port}`);
});
