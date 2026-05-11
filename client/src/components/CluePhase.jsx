import { Send } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button, ClueList, GlassCard, PlayerAvatar, Shell, TextInput, TimerBar } from "./ui";
import { useCountdown } from "./useCountdown";

export function CluePhase({ game }) {
  const { room, playerId, actions } = game;
  const [clue, setClue] = useState("");
  const inputRef = useRef(null);
  const seconds = useCountdown(room.timer);
  const activePlayers = room.players.filter((player) => room.activePlayerIds?.includes(player.id));
  const currentPlayer = useMemo(() => room.players.find((player) => player.id === room.currentTurnId), [room.currentTurnId, room.players]);
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
    <Shell kicker="clue phase" title={isMyTurn ? "Your turn" : "Listen close"} subtitle="One word. No speeches. No second chances." room={room}>
      <div className="space-y-4">
        <TimerBar seconds={seconds} duration={room.timer?.duration} />

        <GlassCard className={`${isMyTurn ? "border-[#F5A623]/50 shadow-[0_0_36px_rgba(245,166,35,0.22)]" : ""}`}>
          <div className="flex items-center gap-3">
            {currentPlayer && <PlayerAvatar player={currentPlayer} size="lg" />}
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-white/45">Current clue giver</p>
              <p className="text-2xl font-black">{currentPlayer?.name || "Waiting"}</p>
            </div>
          </div>
        </GlassCard>

        <form onSubmit={submit} className="glass-card rounded-2xl p-3">
          <label className="text-xs font-black uppercase tracking-[0.14em] text-white/45">Your one-word clue</label>
          <div className="mt-2 flex gap-2">
            <TextInput
              ref={inputRef}
              value={clue}
              disabled={!isMyTurn || gaveClue}
              onChange={(event) => setClue(event.target.value.replace(/\s/g, "").slice(0, 18))}
              placeholder={isMyTurn ? "Clue" : "Wait for your turn..."}
              className={`min-w-0 flex-1 ${isMyTurn ? "border-[#F5A623] shadow-[0_0_24px_rgba(245,166,35,0.22)]" : "opacity-55"}`}
            />
            <Button disabled={!isMyTurn || gaveClue || !clue.trim()} className="grid aspect-square place-items-center px-0" aria-label="Submit clue">
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </form>

        <ClueList clues={room.clues} players={activePlayers} />
      </div>
    </Shell>
  );
}
