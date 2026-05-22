import { useState } from "react";
import { ChevronDown, HelpCircle, LogIn, PartyPopper, Sparkles, Eye, MessageSquare, Vote } from "lucide-react";
import { Button, HardwarePanel, TextInput } from "./ui";

export function Home({ actions }) {
  const params = new URLSearchParams(window.location.search);
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState(
    (params.get("room") || "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4)
  );
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
      {/* Hero Header */}
      <header className="relative py-6 text-center">
        <div className="logo-glow absolute left-1/2 top-8 h-32 w-32 -translate-x-1/2 rounded-full bg-[#F5A623]/20 blur-3xl" />
        <p className="relative text-xs font-black uppercase tracking-[0.22em] text-[#F5A623] font-display">
          mobile party game
        </p>
        <h1 className="relative mt-3 text-7xl font-black leading-none text-gradient-metal font-display animate-glitch">
          FakeIt
        </h1>
        <p className="relative mx-auto mt-3 max-w-xs text-sm font-semibold leading-6 text-white/60">
          The party game where one friend is lying
        </p>
      </header>

      {/* Hero Illustration */}
      <div className="mb-4 overflow-hidden rounded-xl border-4 border-[#3A3A4A] shadow-panel-heavy">
        <img
          src="/images/hero.png"
          alt="FakeIt - The imposter party game"
          className="phase-illustration w-full"
          loading="lazy"
        />
      </div>

      <div className="flex flex-1 flex-col gap-4">
        {/* Create Room Card */}
        <HardwarePanel accent="purple">
          <div className="mb-4 flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#9B59B6] text-white shadow-[0_0_24px_rgba(155,89,182,0.34)]">
              <PartyPopper className="h-8 w-8" />
            </div>
            <div>
              <p className="text-xl font-black font-display text-gradient-metal">Create Room</p>
              <p className="text-sm font-semibold text-white/55">Start a new table of suspicion.</p>
            </div>
          </div>
          <label className="text-xs font-black uppercase tracking-[0.14em] text-white/45">
            Player name
          </label>
          <TextInput
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your name"
            maxLength={18}
            className="mt-2 w-full"
          />
          <Button
            disabled={!canCreate || busy}
            onClick={create}
            className="mt-4 flex w-full items-center justify-center gap-2"
          >
            <Sparkles className="h-5 w-5" /> Create Room
          </Button>
        </HardwarePanel>

        {/* Join Room Card */}
        <HardwarePanel accent="gold">
          <div className="mb-4 flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-2xl border border-[#F5A623]/40 bg-[#F5A623]/10 text-[#F5A623]">
              <LogIn className="h-8 w-8" />
            </div>
            <div>
              <p className="text-xl font-black font-display text-gradient-metal">Join Room</p>
              <p className="text-sm font-semibold text-white/55">Enter the code your host shared.</p>
            </div>
          </div>
          <label className="text-xs font-black uppercase tracking-[0.14em] text-white/45">
            Room code
          </label>
          <TextInput
            value={roomCode}
            onChange={(event) =>
              setRoomCode(
                event.target.value
                  .toUpperCase()
                  .replace(/[^A-Z]/g, "")
                  .slice(0, 4)
              )
            }
            placeholder="ABCD"
            maxLength={4}
            className="mt-2 w-full text-center text-2xl tracking-[0.25em]"
          />
          <Button
            disabled={!canJoin || busy}
            onClick={join}
            variant="outline"
            className="mt-4 flex w-full items-center justify-center gap-2"
          >
            <LogIn className="h-5 w-5" /> Join Room
          </Button>
        </HardwarePanel>

        {/* How to Play Card */}
        <HardwarePanel className="mt-auto">
          <button
            onClick={() => setShowHow((value) => !value)}
            className="flex min-h-12 w-full items-center justify-between text-left"
          >
            <span className="flex items-center gap-2 text-sm font-black font-display text-gradient-metal">
              <HelpCircle className="h-5 w-5 text-[#F5A623]" /> How to play
            </span>
            <ChevronDown className={`h-5 w-5 transition duration-300 ${showHow ? "rotate-180" : ""}`} />
          </button>
          {showHow && (
            <div className="mt-4 space-y-3">
              <div className="flex items-start gap-3 rounded-xl bg-[#0A0A0F] border-t border-black border-b border-white/10 p-3 shadow-inner-hole">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#9B59B6]/20 text-[#9B59B6]">
                  <Eye className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-white/90">1. Get your role</p>
                  <p className="text-xs font-semibold text-white/50">Most players see a topic. One imposter does not.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl bg-[#0A0A0F] border-t border-black border-b border-white/10 p-3 shadow-inner-hole">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#F5A623]/20 text-[#F5A623]">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-white/90">2. Give clues & discuss</p>
                  <p className="text-xs font-semibold text-white/50">One-word clues, then debate who seems sus.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl bg-[#0A0A0F] border-t border-black border-b border-white/10 p-3 shadow-inner-hole">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#EF4444]/20 text-[#EF4444]">
                  <Vote className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-white/90">3. Vote to eliminate</p>
                  <p className="text-xs font-semibold text-white/50">Catch the imposter before only two remain.</p>
                </div>
              </div>
            </div>
          )}
        </HardwarePanel>
      </div>

      {/* Version badge */}
      <p className="mt-4 text-center text-[10px] font-bold text-white/25">v1.0</p>
    </section>
  );
}
