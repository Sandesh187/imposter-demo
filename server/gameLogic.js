import { categories, topics } from "./topics.js";

const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const CLUE_SECONDS = 30;
const DISCUSSION_SECONDS = 60;
const VOTING_SECONDS = 45;

const rooms = new Map();
let roomChangeListener = null;

function notifyRoomChanged(room, event, payload = null) {
  roomChangeListener?.(room, event, payload);
}

function makeCode() {
  let code = "";
  for (let i = 0; i < 4; i += 1) {
    code += LETTERS[Math.floor(Math.random() * LETTERS.length)];
  }
  return code;
}

function cleanName(name) {
  const trimmed = String(name || "").trim();
  return trimmed.slice(0, 18) || "Player";
}

function publicPlayer(player) {
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

function nowMs() {
  return Date.now();
}

function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function normalizeCode(code) {
  return String(code || "").trim().toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4);
}

function makeTimer(seconds) {
  return {
    duration: seconds,
    endsAt: nowMs() + seconds * 1000
  };
}

function clearRoomTimer(room) {
  if (room.timerId) {
    clearTimeout(room.timerId);
    room.timerId = null;
  }
}

function activePlayers(room) {
  return room.players.filter((player) => !player.eliminated);
}

function safeRoom(room) {
  const voteCounts = {};
  for (const player of activePlayers(room)) {
    voteCounts[player.id] = 0;
  }

  for (const targetId of Object.values(room.votes)) {
    if (voteCounts[targetId] !== undefined) {
      voteCounts[targetId] += 1;
    }
  }

  return {
    code: room.code,
    hostId: room.hostId,
    phase: room.phase,
    round: room.round,
    category: room.category,
    categories,
    players: room.players.map(publicPlayer),
    activePlayerIds: activePlayers(room).map((player) => player.id),
    final: room.final,
    clues: room.clues,
    currentTurnId: room.currentTurnId,
    timer: room.timer,
    voteCounts,
    voteTotal: Object.keys(room.votes).length,
    votedPlayerIds: Object.keys(room.votes),
    confirmedTotal: room.confirmed.size,
    minPlayers: 4,
    maxPlayers: 8,
    results: room.results
  };
}

function decoratePlayer(socketId, name, isHost = false) {
  const colors = ["#F5A623", "#9B59B6", "#FF6B6B", "#14B8A6", "#EC4899", "#22C55E"];
  return {
    id: socketId,
    name: cleanName(name),
    score: 0,
    connected: true,
    isHost,
    eliminated: false,
    eliminatedRound: null,
    avatarColor: colors[Math.floor(Math.random() * colors.length)]
  };
}

function getRoom(code) {
  return rooms.get(normalizeCode(code));
}

function createRoom(socketId, playerName) {
  let code = makeCode();
  while (rooms.has(code)) {
    code = makeCode();
  }

  const host = decoratePlayer(socketId, playerName, true);
  const room = {
    code,
    hostId: socketId,
    phase: "lobby",
    round: 1,
    category: "General",
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
    final: null
  };

  rooms.set(code, room);
  return room;
}

function joinRoom(code, socketId, playerName) {
  const room = getRoom(code);
  if (!room) {
    throw new Error("Room not found.");
  }

  if (room.players.length >= 8) {
    throw new Error("This room is full.");
  }

  if (room.phase !== "lobby") {
    throw new Error("That game is already in progress.");
  }

  if (room.players.some((player) => player.name.toLowerCase() === cleanName(playerName).toLowerCase())) {
    throw new Error("That name is already taken in this room.");
  }

  const player = decoratePlayer(socketId, playerName);
  room.players.push(player);
  return room;
}

function setCategory(code, socketId, category) {
  const room = getRoom(code);
  if (!room) {
    throw new Error("Room not found.");
  }
  if (room.hostId !== socketId) {
    throw new Error("Only the host can change categories.");
  }
  if (!topics[category]) {
    throw new Error("Unknown category.");
  }
  room.category = category;
  return room;
}

function startGame(code, socketId) {
  const room = getRoom(code);
  if (!room) {
    throw new Error("Room not found.");
  }
  if (room.hostId !== socketId) {
    throw new Error("Only the host can start the game.");
  }
  if (room.players.length < 4) {
    throw new Error("You need at least 4 players.");
  }

  for (const player of room.players) {
    player.eliminated = false;
    player.eliminatedRound = null;
  }
  room.round = 1;
  room.final = null;
  return startRound(room);
}

function startRound(room) {
  const remaining = activePlayers(room);
  if (remaining.length <= 2) {
    return finishGame(room, "imposter", null, "Only two players remain.");
  }

  clearRoomTimer(room);
  room.phase = "role";
  room.results = null;
  room.clues = [];
  room.votes = {};
  room.topicGuess = null;
  room.confirmed = new Set();
  room.timer = null;
  room.currentTurnId = null;
  room.topic = randomFrom(topics[room.category]);
  room.imposterId = randomFrom(remaining).id;
  return room;
}

function confirmRole(code, socketId) {
  const room = getRoom(code);
  if (!room || room.phase !== "role") {
    return null;
  }
  room.confirmed.add(socketId);
  if (room.confirmed.size >= activePlayers(room).length) {
    beginCluePhase(room);
  }
  return room;
}

function beginCluePhase(room) {
  clearRoomTimer(room);
  room.phase = "clue";
  beginClueTurn(room, activePlayers(room)[0]?.id || null);
}

function beginClueTurn(room, playerId) {
  clearRoomTimer(room);
  if (!playerId) {
    beginDiscussionPhase(room);
    return;
  }

  room.currentTurnId = playerId;
  room.timer = makeTimer(CLUE_SECONDS);
  room.timerId = setTimeout(() => {
    if (room.phase === "clue" && room.currentTurnId === playerId) {
      recordClue(room, playerId, "Pass", true);
      notifyRoomChanged(room, "clue-timeout", room.clues.at(-1));
      advanceClueTurn(room);
    }
  }, CLUE_SECONDS * 1000);
}

function advanceClueTurn(room) {
  clearRoomTimer(room);
  const nextPlayer = activePlayers(room).find((entry) => !room.clues.some((clueEntry) => clueEntry.playerId === entry.id));
  if (nextPlayer) {
    beginClueTurn(room, nextPlayer.id);
    notifyRoomChanged(room, "room-state");
  } else {
    beginDiscussionPhase(room);
  }
}

function recordClue(room, socketId, clue, timedOut = false) {
  const player = room.players.find((entry) => entry.id === socketId);
  room.clues.push({
    playerId: socketId,
    playerName: player?.name || "Player",
    clue,
    timedOut
  });
}

function beginDiscussionPhase(room) {
  clearRoomTimer(room);
  room.phase = "discussion";
  room.timer = makeTimer(DISCUSSION_SECONDS);
  room.currentTurnId = null;
  notifyRoomChanged(room, "phase-change");
  room.timerId = setTimeout(() => beginVotingPhase(room), DISCUSSION_SECONDS * 1000);
}

function beginVotingPhase(room) {
  clearRoomTimer(room);
  room.phase = "voting";
  room.timer = makeTimer(VOTING_SECONDS);
  room.currentTurnId = null;
  notifyRoomChanged(room, "phase-change");
  room.timerId = setTimeout(() => revealResults(room), VOTING_SECONDS * 1000);
}

function submitClue(code, socketId, clue) {
  const room = getRoom(code);
  if (!room || room.phase !== "clue") {
    throw new Error("It is not clue time.");
  }
  if (room.currentTurnId !== socketId) {
    throw new Error("Wait for your turn.");
  }
  if (room.clues.some((entry) => entry.playerId === socketId)) {
    throw new Error("You already gave a clue.");
  }

  const cleanClue = String(clue || "")
    .trim()
    .split(/\s+/)[0]
    ?.replace(/[^\p{L}\p{N}-]/gu, "")
    .slice(0, 18);

  if (!cleanClue) {
    throw new Error("Clue must be one word.");
  }

  recordClue(room, socketId, cleanClue);
  advanceClueTurn(room);

  return room;
}

function submitVote(code, socketId, targetId) {
  const room = getRoom(code);
  if (!room || room.phase !== "voting") {
    throw new Error("Voting is not open.");
  }
  if (room.votes[socketId]) {
    throw new Error("Your vote is locked.");
  }
  if (!activePlayers(room).some((player) => player.id === socketId)) {
    throw new Error("Eliminated players cannot vote.");
  }
  if (!activePlayers(room).some((player) => player.id === targetId)) {
    throw new Error("Choose a remaining player.");
  }

  room.votes[socketId] = targetId;
  maybeReveal(room);
  return room;
}

function submitTopicGuess(code, socketId, guess) {
  const room = getRoom(code);
  if (!room || room.phase !== "voting") {
    throw new Error("Topic guesses are only open during voting.");
  }
  if (room.imposterId !== socketId) {
    throw new Error("Only the imposter can guess the topic.");
  }

  room.topicGuess = {
    guess: String(guess || "").trim().slice(0, 40),
    correct: String(guess || "").trim().toLowerCase() === String(room.topic).toLowerCase()
  };
  maybeReveal(room);
  return room;
}

function maybeReveal(room) {
  const everyoneVoted = Object.keys(room.votes).length >= activePlayers(room).length;
  if (everyoneVoted) {
    revealResults(room);
  }
}

function revealResults(room) {
  if (!room || room.phase === "results" || room.phase === "final") {
    return room;
  }

  clearRoomTimer(room);
  const counts = {};
  const remaining = activePlayers(room);
  for (const player of remaining) {
    counts[player.id] = 0;
  }
  for (const targetId of Object.values(room.votes)) {
    if (counts[targetId] !== undefined) {
      counts[targetId] += 1;
    }
  }

  const highest = Math.max(0, ...Object.values(counts));
  const mostVotedIds = Object.entries(counts)
    .filter(([, count]) => count === highest)
    .map(([id]) => id);

  const tiedVote = mostVotedIds.length !== 1;
  const eliminatedId = tiedVote ? null : mostVotedIds[0] || null;
  const eliminated = eliminatedId ? remaining.find((player) => player.id === eliminatedId) : null;
  if (eliminated) {
    eliminated.eliminated = true;
    eliminated.eliminatedRound = room.round;
  }

  const imposterCaught = eliminatedId === room.imposterId;
  const imposter = room.players.find((player) => player.id === room.imposterId);
  const remainingAfterElimination = activePlayers(room);
  const autoFinal = imposterCaught ? "players" : eliminated && remainingAfterElimination.length <= 2 ? "imposter" : null;
  room.phase = "results";
  room.timer = null;
  room.currentTurnId = null;
  room.results = {
    round: room.round,
    imposterId: room.imposterId,
    imposterName: imposter?.name || "Unknown",
    eliminatedId,
    eliminatedName: eliminated?.name || null,
    tiedVote,
    topic: room.topic,
    votes: room.votes,
    voteCounts: counts,
    mostVotedIds,
    imposterCaught,
    imposterWins: autoFinal === "imposter",
    gameOver: Boolean(autoFinal),
    finalWinner: autoFinal,
    remainingCount: remainingAfterElimination.length,
    topicGuess: room.topicGuess,
    scores: room.players.map(publicPlayer)
  };
  if (autoFinal) {
    room.phase = "final";
    awardGamePoints(room, autoFinal);
    room.final = buildFinal(room, autoFinal, imposterCaught ? "The imposter was eliminated." : "Only two players remain.");
  }
  notifyRoomChanged(room, "reveal-results");
  return room;
}

function awardGamePoints(room, winner) {
  if (winner === "imposter") {
    const imposter = room.players.find((player) => player.id === room.imposterId);
    if (imposter) {
      imposter.score += 3;
    }
    return;
  }

  if (winner === "players") {
    for (const player of room.players) {
      if (player.id !== room.imposterId) {
        player.score += 3;
      }
    }
  }
}

function buildFinal(room, winner, reason) {
  const imposter = room.players.find((player) => player.id === room.imposterId);
  const topScore = Math.max(...room.players.map((player) => player.score));
  return {
    round: room.round,
    winner,
    winnerLabel: winner === "players" ? "Players win!" : winner === "imposter" ? "The imposter wins!" : "Final scores",
    reason,
    imposterId: room.imposterId,
    imposterName: imposter?.name || "Unknown",
    topPlayerIds: room.players.filter((player) => player.score === topScore).map((player) => player.id),
    scores: room.players.map(publicPlayer)
  };
}

function finishGame(room, winner, eliminated, reason) {
  clearRoomTimer(room);
  room.phase = "final";
  room.timer = null;
  room.currentTurnId = null;
  if (winner === "imposter" && !room.players.some((player) => player.id === room.imposterId)) {
    const imposter = activePlayers(room)[0];
    if (imposter) {
      room.imposterId = imposter.id;
    }
  }
  awardGamePoints(room, winner);
  room.results = eliminated
    ? {
        round: room.round,
        imposterId: room.imposterId,
        imposterName: room.players.find((player) => player.id === room.imposterId)?.name || "Unknown",
        eliminatedId: eliminated.id,
        eliminatedName: eliminated.name,
        topic: room.topic,
        votes: room.votes,
        voteCounts: {},
        mostVotedIds: [eliminated.id],
        imposterCaught: winner === "players",
        imposterWins: winner === "imposter",
        gameOver: true,
        finalWinner: winner,
        remainingCount: activePlayers(room).length,
        scores: room.players.map(publicPlayer)
      }
    : room.results;
  room.final = buildFinal(room, winner, reason);
  notifyRoomChanged(room, "reveal-results");
  return room;
}

function playAgain(code, socketId) {
  const room = getRoom(code);
  if (!room) {
    throw new Error("Room not found.");
  }
  if (room.hostId !== socketId) {
    throw new Error("Only the host can start another round.");
  }
  if (room.phase === "final") {
    return newGame(code, socketId);
  }
  if (room.phase !== "results") {
    throw new Error("Wait for round results.");
  }
  if (activePlayers(room).length <= 2) {
    return finishGame(room, "imposter", null, "Only two players remain.");
  }
  room.round += 1;
  return startRound(room);
}

function newGame(code, socketId) {
  const room = getRoom(code);
  if (!room) {
    throw new Error("Room not found.");
  }
  if (room.hostId !== socketId) {
    throw new Error("Only the host can reset the room.");
  }
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

function endGame(code, socketId) {
  const room = getRoom(code);
  if (!room) {
    throw new Error("Room not found.");
  }
  if (room.hostId !== socketId) {
    throw new Error("Only the host can end the game.");
  }

  clearRoomTimer(room);
  room.phase = "final";
  room.timer = null;
  room.currentTurnId = null;
  room.final = buildFinal(room, "scores", "The host ended the game.");
  return room;
}

function removePlayer(socketId) {
  const changed = [];

  for (const [code, room] of rooms) {
    const index = room.players.findIndex((player) => player.id === socketId);
    if (index === -1) {
      continue;
    }

    const [removed] = room.players.splice(index, 1);
    room.confirmed.delete(socketId);
    delete room.votes[socketId];
    for (const voterId of Object.keys(room.votes)) {
      if (room.votes[voterId] === socketId) {
        delete room.votes[voterId];
      }
    }
    room.clues = room.clues.filter((entry) => entry.playerId !== socketId);

    if (room.players.length === 0) {
      clearRoomTimer(room);
      rooms.delete(code);
      changed.push({ room: null, code, removed });
      continue;
    }

    if (room.hostId === socketId) {
      room.hostId = room.players[0].id;
      room.players[0].isHost = true;
    }

    if (room.currentTurnId === socketId) {
      const nextPlayer = activePlayers(room).find((player) => !room.clues.some((entry) => entry.playerId === player.id));
      if (nextPlayer && room.phase === "clue") {
        beginClueTurn(room, nextPlayer.id);
      } else if (room.phase === "clue") {
        beginDiscussionPhase(room);
      }
    }

    if (room.phase !== "lobby" && room.phase !== "results" && room.phase !== "final" && activePlayers(room).length < 3) {
      clearRoomTimer(room);
      finishGame(room, removed.id === room.imposterId ? "players" : "imposter", removed, "A player disconnected.");
    } else if (room.phase === "voting") {
      maybeReveal(room);
    } else if (room.phase === "role" && room.confirmed.size >= activePlayers(room).length) {
      beginCluePhase(room);
    }

    changed.push({ room, code, removed });
  }

  return changed;
}

function roleFor(room, socketId) {
  if (!room || room.phase !== "role") {
    return null;
  }
  if (!activePlayers(room).some((player) => player.id === socketId)) {
    return {
      role: "eliminated",
      topic: null,
      category: room.category
    };
  }
  const isImposter = room.imposterId === socketId;
  return {
    role: isImposter ? "imposter" : "player",
    topic: isImposter ? null : room.topic,
    category: room.category
  };
}

export const game = {
  rooms,
  onRoomChanged(listener) {
    roomChangeListener = listener;
  },
  createRoom,
  joinRoom,
  getRoom,
  setCategory,
  startGame,
  confirmRole,
  submitClue,
  submitVote,
  submitTopicGuess,
  playAgain,
  newGame,
  endGame,
  removePlayer,
  revealResults,
  safeRoom,
  roleFor
};
