import { Crown, Skull } from "lucide-react";
import { forwardRef, useEffect, useMemo, useRef, useState } from "react";

/* ═══════════════════════════════════════════
   BUTTON — Physical Arcade / Hardware Switch
   ═══════════════════════════════════════════ */
export function Button({ children, className = "", variant = "primary", ...props }) {
  const variants = {
    primary:
      "bg-[#F5A623] text-black shadow-hardware-btn hover:bg-[#FFD700] ring-1 ring-[#FFE177]",
    outline:
      "bg-[#2A2A35] text-[#F5A623] shadow-hardware-btn border border-[#F5A623] hover:bg-[#3A3A4A] ring-1 ring-black/50",
    secondary:
      "bg-[#1A1A24] text-white shadow-hardware-btn border-t border-white/10 hover:bg-[#2A2A35]",
    danger:
      "bg-[#EF4444] text-white shadow-hardware-btn hover:bg-[#FF6B6B] ring-1 ring-[#FF8A8A]",
    success:
      "bg-[#22C55E] text-white shadow-hardware-btn hover:bg-[#4ADE80] ring-1 ring-[#86EFAC]",
    ghost:
      "bg-transparent text-white/80 ring-1 ring-white/10 hover:bg-white/8 shadow-none"
  };

  return (
    <button
      className={`btn-hardware min-h-12 rounded-xl px-5 py-3 text-sm font-black disabled:cursor-not-allowed disabled:opacity-45 disabled:transform-none disabled:shadow-none ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

/* ═══════════════════════════
   TEXT INPUT — Engraved Slot
   ═══════════════════════════ */
export const TextInput = forwardRef(function TextInput({ className = "", ...props }, ref) {
  return (
    <div className="relative">
      <input
        ref={ref}
        className={`min-h-12 w-full rounded-xl bg-[#0A0A0F] border-t border-black border-b border-white/10 px-4 py-3 text-base font-extrabold text-[#F5A623] shadow-inner-hole outline-none transition-all duration-200 placeholder:text-white/30 focus:bg-[#111118] focus:shadow-[inset_0_4px_8px_rgba(0,0,0,0.9),_0_0_20px_rgba(245,166,35,0.15)] ${className}`}
        {...props}
      />
    </div>
  );
});

/* ═══════════════════════════
   HARDWARE PANEL
   ═══════════════════════════ */
export function HardwarePanel({ children, className = "", accent }) {
  const accentClasses = {
    gold: "panel-accent-gold",
    purple: "panel-accent-purple",
    red: "panel-accent-red",
    emerald: "panel-accent-emerald"
  };

  return (
    <div className={`hardware-panel rounded-2xl p-5 slide-in-up ${accentClasses[accent] || ""} ${className}`}>
      {children}
    </div>
  );
}

/* ═══════════════════════════
   SHELL — Phase headers
   ═══════════════════════════ */
export function Shell({ children, kicker, title, subtitle, room }) {
  const phaseColors = {
    lobby: "text-[#F5A623]",
    clue: "text-[#9B59B6]",
    discussion: "text-[#9B59B6]",
    voting: "text-[#EF4444]",
    results: "text-[#22C55E]",
    final: "text-[#F5A623]",
    role: "text-[#9B59B6]"
  };

  const kickerColor = phaseColors[kicker?.toLowerCase()] || phaseColors[room?.phase] || "text-[#F5A623]";

  return (
    <section className="flex flex-1 flex-col fade-in">
      <header className="pb-5 pt-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {kicker && (
              <p className={`text-xs font-black uppercase tracking-[0.2em] ${kickerColor} text-shadow-sm`}>
                {kicker}
              </p>
            )}
            <h1 className="font-display mt-2 text-4xl font-black leading-none text-white text-shadow-md">
              {title}
            </h1>
          </div>
          {room?.round && <RoundBadge round={room.round} />}
        </div>
        {subtitle && (
          <p className="mt-3 text-sm font-semibold leading-6 text-white/50">{subtitle}</p>
        )}
      </header>
      {children}
    </section>
  );
}

/* ═══════════════════════════
   ROUND BADGE
   ═══════════════════════════ */
export function RoundBadge({ round }) {
  return (
    <div className="rounded-lg border-2 border-[#F5A623] bg-[#2A2A35] shadow-[0_4px_10px_rgba(0,0,0,0.5),_inset_0_1px_1px_rgba(255,255,255,0.2)] px-3 py-2 text-xs font-black uppercase tracking-[0.15em] text-[#F5A623]">
      Round {round}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PLAYER AVATAR — Metallic Bezel
   ═══════════════════════════════════════════════ */
export function PlayerAvatar({ player, size = "md", showRing = false }) {
  const dimensions =
    size === "lg"
      ? "h-16 w-16 text-2xl border-4"
      : size === "sm"
        ? "h-10 w-10 text-sm border-2"
        : "h-12 w-12 text-base border-2";

  const avatar = (
    <div
      className={`${dimensions} grid place-items-center rounded-full font-black text-black shadow-[inset_0_1px_4px_rgba(255,255,255,0.6),_0_4px_10px_rgba(0,0,0,0.5)] border-[#2A2A35] transition-transform duration-300`}
      style={{ backgroundColor: player?.avatarColor || "#F5A623" }}
    >
      {(player?.name || "?").slice(0, 1).toUpperCase()}
    </div>
  );

  return (
    <div className="relative shrink-0">
      {showRing ? <div className="avatar-ring">{avatar}</div> : avatar}
      {player?.eliminated && (
        <span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-red-600 border-2 border-[#111118] text-white shadow-lg">
          <Skull className="h-3 w-3" />
        </span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   PLAYER ROW — Dossier File Style
   ═══════════════════════════════════════ */
export function PlayerRow({ player, aside, staggerIndex = 0 }) {
  return (
    <div
      className={`slide-in-up flex min-h-16 items-center gap-3 rounded-xl bg-[#22222D] border-l-4 border-[#3A3A4A] shadow-[0_4px_6px_rgba(0,0,0,0.4)] px-3 py-2 transition-all duration-200 hover:bg-[#2A2A35] ${player.eliminated ? "opacity-40 grayscale border-[#111118]" : "border-[#F5A623]"}`}
      style={{ animationDelay: `${staggerIndex * 80}ms` }}
    >
      <PlayerAvatar player={player} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-black text-white text-shadow-sm">
          {player.name}
          {player.eliminated && <span className="ml-2 text-white/30 line-through">eliminated</span>}
        </p>
        <p className="text-xs font-bold text-[#A0A0B0]">
          {player.eliminated ? `Eliminated R${player.eliminatedRound}` : `${player.score} pts`}
        </p>
      </div>
      {player.isHost && (
        <Crown className="crown-bob h-5 w-5 text-[#F5A623] drop-shadow-[0_0_8px_rgba(245,166,35,0.6)]" aria-label="Host" />
      )}
      {aside}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   TIMER BAR — Physical Vacuum Tube / LED
   ═══════════════════════════════════════════════════ */
export function TimerBar({ seconds, duration }) {
  const total = duration || 1;
  const percentage = Math.max(0, Math.min(100, (seconds / total) * 100));
  const isUrgent = percentage < 25;
  const isCritical = percentage < 15;

  const color = percentage > 55 ? "#22C55E" : percentage > 25 ? "#F5A623" : "#EF4444";

  return (
    <div className="hardware-panel p-3 overflow-hidden">
      <div className="relative h-12 overflow-hidden rounded-lg bg-[#0A0A0F] shadow-inner-hole border border-black/50">
        {/* Metal grille overlay */}
        <div className="absolute inset-0 z-10" style={{ backgroundImage: "linear-gradient(90deg, transparent 4px, rgba(0,0,0,0.6) 4px, rgba(0,0,0,0.6) 6px)", backgroundSize: "6px 100%" }} />
        
        <div
          className={`absolute inset-y-0 left-0 transition-all duration-300 ${isUrgent ? "animate-pulse" : ""}`}
          style={{
            width: `${percentage}%`,
            background: color,
            boxShadow: `0 0 ${isCritical ? 40 : 20}px ${color}, inset 0 0 10px rgba(255,255,255,0.5)`
          }}
        />
        <div className={`absolute inset-0 z-20 grid place-items-center text-xl font-black tabular-nums text-white drop-shadow-[0_2px_4px_rgba(0,0,0,1)] ${isCritical ? "animate-ping text-red-500" : ""}`}>
          {Math.max(0, seconds)}s
        </div>
      </div>
      {isCritical && <div className="vignette-danger" />}
    </div>
  );
}

/* ═══════════════════════════════════════
   CLUE LIST
   ═══════════════════════════════════════ */
export function ClueList({ clues, players = [] }) {
  if (!clues?.length) {
    return (
      <div className="hardware-panel border-dashed border-[#55556A] p-4 text-center text-sm font-bold text-[#A0A0B0]">
        Awaiting intelligence...
      </div>
    );
  }

  return (
    <div className="relative space-y-3">
      <div className="absolute left-7 top-4 bottom-4 w-1 bg-[#2A2A35] shadow-inner-hole" />
      {clues.map((entry, index) => {
        const player = players.find((item) => item.id === entry.playerId);
        const isLatest = index === clues.length - 1;
        return (
          <div
            key={`${entry.playerId}-${entry.clue}-${index}`}
            className={`slide-in-up flex items-center gap-4 rounded-xl bg-[#1A1A24] border border-[#3A3A4A] p-3 shadow-md stagger-${Math.min(index + 1, 8)}`}
          >
            <PlayerAvatar player={player || { name: entry.playerName }} size="sm" />
            <span className="min-w-0 flex-1 truncate text-sm font-black text-white">
              {entry.playerName}
            </span>
            <span className={`rounded-md px-3 py-1.5 text-sm font-black border-2 ${
              isLatest
                ? "bg-[#2D1B36] border-[#9B59B6] text-[#D6BCFA] shadow-[0_0_15px_rgba(155,89,182,0.4)]"
                : "bg-[#1C1C24] border-[#3A3A4A] text-[#A0A0B0]"
            }`}>
              {entry.clue}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════
   FLOATING PARTICLES — Dust/Sparks
   ═══════════════════════════════════ */
export function FloatingParticles() {
  const particles = useMemo(() => {
    return Array.from({ length: 25 }, (_, i) => ({
      id: i,
      size: 1 + Math.random() * 3,
      left: Math.random() * 100,
      duration: 5 + Math.random() * 10,
      delay: Math.random() * 5,
      opacity: 0.2 + Math.random() * 0.5
    }));
  }, []);

  return (
    <div className="floating-particles">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-[#F5A623] blur-[1px]"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.left}%`,
            opacity: 0,
            animation: `particle-float ${p.duration}s linear infinite`,
            animationDelay: `${p.delay}s`,
            boxShadow: '0 0 4px #F5A623'
          }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════
   PHASE TRANSITION — Blast Doors
   ═══════════════════════════════════════ */
export function PhaseTransition({ phase, onComplete }) {
  const [visible, setVisible] = useState(true);

  const phaseLabels = {
    lobby: "ACCESS GRANTED",
    role: "DECRYPTING ROLE",
    clue: "INTERROGATION",
    discussion: "DEBATE",
    voting: "TRIBUNAL",
    results: "THE VERDICT",
    final: "MISSION COMPLETE"
  };

  const phaseColors = {
    lobby: "text-[#F5A623]",
    role: "text-[#9B59B6]",
    clue: "text-[#9B59B6]",
    discussion: "text-[#F5A623]",
    voting: "text-[#EF4444]",
    results: "text-[#22C55E]",
    final: "text-[#F5A623]"
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 1000); // slightly longer for the heavy door animation
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div className="phase-transition-overlay">
      <h2 className={`phase-title-slam font-display text-4xl sm:text-5xl font-black tracking-widest ${phaseColors[phase] || "text-white"}`}>
        {phaseLabels[phase] || phase?.toUpperCase()}
      </h2>
    </div>
  );
}

/* ═══════════════════════════════════════
   CONNECTION INDICATOR — Hardware LED
   ═══════════════════════════════════════ */
export function ConnectionIndicator({ connected }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-md bg-[#111118] border border-[#2A2A35] px-3 py-1.5 shadow-[0_4px_10px_rgba(0,0,0,0.8)]">
      <div className={`h-3 w-3 rounded-full border border-black ${connected ? "bg-[#22C55E] shadow-[0_0_10px_#22C55E,inset_0_1px_2px_rgba(255,255,255,0.6)]" : "bg-[#EF4444] shadow-[0_0_10px_#EF4444,inset_0_1px_2px_rgba(255,255,255,0.6)] animate-pulse"}`} />
      <span className="text-[10px] font-black tracking-wider text-[#A0A0B0]">{connected ? "SECURE" : "LOST"}</span>
    </div>
  );
}
