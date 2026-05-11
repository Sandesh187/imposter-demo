import { Vote } from "lucide-react";
import { useMemo, useState } from "react";
import { Button, GlassCard, PlayerAvatar, Shell, TimerBar } from "./ui";
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
      <div className="space-y-4">
        <TimerBar seconds={seconds} duration={room.timer?.duration} />
        <GlassCard>
          <div className="flex items-center justify-between">
            <p className="text-sm font-black">Votes cast</p>
            <p className="text-lg font-black text-[#F5A623]">{room.voteTotal}/{activePlayers.length}</p>
          </div>
        </GlassCard>

        <div className="space-y-3">
          {activePlayers.map((player) => (
            <button
              key={player.id}
              disabled={hasVoted || isEliminated}
              onClick={() => setSelected(player.id)}
              className={`flex min-h-20 w-full items-center gap-4 rounded-2xl px-4 py-3 text-left transition disabled:opacity-55 ${
                selected === player.id
                  ? "border border-red-300 bg-red-500/15 shadow-[0_0_34px_rgba(239,68,68,0.32)]"
                  : "glass-card hover:border-white/20"
              }`}
            >
              <PlayerAvatar player={player} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xl font-black">{player.name}</p>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/42">{player.id === playerId ? "You" : "Remaining player"}</p>
              </div>
              {selected === player.id && <Vote className="h-6 w-6 text-red-300" />}
            </button>
          ))}
        </div>

        <Button disabled={!selected || hasVoted || isEliminated} onClick={submitVote} variant="danger" className="w-full text-base">
          Cast My Vote 🗳️
        </Button>
        {isEliminated && <p className="text-center text-sm font-bold text-white/45">You are eliminated. Watch the vote unfold.</p>}
      </div>
    </Shell>
  );
}
