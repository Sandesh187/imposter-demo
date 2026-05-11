import { Copy, Link, Play } from "lucide-react";
import { Button, GlassCard, PlayerRow, Shell } from "./ui";

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

  return (
    <Shell kicker="lobby" title="Invite players" subtitle="Share the code, pick a category, then let the suspicion begin." room={room}>
      <div className="space-y-4">
        <button onClick={copyCode} className="w-full rounded-3xl bg-[#F5A623] px-5 py-6 text-left text-black shadow-[0_0_40px_rgba(245,166,35,0.3)] transition hover:shadow-[0_0_52px_rgba(245,166,35,0.44)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] opacity-70">Room code</p>
              <p className="mt-1 text-6xl font-black tracking-[0.16em]">{room.code}</p>
            </div>
            <Copy className="h-8 w-8" />
          </div>
        </button>

        <Button onClick={copyLink} variant="outline" className="flex w-full items-center justify-center gap-2">
          <Link className="h-5 w-5" /> Copy link
        </Button>

        <GlassCard>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-black">Players</p>
            <p className="text-xs font-black text-white/45">{room.players.length}/{room.maxPlayers}</p>
          </div>
          {room.players.length < room.minPlayers && (
            <p className="waiting-pulse mb-3 rounded-xl bg-[#9B59B6]/15 px-3 py-2 text-center text-sm font-black text-purple-100">
              waiting for players...
            </p>
          )}
          <div className="space-y-2">
            {room.players.map((player) => (
              <PlayerRow key={player.id} player={player} />
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <p className="mb-3 text-sm font-black">Category</p>
          <div className="grid grid-cols-3 gap-2">
            {room.categories.map((category) => (
              <Button key={category} disabled={!isHost} variant={room.category === category ? "primary" : "secondary"} onClick={() => actions.setCategory(category)} className="px-2">
                {category}
              </Button>
            ))}
          </div>
        </GlassCard>

        {isHost ? (
          <Button disabled={!canStart} onClick={actions.startGame} className="flex w-full items-center justify-center gap-2 text-base">
            <Play className="h-5 w-5" />
            🎉 Start Game
          </Button>
        ) : (
          <p className="glass-card rounded-2xl px-4 py-4 text-center text-sm font-black text-white/60">Waiting for host...</p>
        )}
      </div>
    </Shell>
  );
}
