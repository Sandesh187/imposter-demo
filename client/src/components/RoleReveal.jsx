import { EyeOff, Fingerprint, Shield, Skull } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, HardwarePanel, Shell } from "./ui";

export function RoleReveal({ game }) {
  const { room, myRole, actions } = game;
  const [revealing, setRevealing] = useState(false);
  const [shuffling, setShuffling] = useState(true);
  const [flipped, setFlipped] = useState(false);
  const activeCount = room.activePlayerIds?.length || room.players.length;
  const readyPct = activeCount ? (room.confirmedTotal / activeCount) * 100 : 0;
  const isImposter = myRole?.role === "imposter";
  const isEliminated = myRole?.role === "eliminated";

  // Shuffle animation on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setShuffling(false);
      setTimeout(() => setFlipped(true), 100);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Shell kicker="secret role" title={<span className="text-gradient-metal">Peek carefully</span>} subtitle={`${room.confirmedTotal}/${activeCount} players ready`} room={room}>
      {/* Background illustration */}
      <div className="crt-overlay pointer-events-none absolute inset-0 z-50 opacity-20" />
      <div className="vignette-mystery" />

      <div className="flex flex-1 flex-col justify-center gap-5">
        {/* Ready progress ring */}
        <HardwarePanel className="overflow-hidden rounded-full p-1">
          <div className="relative h-3 overflow-hidden rounded-full bg-black/60 shadow-inner">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-[#F5A623] transition-all duration-500"
              style={{ width: `${readyPct}%`, boxShadow: '0 0 16px rgba(245,166,35,0.6)' }}
            />
          </div>
        </HardwarePanel>

        {/* 3D Card Flip Container */}
        <div className="card-3d-container mx-auto w-full max-w-sm">
          <HardwarePanel
            onPointerDown={() => setRevealing(true)}
            onPointerUp={() => setRevealing(false)}
            onPointerCancel={() => setRevealing(false)}
            onPointerLeave={() => setRevealing(false)}
            className={`cursor-pointer rounded-xl p-6 text-center ring-1 transition-all duration-500 overflow-hidden ${
              shuffling ? "card-shuffle" : ""
            } ${
              isImposter
                ? "bg-red-950/40 ring-red-500/50 shadow-[0_0_42px_rgba(239,68,68,0.3)]"
                : isEliminated
                  ? "bg-[#1A1A24] ring-white/10"
                  : "bg-emerald-950/40 ring-emerald-500/50 shadow-[0_0_42px_rgba(34,197,94,0.2)]"
            }`}
          >
            {/* Role illustration backdrop */}
            <div className="absolute inset-0 m-2 border-4 border-[#3A3A4A] rounded-xl shadow-panel-heavy overflow-hidden opacity-30 pointer-events-none">
              <img
                src="/images/role_reveal.png"
                alt=""
                className="h-full w-full object-cover"
                aria-hidden="true"
              />
            </div>

            <div className="relative z-10">
              {/* Icon */}
              <div
                className={`mx-auto grid h-24 w-24 place-items-center rounded-full border-4 border-[#2A2A35] ${
                  isImposter
                    ? "bg-red-600 shadow-[0_0_32px_rgba(239,68,68,0.5)] stamp-slam"
                    : isEliminated
                      ? "bg-zinc-800 shadow-inner"
                      : "bg-emerald-600 shadow-[0_0_32px_rgba(34,197,94,0.4)] stamp-slam"
                } text-black transition-all duration-500`}
              >
                {isImposter ? (
                  <EyeOff className="h-12 w-12 text-red-100" />
                ) : isEliminated ? (
                  <Skull className="h-12 w-12 text-zinc-400" />
                ) : (
                  <Shield className="h-12 w-12 text-emerald-100" />
                )}
              </div>

              {!myRole && (
                <p className="mt-6 text-2xl font-black font-display text-gradient-metal animate-pulse">Receiving role...</p>
              )}

              {isEliminated && (
                <>
                  <p className="mt-6 text-2xl font-black text-zinc-400 font-display stamp-slam">You are out</p>
                  <p className="mt-3 text-sm font-bold leading-6 text-zinc-500">
                    Watch the remaining players try to survive.
                  </p>
                </>
              )}

              {isImposter && (
                <div className={`transition-all duration-300 ${revealing ? "blur-0 scale-100" : "blur-md scale-95 select-none"}`}>
                  <p className="mt-6 text-2xl font-black text-red-500 font-display animate-glitch">
                    You are the IMPOSTER 🕵️
                  </p>
                  <p className="mt-3 text-sm font-bold leading-6 text-red-200/70">
                    You don't know the topic. Blend in.
                  </p>
                </div>
              )}

              {myRole?.role === "player" && (
                <>
                  <p className="mt-6 text-sm font-black uppercase tracking-[0.16em] text-emerald-400/80">
                    The topic is
                  </p>
                  <p
                    className={`mt-2 text-5xl font-black font-display text-gradient-metal transition-all duration-300 ${
                      revealing ? "blur-0 scale-100 stamp-slam" : "blur-md scale-95 select-none"
                    }`}
                  >
                    {myRole.topic}
                  </p>
                </>
              )}

              {/* Hold-to-peek fingerprint indicator */}
              {!isEliminated && (
                <div className="mt-5 flex flex-col items-center gap-2">
                  <Fingerprint className={`h-8 w-8 transition-all duration-200 ${revealing ? "text-[#F5A623] scale-110 drop-shadow-[0_0_12px_rgba(245,166,35,0.8)]" : "text-white/30"}`} />
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-white/45">
                    {revealing ? "peeking..." : "hold to reveal"}
                  </p>
                </div>
              )}
            </div>
          </HardwarePanel>
        </div>

        <Button
          disabled={!myRole || isEliminated}
          onClick={actions.confirmRole}
          className="w-full btn-hardware mt-4"
          variant={isImposter ? "danger" : "success"}
        >
          <span className="font-black tracking-widest uppercase">I read my role</span>
        </Button>
        {isEliminated && (
          <p className="text-center text-sm font-bold text-zinc-500">
            Waiting for the next phase...
          </p>
        )}
      </div>
    </Shell>
  );
}
