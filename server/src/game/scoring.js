import { publicPlayer } from "./Player.js";

export function awardGamePoints(room, winner) {
  const imposter = room.players.find((p) => p.id === room.imposterId);

  // 1. Points for correctly voting for the imposter (+2)
  let correctVoters = [];
  for (const [voterId, targetId] of Object.entries(room.votes || {})) {
    if (targetId === room.imposterId && voterId !== room.imposterId) {
      const p = room.players.find(p => p.id === voterId);
      if (p) {
        p.score += 2;
        correctVoters.push(p.id);
      }
    }
  }

  // 2. Survive a round (imposter) (+2)
  // If the game did not end with players winning this round, or if the imposter wasn't eliminated
  if (winner !== "players") {
    if (imposter) imposter.score += 2;
  }

  // 3. Topic guess points (+3 for imposter)
  if (room.topicGuess?.correct) {
    if (imposter) imposter.score += 3;
  }

  // 4. Win the game
  if (winner === "imposter") {
    if (imposter) imposter.score += 5;
  } else if (winner === "players") {
    // Win the game (team) (+3)
    for (const player of room.players) {
      if (player.id !== room.imposterId) {
        player.score += 3;
      }
    }
  }
}

export function buildFinal(room, winner, reason) {
  const imposter = room.players.find((p) => p.id === room.imposterId);
  const topScore = Math.max(...room.players.map((p) => p.score));
  return {
    round: room.round,
    winner,
    winnerLabel:
      winner === "players"
        ? "Players win!"
        : winner === "imposter"
          ? "The imposter wins!"
          : "Final scores",
    reason,
    imposterId: room.imposterId,
    imposterName: imposter?.name || "Unknown",
    topPlayerIds: room.players
      .filter((p) => p.score === topScore)
      .map((p) => p.id),
    scores: room.players.map(publicPlayer)
  };
}
