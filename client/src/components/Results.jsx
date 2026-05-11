import { Flag, RotateCcw, ShieldAlert, UserX } from "lucide-react";
import { Button, ClueList, GlassCard, PlayerAvatar, Shell } from "./ui";

export function Results({ game }) {
  const { room, playerId, actions } = game;
  const isHost = room.hostId === playerId;
  const results = room.results;
  const eliminated = room.players.find((player) => player.id === results?.eliminatedId);
  const tiedVote = Boolean(results?.tiedVote);
  const remainingCount = results?.remainingCount ?? room.activePlayerIds?.length ?? room.players.length;

  return (
    <Shell kicker="elimination" title={`Round ${room.round} complete`} subtitle={`${remainingCount} players remain`} room={room}>
      <div className="space-y-4">
        <GlassCard className="relative overflow-hidden p-6 text-center">
          <div className="absolute left-1/2 top-0 h-28 w-28 -translate-x-1/2 rounded-full bg-[#F5A623]/20 blur-2xl" />
          <div className="relative">
            <div className={`mx-auto grid h-20 w-20 place-items-center rounded-full ${tiedVote ? "bg-[#9B59B6]" : "bg-red-500"} text-white shadow-[0_0_34px_rgba(239,68,68,0.24)]`}>
              {tiedVote ? <ShieldAlert className="h-10 w-10" /> : <UserX className="h-10 w-10" />}
            </div>

            {tiedVote ? (
              <>
                <p className="mt-5 text-3xl font-black">Vote tied</p>
                <p className="mt-2 text-sm font-bold leading-6 text-white/62">No one was eliminated this round. The table survives to vote again.</p>
              </>
            ) : (
              <>
                <p className="mt-5 text-sm font-black uppercase tracking-[0.16em] text-white/45">Eliminated</p>
                <div className="mt-3 flex items-center justify-center gap-3">
                  {eliminated && <PlayerAvatar player={eliminated} size="lg" />}
                  <p className="text-4xl font-black">{eliminated?.name || results?.eliminatedName || "Unknown"}</p>
                </div>
                <p className="mt-4 rounded-full bg-emerald-400/15 px-4 py-2 text-sm font-black text-emerald-200">
                  They were not the imposter.
                </p>
              </>
            )}

            <p className="mt-4 text-sm font-black">
              Topic was <span className="rounded-full bg-black/55 px-3 py-1 text-[#F5A623]">{results?.topic}</span>
            </p>
          </div>
        </GlassCard>

        <ClueList clues={room.clues} players={room.players} />

        {isHost ? (
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={actions.playAgain} className="flex items-center justify-center gap-2">
              <RotateCcw className="h-5 w-5" /> Next Round
            </Button>
            <Button onClick={actions.endGame} variant="secondary" className="flex items-center justify-center gap-2">
              <Flag className="h-5 w-5" /> End Game
            </Button>
          </div>
        ) : (
          <p className="glass-card rounded-2xl px-4 py-4 text-center text-sm font-black text-white/60">Waiting for host to start the next round...</p>
        )}
      </div>
    </Shell>
  );
}
