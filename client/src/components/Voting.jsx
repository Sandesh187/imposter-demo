import { Crosshair, Lock, Vote } from "lucide-react";
import { useMemo, useState } from "react";
import { Button, HardwarePanel, PlayerAvatar, Shell, TimerBar } from "./ui";
import { useCountdown } from "./useCountdown";

export function Voting({ game }) {
  const { room, playerId, actions } = game;
  const [selected, setSelected] = useState("");
  const seconds = useCountdown(room.timer);
  const activePlayers = room.players.filter((player) => room.activePlayerIds?.includes(player.id));
  const hasVoted = useMemo(() => room.votedPlayerIds?.includes(playerId), [playerId, room.votedPlayerIds]);
  const isEliminated = !room.activePlayerIds?.includes(playerId);

  async function submitVote() {
    await actions.submitVote(selected);
  }

  return (
    <Shell kicker="voting" title="Who is the imposter?" subtitle="Vote count is live. Identities stay hidden until reveal." room={room}>
      {/* Red danger vignette */}
      <div className="vignette-danger" />

      <div className="space-y-4 relative z-10">
        <TimerBar seconds={seconds} duration={room.timer?.duration} />

        {/* Phase illustration */}
        <div className="overflow-hidden rounded-xl border-4 border-[#3A3A4A] shadow-panel-heavy">
          <img src="/images/voting.png" alt="" className="w-full h-auto mix-blend-luminosity hover:mix-blend-normal transition-all" loading="lazy" />
        </div>

        {/* Vote counter */}
        <HardwarePanel accent="red">
          <div className="flex items-center justify-between">
            <p className="text-sm font-black font-display text-gradient-metal">Votes cast</p>
            <p className="text-lg font-black text-[#F5A623] animate-pulse">
              {room.voteTotal}/{activePlayers.length}
            </p>
          </div>
        </HardwarePanel>

        {/* Suspect Cards (Mugshot style) */}
        <div className="space-y-3">
          {activePlayers.map((player) => {
            const isSelected = selected === player.id;
            return (
              <button
                key={player.id}
                disabled={hasVoted || isEliminated}
                onClick={() => setSelected(player.id)}
                className={`flex min-h-20 w-full items-center gap-4 rounded-xl px-4 py-3 text-left transition-all disabled:opacity-55 ${
                  isSelected
                    ? "mugshot-card selected"
                    : "mugshot-card hover:-translate-y-1 hover:shadow-lg"
                }`}
              >
                <PlayerAvatar player={player} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xl font-black font-display">{player.name}</p>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/42">
                    {player.id === playerId ? "You" : "Suspect"}
                  </p>
                </div>
                {isSelected && !hasVoted && (
                  <Crosshair className="h-6 w-6 text-red-400 animate-pulse" />
                )}
                {hasVoted && isSelected && (
                  <div className="stamp-slam flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-1 border border-red-500/50">
                    <Lock className="h-4 w-4 text-red-400" />
                    <span className="text-xs font-black text-red-400">LOCKED</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <Button
          disabled={!selected || hasVoted || isEliminated}
          onClick={submitVote}
          variant="danger"
          className="w-full text-base"
        >
          Cast My Vote 🗳️
        </Button>
        {isEliminated && (
          <p className="text-center text-sm font-bold text-white/45">
            You are eliminated. Watch the vote unfold.
          </p>
        )}
      </div>
    </Shell>
  );
}
