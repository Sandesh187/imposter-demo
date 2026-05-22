import { AlertTriangle, Clock3, MessageCircle } from "lucide-react";
import { ClueList, HardwarePanel, Shell, TimerBar } from "./ui";
import { useCountdown } from "./useCountdown";

export function Discussion({ game }) {
  const { room } = game;
  const seconds = useCountdown(room.timer);
  const activePlayers = room.players.filter((player) => room.activePlayerIds?.includes(player.id));
  const duration = room.timer?.duration || 1;
  const percentage = Math.max(0, (seconds / duration) * 100);
  const isAlmostOver = percentage < 22;

  return (
    <Shell kicker="discussion" title="Time to discuss!" subtitle="Talk out loud with your group. Who seems sus?" room={room}>
      <div className="space-y-4">
        <TimerBar seconds={seconds} duration={duration} />

        {/* Phase illustration */}
        <div className="overflow-hidden rounded-xl border-4 border-[#3A3A4A] shadow-panel-heavy">
          <img src="/images/discussion.png" alt="Discussion table" className="w-full h-auto mix-blend-luminosity hover:mix-blend-normal transition-all" loading="lazy" />
        </div>

        {/* Discussion prompt */}
        <HardwarePanel accent="purple" className="relative overflow-hidden">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#9B59B6]/20 blur-xl" />
          <div className="relative flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#9B59B6] text-white shadow-[0_0_28px_rgba(155,89,182,0.34)]">
              <MessageCircle className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Clock3 className="h-5 w-5 text-[#F5A623]" />
                <p className="text-xl font-black font-display text-gradient-metal">Open discussion</p>
              </div>
              <p className="mt-1 text-sm font-semibold text-white/55">
                Use the clue trail. Trust nobody too fast.
              </p>
            </div>
          </div>
        </HardwarePanel>

        {/* Suspicion Meter */}
        <HardwarePanel>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-white/45 font-display">
              <AlertTriangle className="mr-1 inline h-3 w-3 text-[#F5A623]" />
              Suspicion Level
            </p>
            <p className={`text-xs font-black ${isAlmostOver ? "text-red-500 animate-glitch" : "text-[#F5A623]"}`}>
              {isAlmostOver ? "VOTING SOON" : "BUILDING..."}
            </p>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-[#0A0A0F] shadow-inner-hole border border-black/50">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${100 - percentage}%`,
                background: `linear-gradient(90deg, #22C55E, #F5A623, #EF4444)`,
                boxShadow: isAlmostOver ? '0 0 16px rgba(239,68,68,0.4)' : 'none'
              }}
            />
          </div>
        </HardwarePanel>

        <ClueList clues={room.clues} players={activePlayers} />
      </div>
    </Shell>
  );
}
