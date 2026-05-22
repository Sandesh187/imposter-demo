import { cleanName, normalizeCode, validateCode, sanitizeClue } from "../utils/validation.js";
import { GameError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import { decoratePlayer, publicPlayer } from "./Player.js";
import { awardGamePoints, buildFinal } from "./scoring.js";
import { categories, topics } from "./topics.js";
import {
  LETTERS,
  ROOM_CODE_LENGTH,
  MIN_PLAYERS,
  MAX_PLAYERS
} from "../config/index.js";
import {
  activePlayers,
  clearRoomTimer,
  startRound,
  confirmRole as phaseConfirmRole,
  submitClue as phaseSubmitClue,
  maybeReveal,
  revealResults,
  finishGame,
  handleDisconnectPhase
} from "./phases.js";

function makeCode() {
  let code = "";
  for (let i = 0; i < ROOM_CODE_LENGTH; i += 1) {
    code += LETTERS[Math.floor(Math.random() * LETTERS.length)];
  }
  return code;
}

/**
 * Initializes and returns the game state manager.
 * 
 * @param {import('../store/index.js').Store} store - The persistence store for the rooms.
 * @returns {Object} An object containing all the game actions (createRoom, joinRoom, startGame, etc.)
 */
export function createGame(store) {
  let roomChangeListener = null;

  function notify(room, event, payload = null) {
    roomChangeListener?.(room, event, payload);
  }

  function getRoom(code) {
    return store.get(normalizeCode(code));
  }

  function safeRoom(room) {
    const voteCounts = {};
    for (const player of activePlayers(room)) {
      voteCounts[player.id] = 0;
    }
    for (const targetId of Object.values(room.votes)) {
      if (voteCounts[targetId] !== undefined) voteCounts[targetId] += 1;
    }

    return {
      code: room.code,
      hostId: room.hostId,
      phase: room.phase,
      round: room.round,
      category: room.category,
      categories,
      settings: room.settings,
      players: room.players.map(publicPlayer),
      activePlayerIds: activePlayers(room).map((p) => p.id),
      final: room.final,
      clues: room.clues,
      currentTurnId: room.currentTurnId,
      timer: room.timer,
      voteCounts,
      voteTotal: Object.keys(room.votes).length,
      votedPlayerIds: Object.keys(room.votes),
      confirmedTotal: room.confirmed.size,
      minPlayers: MIN_PLAYERS,
      maxPlayers: MAX_PLAYERS,
      results: room.results
    };
  }

  function roleFor(room, socketId) {
    if (!room || room.phase !== "role") return null;
    if (!activePlayers(room).some((p) => p.id === socketId)) {
      return { role: "eliminated", topic: null, category: room.category };
    }
    const isImposter = room.imposterId === socketId;
    return {
      role: isImposter ? "imposter" : "player",
      topic: isImposter ? null : room.topic,
      category: room.category
    };
  }

  // ── Room CRUD ────────────────────────────────────────────

  function createRoom(socketId, playerName) {
    let code = makeCode();
    while (store.has(code)) code = makeCode();

    const host = decoratePlayer(socketId, playerName, true);
    const room = {
      code,
      hostId: host.id,
      phase: "lobby",
      round: 1,
      category: "General",
      categories: [...categories, "Custom"],
      settings: {
        clueTime: 30,
        discussionTime: 60,
        votingTime: 45,
        maxRounds: 3,
        allowTopicGuess: true
      },
      usedTopics: [],
      customTopics: [],
      players: [host],
      imposterId: null,
      topic: null,
      clues: [],
      votes: {},
      topicGuess: null,
      confirmed: new Set(),
      currentTurnId: null,
      timer: null,
      timerId: null,
      results: null,
      final: null,
      history: []
    };

    store.set(code, room);
    logger.info("Room created", { roomCode: code, host: host.id });
    return { room, player: host };
  }

  function joinRoom(code, socketId, playerName) {
    validateCode(code);
    const room = getRoom(code);
    if (!room) throw new GameError("Room not found.", "ROOM_NOT_FOUND", 404);
    if (room.players.length >= MAX_PLAYERS) throw new GameError("This room is full.", "ROOM_FULL");
    if (room.phase !== "lobby") throw new GameError("That game is already in progress.", "GAME_IN_PROGRESS");
    if (
      room.players.some(
        (p) => p.name.toLowerCase() === cleanName(playerName).toLowerCase()
      )
    ) {
      throw new GameError("That name is already taken in this room.", "NAME_TAKEN");
    }

    const player = decoratePlayer(socketId, playerName);
    room.players.push(player);
    logger.info("Player joined", { roomCode: room.code, player: player.id });
    return { room, player };
  }

  function setCategory(code, playerId, category) {
    const room = getRoom(code);
    if (!room) throw new GameError("Room not found.", "ROOM_NOT_FOUND", 404);
    if (room.hostId !== playerId) throw new GameError("Only the host can change categories.", "NOT_HOST");
    if (!topics[category] && category !== "Custom") throw new GameError("Unknown category.", "INVALID_CATEGORY");
    room.category = category;
    return room;
  }

  function addCustomTopic(code, playerId, topic) {
    const room = getRoom(code);
    if (!room) throw new GameError("Room not found.", "ROOM_NOT_FOUND", 404);
    if (room.hostId !== playerId) throw new GameError("Only the host can add custom topics.", "NOT_HOST");
    
    const cleanTopic = topic?.trim();
    if (!cleanTopic || cleanTopic.length > 30) throw new GameError("Topic must be between 1 and 30 characters.", "INVALID_TOPIC");
    if (room.customTopics.includes(cleanTopic)) throw new GameError("Topic already added.", "DUPLICATE_TOPIC");

    room.customTopics.push(cleanTopic);
    // If we're on a different category, maybe auto-switch to Custom?
    if (room.category !== "Custom") {
      room.category = "Custom";
    }
    return room;
  }

  function updateSettings(code, playerId, newSettings) {
    const room = getRoom(code);
    if (!room) throw new GameError("Room not found.", "ROOM_NOT_FOUND", 404);
    if (room.hostId !== playerId) throw new GameError("Only the host can change settings.", "NOT_HOST");
    if (room.phase !== "lobby") throw new GameError("Settings can only be changed in the lobby.", "WRONG_PHASE");
    
    room.settings = { ...room.settings, ...newSettings };
    return room;
  }

  // ── Game actions ─────────────────────────────────────────

  function startGame(code, playerId) {
    const room = getRoom(code);
    if (!room) throw new GameError("Room not found.", "ROOM_NOT_FOUND", 404);
    if (room.hostId !== playerId) throw new GameError("Only the host can start the game.", "NOT_HOST");
    if (room.players.length < MIN_PLAYERS) {
      throw new GameError(`You need at least ${MIN_PLAYERS} players.`, "NOT_ENOUGH_PLAYERS");
    }

    for (const player of room.players) {
      player.eliminated = false;
      player.eliminatedRound = null;
    }
    room.round = 1;
    room.final = null;
    logger.info("Game started", { roomCode: room.code });
    return startRound(room, notify);
  }

  function confirmRoleAction(code, playerId) {
    const room = getRoom(code);
    return phaseConfirmRole(room, playerId, notify);
  }

  function submitClueAction(code, playerId, clue) {
    const room = getRoom(code);
    if (!room || room.phase !== "clue") throw new GameError("It is not clue time.", "WRONG_PHASE");
    if (room.currentTurnId !== playerId) throw new GameError("Wait for your turn.", "NOT_YOUR_TURN");
    if (room.clues.some((c) => c.playerId === playerId)) {
      throw new GameError("You already gave a clue.", "ALREADY_SUBMITTED");
    }

    const cleanClue = sanitizeClue(clue); // throws GameError if invalid
    
    // Day 9: Duplicate clue detection
    if (room.clues.some(c => c.clue.toLowerCase() === cleanClue.toLowerCase())) {
      throw new GameError(`The clue "${cleanClue}" has already been used this round.`, "DUPLICATE_CLUE");
    }
    
    return phaseSubmitClue(room, playerId, cleanClue, notify);
  }

  function submitVote(code, playerId, targetId) {
    const room = getRoom(code);
    if (!room || room.phase !== "voting") throw new GameError("Voting is not open.", "WRONG_PHASE");
    if (room.votes[playerId]) throw new GameError("Your vote is locked.", "ALREADY_SUBMITTED");
    if (!activePlayers(room).some((p) => p.id === playerId)) {
      throw new GameError("Eliminated players cannot vote.", "PLAYER_ELIMINATED");
    }
    if (!activePlayers(room).some((p) => p.id === targetId)) {
      throw new GameError("Choose a remaining player.", "INVALID_TARGET");
    }
    room.votes[playerId] = targetId;
    maybeReveal(room, notify);
    return room;
  }

  function submitTopicGuess(code, playerId, guess) {
    const room = getRoom(code);
    if (!room || room.phase !== "voting") {
      throw new GameError("Topic guesses are only open during voting.", "WRONG_PHASE");
    }
    if (room.imposterId !== playerId) {
      throw new GameError("Only the imposter can guess the topic.", "NOT_IMPOSTER");
    }

    room.topicGuess = {
      guess: String(guess || "").trim().slice(0, 40),
      correct:
        String(guess || "").trim().toLowerCase() ===
        String(room.topic).toLowerCase()
    };
    maybeReveal(room, notify);
    return room;
  }

  // ── Host controls ────────────────────────────────────────

  function playAgain(code, playerId) {
    const room = getRoom(code);
    if (!room) throw new GameError("Room not found.", "ROOM_NOT_FOUND", 404);
    if (room.hostId !== playerId) throw new GameError("Only the host can start another round.", "NOT_HOST");
    if (room.phase === "final") return newGame(code, playerId);
    if (room.phase !== "results") throw new GameError("Wait for round results.", "WRONG_PHASE");
    if (activePlayers(room).length <= 2) {
      return finishGame(room, "imposter", null, "Only two players remain.", notify);
    }
    room.round += 1;
    return startRound(room, notify);
  }

  function newGame(code, playerId) {
    const room = getRoom(code);
    if (!room) throw new GameError("Room not found.", "ROOM_NOT_FOUND", 404);
    if (room.hostId !== playerId) throw new GameError("Only the host can reset the room.", "NOT_HOST");
    clearRoomTimer(room);
    room.phase = "lobby";
    room.round = 1;
    room.imposterId = null;
    room.topic = null;
    room.clues = [];
    room.votes = {};
    room.topicGuess = null;
    room.confirmed = new Set();
    room.currentTurnId = null;
    room.timer = null;
    room.results = null;
    room.final = null;
    for (const player of room.players) {
      player.eliminated = false;
      player.eliminatedRound = null;
    }
    return room;
  }

  function endGame(code, playerId) {
    const room = getRoom(code);
    if (!room) throw new GameError("Room not found.", "ROOM_NOT_FOUND", 404);
    if (room.hostId !== playerId) throw new GameError("Only the host can end the game.", "NOT_HOST");
    clearRoomTimer(room);
    room.phase = "final";
    room.timer = null;
    room.currentTurnId = null;
    room.final = buildFinal(room, "scores", "The host ended the game.");
    return room;
  }

  // ── Player removal ───────────────────────────────────────

  function removePlayer(playerId) {
    const changed = [];

    for (const [code, room] of store.entries()) {
      const index = room.players.findIndex((p) => p.id === playerId);
      if (index === -1) continue;

      const [removed] = room.players.splice(index, 1);
      if (removed.disconnectTimerId) {
        clearTimeout(removed.disconnectTimerId);
        removed.disconnectTimerId = null;
      }
      room.confirmed.delete(playerId);
      delete room.votes[playerId];
      for (const voterId of Object.keys(room.votes)) {
        if (room.votes[voterId] === playerId) delete room.votes[voterId];
      }
      room.clues = room.clues.filter((c) => c.playerId !== playerId);

      if (room.players.length === 0) {
        clearRoomTimer(room);
        store.delete(code);
        changed.push({ room: null, code, removed });
        logger.info("Room deleted (empty)", { roomCode: code });
        continue;
      }

      if (room.hostId === playerId) {
        room.hostId = room.players[0].id;
        room.players[0].isHost = true;
      }

      handleDisconnectPhase(room, playerId, notify);
      changed.push({ room, code, removed });
    }

    return changed;
  }

  function markPlayerDisconnected(playerId, onRemove) {
    const changed = [];
    for (const [code, room] of store.entries()) {
      const player = room.players.find((p) => p.id === playerId);
      if (!player) continue;

      player.connected = false;
      // Start 30-second grace period
      player.disconnectTimerId = setTimeout(() => {
        logger.info("Player grace period expired", { playerId, roomCode: code });
        const results = removePlayer(playerId);
        onRemove(results);
      }, 30_000);

      store.set(code, room); // persist change
      changed.push({ room, code, player });
    }
    return changed;
  }

  function reconnectPlayer(playerId, newSocketId) {
    let reconnectedRoom = null;
    let reconnectedPlayer = null;

    for (const [code, room] of store.entries()) {
      const player = room.players.find((p) => p.id === playerId);
      if (player) {
        player.connected = true;
        player.socketId = newSocketId;
        if (player.disconnectTimerId) {
          clearTimeout(player.disconnectTimerId);
          player.disconnectTimerId = null;
        }
        store.set(code, room);
        reconnectedRoom = room;
        reconnectedPlayer = player;
        break;
      }
    }
    return { room: reconnectedRoom, player: reconnectedPlayer };
  }

  // ── Public API (same interface as original game object) ──

  return {
    store,
    onRoomChanged(listener) {
      roomChangeListener = listener;
    },
    createRoom,
    joinRoom,
    getRoom,
    setCategory,
    addCustomTopic,
    updateSettings,
    startGame,
    confirmRole: confirmRoleAction,
    submitClue: submitClueAction,
    submitVote,
    submitTopicGuess,
    playAgain,
    newGame,
    endGame,
    removePlayer,
    markPlayerDisconnected,
    reconnectPlayer,
    revealResults: (room) => revealResults(room, notify),
    safeRoom,
    roleFor
  };
}
