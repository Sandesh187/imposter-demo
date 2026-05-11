import { Crown, RotateCcw, Trophy } from "lucide-react";
import { Button, GlassCard, PlayerAvatar, Shell } from "./ui";

function medal(index) {
  return ["🥇", "🥈", "🥉"][index] || `${index + 1}`;
}

export function FinalGameOver({ game }) {
  const { room, playerId, actions } = game;
  const isHost = room.hostId === playerId;
  const final = room.final;
  const sorted = [...room.players].sort((a, b) => b.score - a.score);
  const topIds = new Set(final?.topPlayerIds || []);
  const imposterWins = final?.winner === "imposter";
  const playerWin = final?.winner === "players";

  return (
    <Shell kicker="final" title="Game Over!" subtitle={final?.reason || "The table has spoken."} room={room}>
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {Array.from({ length: 54 }).map((_, index) => (
          <span key={index} className="confetti" style={{ left: `${(index * 23) % 100}%`, animationDelay: `${(index % 12) * 0.07}s` }} />
        ))}
      </div>

      <div className="space-y-4">
        <div className={`rounded-3xl p-6 text-center ${playerWin ? "bg-emerald-400 text-black" : imposterWins ? "bg-red-500 text-white" : "glass-card"}`}>
          <Crown className="crown-bob mx-auto h-16 w-16 text-[#F5A623]" />
          <p className="mt-3 text-4xl font-black">{final?.winnerLabel || "Final scores"}</p>
          <p className="mt-2 text-sm font-black opacity-80">Imposter: {final?.imposterName || "Unknown"}</p>
        </div>

        <GlassCard>
          <div className="mb-3 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-[#F5A623]" />
            <p className="text-sm font-black">Final scoreboard</p>
          </div>
          <div className="space-y-2">
            {sorted.map((player, index) => {
              const highlighted = topIds.has(player.id);
              return (
                <div
                  key={player.id}
                  className={`flex min-h-16 items-center gap-3 rounded-2xl px-3 py-2 ring-1 ${
                    highlighted ? "bg-[#F5A623]/18 ring-[#F5A623]/45 shadow-[0_0_28px_rgba(245,166,35,0.18)]" : "bg-white/7 ring-white/10"
                  }`}
                >
                  <span className="w-7 text-center text-lg font-black">{medal(index)}</span>
                  <PlayerAvatar player={player} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black">{player.name}</p>
                    {highlighted && <p className="text-xs font-black uppercase tracking-[0.12em] text-[#F5A623]">Winner</p>}
                  </div>
                  <p className="text-xl font-black text-[#F5A623]">{player.score}</p>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {isHost ? (
          <Button onClick={actions.playAgain} className="flex w-full items-center justify-center gap-2 text-base">
            <RotateCcw className="h-5 w-5" /> Play Again
          </Button>
        ) : (
          <p className="glass-card rounded-2xl px-4 py-4 text-center text-sm font-black text-white/60">Waiting for host to play again...</p>
        )}
      </div>
    </Shell>
  );
}
