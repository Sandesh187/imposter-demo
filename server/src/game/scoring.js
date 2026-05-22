import { publicPlayer } from "./Player.js";

export function awardGamePoints(room, winner) {
  if (winner === "imposter") {
    const imposter = room.players.find((p) => p.id === room.imposterId);
    if (imposter) imposter.score += 3;
    return;
  }

  if (winner === "players") {
    for (const player of room.players) {
      if (player.id !== room.imposterId) player.score += 3;
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
