import { Crown, Skull } from "lucide-react";
import { forwardRef } from "react";

export function Button({ children, className = "", variant = "primary", ...props }) {
  const variants = {
    primary: "bg-[#F5A623] text-black shadow-[0_0_24px_rgba(245,166,35,0.22)] hover:shadow-[0_0_34px_rgba(245,166,35,0.42)]",
    outline: "border border-[#F5A623]/70 bg-transparent text-[#F5A623] hover:bg-[#F5A623]/10 hover:shadow-[0_0_26px_rgba(245,166,35,0.18)]",
    secondary: "border border-white/15 bg-white/8 text-white hover:bg-white/12 hover:shadow-[0_0_26px_rgba(155,89,182,0.22)]",
    danger: "bg-red-500 text-white shadow-[0_0_24px_rgba(239,68,68,0.25)] hover:shadow-[0_0_34px_rgba(239,68,68,0.42)]",
    ghost: "bg-transparent text-white/80 ring-1 ring-white/10 hover:bg-white/8"
  };

  return (
    <button
      className={`min-h-12 rounded-xl px-5 py-3 text-sm font-black transition duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export const TextInput = forwardRef(function TextInput({ className = "", ...props }, ref) {
  return (
    <input
      ref={ref}
      className={`min-h-12 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-base font-extrabold text-white outline-none transition placeholder:text-white/35 focus:border-[#F5A623] focus:shadow-[0_0_22px_rgba(245,166,35,0.2)] ${className}`}
      {...props}
    />
  );
});

export function GlassCard({ children, className = "" }) {
  return <div className={`glass-card rounded-2xl p-4 ${className}`}>{children}</div>;
}

export function Shell({ children, kicker, title, subtitle, room }) {
  return (
    <section className="flex flex-1 flex-col">
      <header className="pb-5 pt-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {kicker && <p className="text-xs font-black uppercase tracking-[0.18em] text-[#F5A623]">{kicker}</p>}
            <h1 className="mt-2 text-4xl font-black leading-none text-white">{title}</h1>
          </div>
          {room?.round && <RoundBadge round={room.round} />}
        </div>
        {subtitle && <p className="mt-3 text-sm font-semibold leading-6 text-white/65">{subtitle}</p>}
      </header>
      {children}
    </section>
  );
}

export function RoundBadge({ round }) {
  return (
    <div className="rounded-full border border-[#F5A623]/30 bg-[#F5A623]/10 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#F5A623]">
      Round {round}
    </div>
  );
}

export function PlayerAvatar({ player, size = "md" }) {
  const dimensions = size === "lg" ? "h-14 w-14 text-xl" : size === "sm" ? "h-9 w-9 text-xs" : "h-11 w-11 text-sm";
  return (
    <div className="relative shrink-0">
      <div
        className={`${dimensions} grid place-items-center rounded-full font-black text-black shadow-[0_0_18px_rgba(255,255,255,0.12)]`}
        style={{ backgroundColor: player?.avatarColor || "#F5A623" }}
      >
        {(player?.name || "?").slice(0, 1).toUpperCase()}
      </div>
      {player?.eliminated && (
        <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-red-500 text-white ring-2 ring-[#10081f]">
          <Skull className="h-3 w-3" />
        </span>
      )}
    </div>
  );
}

export function PlayerRow({ player, aside }) {
  return (
    <div className={`flex min-h-14 items-center gap-3 rounded-xl bg-white/6 px-3 py-2 ring-1 ring-white/10 ${player.eliminated ? "opacity-55" : ""}`}>
      <PlayerAvatar player={player} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black">{player.name}</p>
        <p className="text-xs font-bold text-white/45">{player.eliminated ? `Eliminated R${player.eliminatedRound}` : `${player.score} pts`}</p>
      </div>
      {player.isHost && <Crown className="h-5 w-5 text-[#F5A623]" aria-label="Host" />}
      {aside}
    </div>
  );
}

export function TimerBar({ seconds, duration }) {
  const total = duration || 1;
  const percentage = Math.max(0, Math.min(100, (seconds / total) * 100));
  const color = percentage > 55 ? "#22C55E" : percentage > 25 ? "#F5A623" : "#EF4444";

  return (
    <div className="glass-card overflow-hidden rounded-2xl p-2">
      <div className="relative h-14 overflow-hidden rounded-xl bg-black/30">
        <div
          className="absolute inset-y-0 left-0 rounded-xl transition-all duration-300"
          style={{ width: `${percentage}%`, background: color, boxShadow: `0 0 28px ${color}66` }}
        />
        <div className="absolute inset-0 grid place-items-center text-lg font-black tabular-nums text-white drop-shadow">
          {Math.max(0, seconds)}s
        </div>
      </div>
    </div>
  );
}

export function ClueList({ clues, players = [] }) {
  if (!clues?.length) {
    return <p className="glass-card rounded-2xl border-dashed p-4 text-center text-sm font-bold text-white/45">No clues yet.</p>;
  }

  return (
    <div className="space-y-2">
      {clues.map((entry, index) => {
        const player = players.find((item) => item.id === entry.playerId);
        return (
          <div key={`${entry.playerId}-${entry.clue}-${index}`} className="clue-swoosh flex items-center gap-3 rounded-xl bg-white/7 px-3 py-3 ring-1 ring-white/10">
            <PlayerAvatar player={player || { name: entry.playerName }} size="sm" />
            <span className="min-w-0 flex-1 truncate text-sm font-black text-white/75">{entry.playerName}</span>
            <span className="rounded-full bg-[#9B59B6]/25 px-3 py-1 text-sm font-black text-purple-100">{entry.clue}</span>
          </div>
        );
      })}
    </div>
  );
}
