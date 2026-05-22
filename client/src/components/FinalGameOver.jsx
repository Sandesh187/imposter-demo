import { Crown, RotateCcw, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, HardwarePanel, PlayerAvatar, Shell } from "./ui";

function medal(index) {
  return ["🥇", "🥈", "🥉"][index] || `${index + 1}`;
}

// Animated counter that rolls from 0 to target
function AnimatedScore({ target }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const steps = 30;
    const increment = target / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= target) {
        setValue(target);
        clearInterval(interval);
      } else {
        setValue(Math.round(current));
      }
    }, 50);
    return () => clearInterval(interval);
  }, [target]);

  return <span className="tabular-nums">{value}</span>;
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
      {/* Enhanced confetti - more variety */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {Array.from({ length: 64 }).map((_, index) => (
          <span
            key={index}
            className="confetti"
            style={{
              left: `${(index * 17 + index * index) % 100}%`,
              animationDelay: `${(index % 16) * 0.06}s`,
              animationDuration: `${1800 + (index % 5) * 400}ms`
            }}
          />
        ))}
      </div>

      <div className="space-y-4">
        {/* Game over illustration */}
        <div className="overflow-hidden rounded-xl border-4 border-[#3A3A4A] shadow-panel-heavy">
          <img src="/images/game_over.png" alt="Victory celebration" className="phase-illustration w-full" loading="lazy" />
        </div>

        {/* Winner Banner */}
        <div className={`relative overflow-hidden rounded-xl border-4 border-[#3A3A4A] shadow-panel-heavy p-6 text-center ${
          playerWin
            ? "bg-emerald-500/20 text-emerald-100"
            : imposterWins
              ? "bg-red-500/20 text-red-100"
              : "bg-[#1A1A24] text-white"
        }`}>
          {/* Light rays behind winner */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute left-1/2 top-1/2 h-[200%] w-[200%] -translate-x-1/2 -translate-y-1/2 animate-spin" style={{ animationDuration: '12s', background: 'conic-gradient(from 0deg, transparent, rgba(255,255,255,0.3), transparent, rgba(255,255,255,0.3), transparent)' }} />
          </div>
          <div className="relative">
            <Crown className="crown-bob mx-auto h-16 w-16 text-[#F5A623] drop-shadow-[0_0_16px_rgba(245,166,35,0.5)]" />
            <p className="mt-3 text-4xl font-black font-display text-transparent bg-clip-text text-gradient-metal animate-glitch">{final?.winnerLabel || "Final scores"}</p>
            <p className="mt-2 text-sm font-black opacity-80 uppercase tracking-widest">Imposter: {final?.imposterName || "Unknown"}</p>
          </div>
        </div>

        {/* Scoreboard */}
        <HardwarePanel accent="gold">
          <div className="mb-3 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-[#F5A623]" />
            <p className="text-sm font-black font-display text-transparent bg-clip-text text-gradient-metal">Final scoreboard</p>
          </div>
          <div className="space-y-2">
            {sorted.map((player, index) => {
              const highlighted = topIds.has(player.id);
              return (
                <div
                  key={player.id}
                  className={`slide-in-right flex min-h-16 items-center gap-3 rounded-lg px-3 py-2 ring-1 transition-all ${
                    highlighted
                      ? "bg-[#F5A623]/20 ring-[#F5A623]/60 shadow-[0_0_28px_rgba(245,166,35,0.3)] border-l-4 border-l-[#F5A623]"
                      : "bg-[#15151D] ring-white/10"
                  }`}
                  style={{ animationDelay: `${index * 120}ms` }}
                >
                  <span className="w-7 text-center text-lg font-black">{medal(index)}</span>
                  <PlayerAvatar player={player} showRing={highlighted} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black">{player.name}</p>
                    {highlighted && (
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-[#F5A623] animate-pulse">
                        Winner
                      </p>
                    )}
                  </div>
                  <p className="text-xl font-black text-[#F5A623] font-display">
                    <AnimatedScore target={player.score} />
                  </p>
                </div>
              );
            })}
          </div>
        </HardwarePanel>

        {isHost ? (
          <Button
            onClick={actions.playAgain}
            className="btn-hardware flex w-full items-center justify-center gap-2 text-base"
          >
            <RotateCcw className="h-5 w-5" /> Play Again
          </Button>
        ) : (
          <HardwarePanel className="px-4 py-4 text-center text-sm font-black text-white/60">
            Waiting for host to play again...
          </HardwarePanel>
        )}
      </div>
    </Shell>
  );
}
