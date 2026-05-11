import { EyeOff, Shield, Skull } from "lucide-react";
import { useState } from "react";
import { Button, GlassCard, Shell } from "./ui";

export function RoleReveal({ game }) {
  const { room, myRole, actions } = game;
  const [revealing, setRevealing] = useState(false);
  const activeCount = room.activePlayerIds?.length || room.players.length;
  const readyPct = activeCount ? (room.confirmedTotal / activeCount) * 100 : 0;
  const isImposter = myRole?.role === "imposter";
  const isEliminated = myRole?.role === "eliminated";

  return (
    <Shell kicker="secret role" title="Peek carefully" subtitle={`${room.confirmedTotal}/${activeCount} players ready`} room={room}>
      <div className="flex flex-1 flex-col justify-center gap-5">
        <div className="glass-card h-3 overflow-hidden rounded-full">
          <div className="h-full rounded-full bg-[#F5A623] transition-all" style={{ width: `${readyPct}%` }} />
        </div>

        <div
          onPointerDown={() => setRevealing(true)}
          onPointerUp={() => setRevealing(false)}
          onPointerCancel={() => setRevealing(false)}
          onPointerLeave={() => setRevealing(false)}
          className={`role-card rounded-3xl p-6 text-center ring-1 ${
            isImposter
              ? "bg-red-500/12 ring-red-300/30 shadow-[0_0_42px_rgba(239,68,68,0.22)]"
              : isEliminated
                ? "bg-white/5 ring-white/10"
                : "bg-emerald-400/12 ring-emerald-200/30 shadow-[0_0_42px_rgba(34,197,94,0.18)]"
          }`}
        >
          <div className={`mx-auto grid h-24 w-24 place-items-center rounded-full ${isImposter ? "bg-red-500" : isEliminated ? "bg-white/15" : "bg-emerald-400"} text-black`}>
            {isImposter ? <EyeOff className="h-12 w-12" /> : isEliminated ? <Skull className="h-12 w-12 text-white" /> : <Shield className="h-12 w-12" />}
          </div>

          {!myRole && <p className="mt-6 text-2xl font-black">Receiving role...</p>}

          {isEliminated && (
            <>
              <p className="mt-6 text-2xl font-black text-white/80">You are out</p>
              <p className="mt-3 text-sm font-bold leading-6 text-white/55">Watch the remaining players try to survive.</p>
            </>
          )}

          {isImposter && (
            <div className={revealing ? "" : "blur-md select-none"}>
              <p className="mt-6 text-2xl font-black text-red-300">You are the IMPOSTER 🕵️</p>
              <p className="mt-3 text-sm font-bold leading-6 text-white/70">You don't know the topic. Blend in.</p>
            </div>
          )}

          {myRole?.role === "player" && (
            <>
              <p className="mt-6 text-sm font-black uppercase tracking-[0.16em] text-emerald-200">The topic is</p>
              <p className={`mt-2 text-5xl font-black transition ${revealing ? "blur-0" : "blur-md select-none"}`}>{myRole.topic}</p>
            </>
          )}

          {!isEliminated && <p className="mt-5 text-xs font-black uppercase tracking-[0.14em] text-white/45">tap and hold to reveal</p>}
        </div>

        <Button disabled={!myRole || isEliminated} onClick={actions.confirmRole} className="w-full">
          I read my role
        </Button>
        {isEliminated && <p className="text-center text-sm font-bold text-white/45">Waiting for the next phase...</p>}
      </div>
    </Shell>
  );
}
