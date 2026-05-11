import { Clock3, MessageCircle } from "lucide-react";
import { ClueList, GlassCard, Shell, TimerBar } from "./ui";
import { useCountdown } from "./useCountdown";

export function Discussion({ game }) {
  const { room } = game;
  const seconds = useCountdown(room.timer);
  const activePlayers = room.players.filter((player) => room.activePlayerIds?.includes(player.id));

  return (
    <Shell kicker="discussion" title="Time to discuss!" subtitle="Talk out loud with your group. Who seems sus?" room={room}>
      <div className="space-y-4">
        <TimerBar seconds={seconds} duration={room.timer?.duration} />
        <GlassCard className="relative overflow-hidden">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#9B59B6]/20 blur-xl" />
          <div className="relative flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#9B59B6] text-white shadow-[0_0_28px_rgba(155,89,182,0.34)]">
              <MessageCircle className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Clock3 className="h-5 w-5 text-[#F5A623]" />
                <p className="text-xl font-black">Open discussion</p>
              </div>
              <p className="mt-1 text-sm font-semibold text-white/55">Use the clue trail. Trust nobody too fast.</p>
            </div>
          </div>
        </GlassCard>
        <ClueList clues={room.clues} players={activePlayers} />
      </div>
    </Shell>
  );
}
