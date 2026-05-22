import { Send } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button, ClueList, HardwarePanel, PlayerAvatar, Shell, TextInput, TimerBar } from "./ui";
import { useCountdown } from "./useCountdown";

export function CluePhase({ game }) {
  const { room, playerId, actions } = game;
  const [clue, setClue] = useState("");
  const inputRef = useRef(null);
  const seconds = useCountdown(room.timer);
  const activePlayers = room.players.filter((player) => room.activePlayerIds?.includes(player.id));
  const currentPlayer = useMemo(
    () => room.players.find((player) => player.id === room.currentTurnId),
    [room.currentTurnId, room.players]
  );
  const isMyTurn = room.currentTurnId === playerId;
  const gaveClue = room.clues.some((entry) => entry.playerId === playerId);

  useEffect(() => {
    if (isMyTurn) {
      inputRef.current?.focus();
    }
  }, [isMyTurn]);

  async function submit(event) {
    event.preventDefault();
    const response = await actions.submitClue(clue);
    if (response.ok) {
      setClue("");
    }
  }

  return (
    <Shell kicker="clue phase" title={<span className="text-gradient-metal">{isMyTurn ? "Your turn" : "Listen close"}</span>} subtitle="One word. No speeches. No second chances." room={room}>
      <div className="space-y-4">
        <TimerBar seconds={seconds} duration={room.timer?.duration} />

        {/* Phase illustration watermark */}
        <div className="overflow-hidden rounded-xl border-4 border-[#3A3A4A] shadow-panel-heavy mt-4">
          <img src="/images/clue_phase.png" alt="" className="phase-illustration-sm w-full object-cover" loading="lazy" />
        </div>

        {/* Current clue giver spotlight */}
        <HardwarePanel
          accent={isMyTurn ? "gold" : undefined}
          className={`relative overflow-hidden p-4 ${
            isMyTurn ? "shadow-[0_0_36px_rgba(245,166,35,0.3)] ring-2 ring-[#F5A623]" : ""
          }`}
        >
          {isMyTurn && <div className="spotlight absolute inset-0 opacity-50" />}
          <div className="relative flex items-center gap-4 z-10">
            {currentPlayer && <PlayerAvatar player={currentPlayer} size="lg" showRing={isMyTurn} />}
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-white/50">
                {isMyTurn ? "⭐ Your spotlight" : "Current clue giver"}
              </p>
              <p className={`text-2xl font-black font-display ${isMyTurn ? "text-[#F5A623] animate-pulse" : "text-zinc-200"}`}>
                {currentPlayer?.name || "Waiting"}
              </p>
            </div>
          </div>
        </HardwarePanel>

        {/* Clue Input */}
        <form onSubmit={submit} className="hardware-panel rounded-xl p-3 bg-[#2A2A35] border-2 border-[#3A3A4A] shadow-panel-heavy">
          <label className="text-xs font-black uppercase tracking-[0.14em] text-zinc-400">
            Your one-word clue
          </label>
          <div className="mt-2 flex gap-2">
            <TextInput
              ref={inputRef}
              value={clue}
              disabled={!isMyTurn || gaveClue}
              onChange={(event) => setClue(event.target.value.replace(/\s/g, "").slice(0, 18))}
              placeholder={isMyTurn ? "Type your clue..." : "Wait for your turn..."}
              className={`min-w-0 flex-1 ${
                isMyTurn
                  ? "border-[#F5A623] shadow-[0_0_24px_rgba(245,166,35,0.22)]"
                  : "opacity-55"
              }`}
            />
            <Button
              disabled={!isMyTurn || gaveClue || !clue.trim()}
              className="grid aspect-square place-items-center px-0 btn-hardware"
              aria-label="Submit clue"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </form>

        <ClueList clues={room.clues} players={activePlayers} />
      </div>
    </Shell>
  );
}
