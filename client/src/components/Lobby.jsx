import { Copy, Link, Lock, Play, Unlock } from "lucide-react";
import { Button, HardwarePanel, PlayerRow, Shell } from "./ui";

const CATEGORY_EMOJIS = {
  Movies: "🎬", Food: "🍕", Sports: "⚽", Music: "🎵", Animals: "🐾",
  Countries: "🌍", Brands: "🏷️", Celebrities: "⭐", Science: "🔬",
  Custom: "✨", General: "🎲", Nature: "🌿", Technology: "💻"
};

export function Lobby({ game }) {
  const { room, playerId, actions, addToast } = game;
  const isHost = room.hostId === playerId;
  const canStart = room.players.length >= room.minPlayers;

  async function copyCode() {
    await navigator.clipboard?.writeText(room.code);
    addToast("Room code copied.");
  }

  async function copyLink() {
    const url = `${window.location.origin}${window.location.pathname}?room=${room.code}`;
    await navigator.clipboard?.writeText(url);
    addToast("Join link copied.");
  }

  const playerRatio = room.players.length / room.maxPlayers;

  return (
    <Shell kicker="lobby" title="Invite players" subtitle="Share the code, pick a category, then let the suspicion begin." room={room}>
      <div className="space-y-4">
        {/* Lobby illustration */}
        <div className="overflow-hidden rounded-xl border-4 border-[#3A3A4A] shadow-panel-heavy">
          <img src="/images/lobby.png" alt="Spy hideout lounge" className="phase-illustration w-full" loading="lazy" />
        </div>

        {/* Room code banner */}
        <button
          onClick={copyCode}
          className="w-full rounded-2xl bg-[#F5A623] px-5 py-5 text-left text-black shadow-hardware-btn transition btn-hardware hover:bg-[#FFD700] ring-1 ring-[#FFE177]"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] opacity-80">Room code</p>
              <p className="mt-1 text-5xl font-black tracking-[0.16em] font-display text-gradient-metal animate-glitch stamp-slam">{room.code}</p>
            </div>
            <Copy className="h-7 w-7" />
          </div>
        </button>

        <Button onClick={copyLink} variant="outline" className="flex w-full items-center justify-center gap-2">
          <Link className="h-5 w-5" /> Copy join link
        </Button>

        {/* Players Card */}
        <HardwarePanel accent="purple">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-black font-display text-gradient-metal">Players</p>
            <div className="flex items-center gap-2">
              <div className="h-2 w-16 overflow-hidden rounded-full bg-white/10 shadow-inner-hole">
                <div
                  className="h-full rounded-full bg-[#9B59B6] transition-all duration-500"
                  style={{ width: `${playerRatio * 100}%`, boxShadow: '0 0 10px #9B59B6' }}
                />
              </div>
              <p className="text-xs font-black text-white/60">{room.players.length}/{room.maxPlayers}</p>
            </div>
          </div>
          {room.players.length < room.minPlayers && (
            <p className="waiting-pulse mb-3 rounded-xl bg-[#0A0A0F] border-t border-black border-b border-[#9B59B6]/30 px-3 py-2 text-center text-sm font-black text-[#9B59B6] shadow-inner-hole">
              <span className="inline-flex gap-1">
                <span className="animate-bounce" style={{ animationDelay: '0ms' }}>·</span>
                <span className="animate-bounce" style={{ animationDelay: '150ms' }}>·</span>
                <span className="animate-bounce" style={{ animationDelay: '300ms' }}>·</span>
              </span>
              {' '}waiting for players
            </p>
          )}
          <div className="space-y-2">
            {[...room.players]
              .sort((a, b) => b.score - a.score)
              .map((player, index) => (
                <PlayerRow key={player.id} player={player} staggerIndex={index} />
              ))}
          </div>
        </HardwarePanel>

        {/* Category Card */}
        <HardwarePanel accent="gold">
          <p className="mb-3 text-sm font-black font-display text-gradient-metal">Category</p>
          <div className="grid grid-cols-3 gap-2">
            {room.categories.map((category) => (
              <Button
                key={category}
                disabled={!isHost}
                variant={room.category === category ? "primary" : "secondary"}
                onClick={() => actions.setCategory(category)}
                className={`px-1 py-2 text-xs flex flex-col items-center justify-center gap-1 ${room.category === category ? "shadow-[0_0_15px_rgba(245,166,35,0.4)]" : ""}`}
              >
                <span className="text-lg">{CATEGORY_EMOJIS[category] || "🎲"}</span>
                <span className="truncate w-full text-center">{category}</span>
              </Button>
            ))}
          </div>
          {room.category === "Custom" && (
            <div className="mt-4 pt-4 border-t border-[#3A3A4A]">
              <p className="mb-2 text-xs font-black text-white/60">
                Custom Topics ({room.customTopics?.length || 0})
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="customTopicInput"
                  placeholder="Enter a custom word"
                  disabled={!isHost}
                  maxLength={30}
                  className="w-full rounded-xl bg-[#0A0A0F] border-t border-black border-b border-white/10 px-4 py-3 text-sm font-bold text-[#F5A623] shadow-inner-hole placeholder-[#F5A623]/30 outline-none transition focus:bg-[#111118] focus:shadow-[inset_0_4px_8px_rgba(0,0,0,0.9),_0_0_20px_rgba(245,166,35,0.15)]"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.target.value.trim()) {
                      actions.addCustomTopic(e.target.value.trim());
                      e.target.value = "";
                    }
                  }}
                />
                {isHost && (
                  <Button
                    onClick={() => {
                      const input = document.getElementById("customTopicInput");
                      if (input.value.trim()) {
                        actions.addCustomTopic(input.value.trim());
                        input.value = "";
                      }
                    }}
                    variant="primary"
                    className="px-4"
                  >
                    Add
                  </Button>
                )}
              </div>
            </div>
          )}
        </HardwarePanel>

        {/* Start / Waiting */}
        {isHost ? (
          <Button
            disabled={!canStart}
            onClick={actions.startGame}
            className={`flex w-full items-center justify-center gap-2 text-lg uppercase tracking-wider stamp-slam ${canStart ? "animate-pulse shadow-[0_0_30px_rgba(245,166,35,0.6)]" : "opacity-50"}`}
          >
            <Play className="h-6 w-6" />
            {canStart ? "Start Game" : <><Lock className="h-5 w-5" /> Need players</>}
          </Button>
        ) : (
          <div className="hardware-panel rounded-2xl px-4 py-4 text-center text-sm font-black text-[#A0A0B0] shadow-inner-hole flex items-center justify-center gap-2">
            <Lock className="h-4 w-4" /> Waiting for host...
          </div>
        )}
      </div>
    </Shell>
  );
}
