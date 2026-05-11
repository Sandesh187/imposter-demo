import { useState } from "react";
import { ChevronDown, HelpCircle, LogIn, PartyPopper, Sparkles } from "lucide-react";
import { Button, GlassCard, TextInput } from "./ui";

export function Home({ actions }) {
  const params = new URLSearchParams(window.location.search);
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState((params.get("room") || "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4));
  const [busy, setBusy] = useState(false);
  const [showHow, setShowHow] = useState(false);

  async function create() {
    setBusy(true);
    await actions.createRoom(name);
    setBusy(false);
  }

  async function join() {
    setBusy(true);
    await actions.joinRoom(roomCode, name);
    setBusy(false);
  }

  const canJoin = roomCode.trim().length === 4 && name.trim().length > 0;
  const canCreate = name.trim().length > 0;

  return (
    <section className="flex flex-1 flex-col">
      <header className="relative py-8 text-center">
        <div className="logo-glow absolute left-1/2 top-10 h-28 w-28 -translate-x-1/2 rounded-full bg-[#F5A623]/25 blur-2xl" />
        <p className="relative text-xs font-black uppercase tracking-[0.22em] text-[#F5A623]">mobile party game</p>
        <h1 className="relative mt-3 text-7xl font-black leading-none">FakeIt</h1>
        <p className="relative mx-auto mt-4 max-w-xs text-base font-extrabold leading-6 text-white/70">
          The party game where one friend is lying
        </p>
      </header>

      <div className="flex flex-1 flex-col gap-4">
        <GlassCard>
          <div className="mb-4 flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#9B59B6] text-white shadow-[0_0_24px_rgba(155,89,182,0.34)]">
              <PartyPopper className="h-8 w-8" />
            </div>
            <div>
              <p className="text-xl font-black">Create Room</p>
              <p className="text-sm font-semibold text-white/55">Start a new table of suspicion.</p>
            </div>
          </div>
          <label className="text-xs font-black uppercase tracking-[0.14em] text-white/45">Player name</label>
          <TextInput value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" maxLength={18} className="mt-2 w-full" />
          <Button disabled={!canCreate || busy} onClick={create} className="mt-4 flex w-full items-center justify-center gap-2">
            <Sparkles className="h-5 w-5" /> Create Room
          </Button>
        </GlassCard>

        <GlassCard>
          <div className="mb-4 flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-2xl border border-[#F5A623]/40 bg-[#F5A623]/10 text-[#F5A623]">
              <LogIn className="h-8 w-8" />
            </div>
            <div>
              <p className="text-xl font-black">Join Room</p>
              <p className="text-sm font-semibold text-white/55">Enter the code your host shared.</p>
            </div>
          </div>
          <label className="text-xs font-black uppercase tracking-[0.14em] text-white/45">Room code</label>
          <TextInput
            value={roomCode}
            onChange={(event) => setRoomCode(event.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4))}
            placeholder="ABCD"
            maxLength={4}
            className="mt-2 w-full text-center text-2xl tracking-[0.25em]"
          />
          <Button disabled={!canJoin || busy} onClick={join} variant="outline" className="mt-4 flex w-full items-center justify-center gap-2">
            <LogIn className="h-5 w-5" /> Join Room
          </Button>
        </GlassCard>

        <GlassCard className="mt-auto">
          <button onClick={() => setShowHow((value) => !value)} className="flex min-h-12 w-full items-center justify-between text-left">
            <span className="flex items-center gap-2 text-sm font-black">
              <HelpCircle className="h-5 w-5 text-[#F5A623]" /> How to play
            </span>
            <ChevronDown className={`h-5 w-5 transition ${showHow ? "rotate-180" : ""}`} />
          </button>
          {showHow && (
            <div className="mt-3 space-y-2 text-sm font-semibold leading-6 text-white/62">
              <p>Most players see a topic. One imposter does not.</p>
              <p>Give one-word clues, discuss out loud, then vote. Most votes gets eliminated.</p>
              <p>Catch the imposter before only two players remain.</p>
            </div>
          )}
        </GlassCard>
      </div>
    </section>
  );
}
