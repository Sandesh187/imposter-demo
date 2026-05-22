import { Flag, RotateCcw, ShieldAlert, ShieldCheck, UserX } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, ClueList, HardwarePanel, PlayerAvatar, Shell } from "./ui";

export function Results({ game }) {
  const { room, playerId, actions } = game;
  const isHost = room.hostId === playerId;
  const results = room.results;
  const eliminated = room.players.find((player) => player.id === results?.eliminatedId);
  const tiedVote = Boolean(results?.tiedVote);
  const remainingCount = results?.remainingCount ?? room.activePlayerIds?.length ?? room.players.length;

  // Cinematic reveal sequence
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 400),
      setTimeout(() => setStage(2), 1000),
      setTimeout(() => setStage(3), 1600),
      setTimeout(() => setStage(4), 2200)
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <Shell kicker="elimination" title={`Round ${room.round} complete`} subtitle={`${remainingCount} players remain`} room={room}>
      <div className="space-y-4">
        {/* Cinematic reveal card */}
        <HardwarePanel className="relative overflow-hidden p-6 text-center">
          <div className="absolute left-1/2 top-0 h-28 w-28 -translate-x-1/2 rounded-full bg-[#F5A623]/20 blur-2xl" />

          {/* Stage 1: "THE VOTES ARE IN" slam */}
          {stage >= 1 && stage < 3 && (
            <p className="stamp-slam font-display text-3xl font-black text-transparent bg-clip-text text-gradient-metal uppercase tracking-widest mb-4">
              The votes are in
            </p>
          )}

          {/* Stage 2: Avatar reveal */}
          <div className={`relative transition-all duration-500 ${stage >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
            <div className={`mx-auto grid h-20 w-20 place-items-center rounded-full ${
              tiedVote ? "bg-[#9B59B6]" : "bg-red-500"
            } text-white shadow-[0_0_34px_rgba(239,68,68,0.24)]`}>
              {tiedVote ? <ShieldAlert className="h-10 w-10" /> : <UserX className="h-10 w-10" />}
            </div>

            {tiedVote ? (
              <>
                <p className="mt-5 text-3xl font-black font-display text-transparent bg-clip-text text-gradient-metal animate-glitch">Vote tied</p>
                <p className="mt-2 text-sm font-bold leading-6 text-white/62">
                  No one was eliminated this round. The table survives to vote again.
                </p>
              </>
            ) : (
              <>
                <p className="mt-5 text-sm font-black uppercase tracking-[0.16em] text-white/45">Eliminated</p>
                <div className="mt-3 flex items-center justify-center gap-3">
                  {eliminated && <PlayerAvatar player={eliminated} size="lg" />}
                  <p className="text-4xl font-black font-display text-transparent bg-clip-text text-gradient-metal">{eliminated?.name || results?.eliminatedName || "Unknown"}</p>
                </div>

                {/* Stage 3: Verdict stamp */}
                {stage >= 3 && (
                  <div className={`mt-4 stamp-slam inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-black ${
                    results?.wasImposter
                      ? "bg-emerald-400/20 text-emerald-200 shadow-[0_0_20px_rgba(34,197,94,0.2)] border-2 border-emerald-500/30"
                      : "bg-red-400/15 text-red-200 border-2 border-red-500/30"
                  }`}>
                    {results?.wasImposter ? (
                      <><ShieldCheck className="h-4 w-4" /> IMPOSTER CAUGHT!</>
                    ) : (
                      <>They were not the imposter.</>  
                    )}
                  </div>
                )}
              </>
            )}

            {/* Stage 4: Topic reveal */}
            {stage >= 4 && (
              <p className="mt-4 text-sm font-black fade-in text-white/80">
                Topic was{" "}
                <span className="rounded-sm bg-[#1A1A24] px-3 py-1 text-[#F5A623] font-display border border-[#3A3A4A]">
                  {results?.topic}
                </span>
              </p>
            )}
          </div>
        </HardwarePanel>

        {/* Results illustration */}
        {stage >= 4 && (
          <div className="overflow-hidden rounded-xl border-4 border-[#3A3A4A] shadow-panel-heavy fade-in">
            <img src="/images/results.png" alt="" className="phase-illustration-sm w-full" loading="lazy" />
          </div>
        )}

        <ClueList clues={room.clues} players={room.players} />

        {isHost ? (
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={actions.playAgain} className="flex items-center justify-center gap-2 btn-hardware">
              <RotateCcw className="h-5 w-5" /> Next Round
            </Button>
            <Button onClick={actions.endGame} variant="secondary" className="flex items-center justify-center gap-2 btn-hardware">
              <Flag className="h-5 w-5" /> End Game
            </Button>
          </div>
        ) : (
          <HardwarePanel className="px-4 py-4 text-center text-sm font-black text-white/60">
            Waiting for host to start the next round...
          </HardwarePanel>
        )}
      </div>
    </Shell>
  );
}
