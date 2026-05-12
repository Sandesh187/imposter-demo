import { CLUE_SECONDS, DISCUSSION_SECONDS, VOTING_SECONDS } from "../config/index.js";
import { publicPlayer } from "./Player.js";
import { awardGamePoints, buildFinal } from "./scoring.js";
import { topics } from "./topics.js";

// ── Helpers ──────────────────────────────────────────────────

export function activePlayers(room) {
  return room.players.filter((p) => !p.eliminated);
}

export function clearRoomTimer(room) {
  if (room.timerId) {
    clearTimeout(room.timerId);
    room.timerId = null;
  }
}

function makeTimer(seconds) {
  return { duration: seconds, endsAt: Date.now() + seconds * 1000 };
}

function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function recordClue(room, socketId, clue, timedOut = false) {
  const player = room.players.find((p) => p.id === socketId);
  room.clues.push({
    playerId: socketId,
    playerName: player?.name || "Player",
    clue,
    timedOut
  });
}

// ── Round lifecycle ──────────────────────────────────────────

export function startRound(room, notify) {
  const remaining = activePlayers(room);
  if (remaining.length <= 2) {
    return finishGame(room, "imposter", null, "Only two players remain.", notify);
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

  // Topic selection logic
  let availableTopics = room.category === "Custom" ? room.customTopics : topics[room.category] || [];
  if (availableTopics.length === 0) {
    // Fallback if Custom is empty
    availableTopics = ["Secret"];
  }

  let unusedTopics = availableTopics.filter((t) => !room.usedTopics.includes(t));
  if (unusedTopics.length === 0) {
    room.usedTopics = []; // reset if we used all topics
    unusedTopics = availableTopics;
  }

  room.topic = randomFrom(unusedTopics);
  room.usedTopics.push(room.topic);

  room.imposterId = randomFrom(remaining).id;
  return room;
}

export function confirmRole(room, socketId, notify) {
  if (!room || room.phase !== "role") return null;
  room.confirmed.add(socketId);
  if (room.confirmed.size >= activePlayers(room).length) {
    beginCluePhase(room, notify);
  }
  return room;
}

// ── Clue phase ───────────────────────────────────────────────

function beginCluePhase(room, notify) {
  clearRoomTimer(room);
  room.phase = "clue";
  beginClueTurn(room, activePlayers(room)[0]?.id || null, notify);
}

function beginClueTurn(room, playerId, notify) {
  clearRoomTimer(room);
  if (!playerId) {
    beginDiscussionPhase(room, notify);
    return;
  }

  room.currentTurnId = playerId;
  room.timer = makeTimer(room.settings.clueTime);
  room.timerId = setTimeout(() => {
    if (room.phase === "clue" && room.currentTurnId === playerId) {
      recordClue(room, playerId, "Pass", true);
      notify(room, "clue-timeout", room.clues.at(-1));
      advanceClueTurn(room, notify);
    }
  }, room.settings.clueTime * 1000);
}

function advanceClueTurn(room, notify) {
  clearRoomTimer(room);
  const nextPlayer = activePlayers(room).find(
    (p) => !room.clues.some((c) => c.playerId === p.id)
  );
  if (nextPlayer) {
    beginClueTurn(room, nextPlayer.id, notify);
    notify(room, "room-state");
  } else {
    beginDiscussionPhase(room, notify);
  }
}

export function submitClue(room, socketId, cleanClue, notify) {
  recordClue(room, socketId, cleanClue);
  advanceClueTurn(room, notify);
  return room;
}

// ── Discussion phase ─────────────────────────────────────────

function beginDiscussionPhase(room, notify) {
  clearRoomTimer(room);
  room.phase = "discussion";
  room.timer = makeTimer(room.settings.discussionTime);
  room.currentTurnId = null;
  notify(room, "phase-change");
  room.timerId = setTimeout(() => beginVotingPhase(room, notify), room.settings.discussionTime * 1000);
}

// ── Voting phase ─────────────────────────────────────────────

function beginVotingPhase(room, notify) {
  clearRoomTimer(room);
  room.phase = "voting";
  room.timer = makeTimer(room.settings.votingTime);
  room.currentTurnId = null;
  notify(room, "phase-change");
  room.timerId = setTimeout(() => revealResults(room, notify), room.settings.votingTime * 1000);
}

export function maybeReveal(room, notify) {
  const everyoneVoted = Object.keys(room.votes).length >= activePlayers(room).length;
  if (everyoneVoted) {
    revealResults(room, notify);
  }
}

// ── Results / Final ──────────────────────────────────────────

export function revealResults(room, notify) {
  if (!room || room.phase === "results" || room.phase === "final") return room;

  clearRoomTimer(room);
  const counts = {};
  const remaining = activePlayers(room);
  for (const player of remaining) counts[player.id] = 0;
  for (const targetId of Object.values(room.votes)) {
    if (counts[targetId] !== undefined) counts[targetId] += 1;
  }

  const highest = Math.max(0, ...Object.values(counts));
  const mostVotedIds = Object.entries(counts)
    .filter(([, count]) => count === highest)
    .map(([id]) => id);

  const tiedVote = mostVotedIds.length !== 1;
  const eliminatedId = tiedVote ? null : mostVotedIds[0] || null;
  const eliminated = eliminatedId
    ? remaining.find((p) => p.id === eliminatedId)
    : null;
  if (eliminated) {
    eliminated.eliminated = true;
    eliminated.eliminatedRound = room.round;
  }

  const imposterCaught = eliminatedId === room.imposterId;
  const imposter = room.players.find((p) => p.id === room.imposterId);
  const remainingAfter = activePlayers(room);
  const autoFinal = imposterCaught
    ? "players"
    : eliminated && remainingAfter.length <= 2
      ? "imposter"
      : null;

  room.phase = "results";
  room.timer = null;
  room.currentTurnId = null;

  // Award points for this round (passing autoFinal as winner)
  awardGamePoints(room, autoFinal);

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
    remainingCount: remainingAfter.length,
    topicGuess: room.topicGuess,
    scores: room.players.map(publicPlayer),
    clues: [...room.clues]
  };

  room.history.push(room.results);

  if (autoFinal) {
    room.phase = "final";
    room.final = buildFinal(
      room,
      autoFinal,
      imposterCaught
        ? "The imposter was eliminated."
        : "Only two players remain."
    );
  }

  notify(room, "reveal-results");
  return room;
}

export function finishGame(room, winner, eliminated, reason, notify) {
  clearRoomTimer(room);
  room.phase = "final";
  room.timer = null;
  room.currentTurnId = null;

  if (
    winner === "imposter" &&
    !room.players.some((p) => p.id === room.imposterId)
  ) {
    const imposter = activePlayers(room)[0];
    if (imposter) room.imposterId = imposter.id;
  }

  awardGamePoints(room, winner);

  room.results = eliminated
    ? {
        round: room.round,
        imposterId: room.imposterId,
        imposterName:
          room.players.find((p) => p.id === room.imposterId)?.name || "Unknown",
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
  notify(room, "reveal-results");
  return room;
}

// ── Disconnect-triggered phase adjustments ───────────────────

export function handleDisconnectPhase(room, socketId, notify) {
  if (room.currentTurnId === socketId) {
    const nextPlayer = activePlayers(room).find(
      (p) => !room.clues.some((c) => c.playerId === p.id)
    );
    if (nextPlayer && room.phase === "clue") {
      beginClueTurn(room, nextPlayer.id, notify);
    } else if (room.phase === "clue") {
      beginDiscussionPhase(room, notify);
    }
  }

  if (
    room.phase !== "lobby" &&
    room.phase !== "results" &&
    room.phase !== "final" &&
    activePlayers(room).length < 3
  ) {
    const removed = room.players.find((p) => p.id === socketId);
    clearRoomTimer(room);
    finishGame(
      room,
      removed?.id === room.imposterId ? "players" : "imposter",
      removed,
      "A player disconnected.",
      notify
    );
  } else if (room.phase === "voting") {
    maybeReveal(room, notify);
  } else if (
    room.phase === "role" &&
    room.confirmed.size >= activePlayers(room).length
  ) {
    beginCluePhase(room, notify);
  }
}
