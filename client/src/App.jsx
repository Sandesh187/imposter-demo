import { useEffect, useRef, useState, useCallback } from "react";
import { Home } from "./components/Home";
import { Lobby } from "./components/Lobby";
import { RoleReveal } from "./components/RoleReveal";
import { CluePhase } from "./components/CluePhase";
import { Discussion } from "./components/Discussion";
import { Voting } from "./components/Voting";
import { Results } from "./components/Results";
import { FinalGameOver } from "./components/FinalGameOver";
import { SettingsMenu } from "./components/SettingsMenu";
import { Toasts } from "./components/Toasts";
import { FloatingParticles, PhaseTransition, ConnectionIndicator } from "./components/ui";
import { useGame } from "./hooks/useGame";
import { Settings } from "lucide-react";

function loadPreferences() {
  try {
    return JSON.parse(localStorage.getItem("fakeit_preferences")) || { music: true, sound: true };
  } catch {
    return { music: true, sound: true };
  }
}

export default function App() {
  const game = useGame();
  const { room } = game;
  const actualPhase = room?.phase || "home";
  const [viewPhase, setViewPhase] = useState(actualPhase);
  const [showTransition, setShowTransition] = useState(false);
  const [transitionPhase, setTransitionPhase] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [preferences, setPreferences] = useState(loadPreferences);
  const lastHistoryPhase = useRef(null);
  const roomRef = useRef(room);
  const actionsRef = useRef(game.actions);
  const prevPhaseRef = useRef(actualPhase);

  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  useEffect(() => {
    actionsRef.current = game.actions;
  }, [game.actions]);

  // Phase transition animation
  useEffect(() => {
    if (actualPhase !== prevPhaseRef.current && actualPhase !== "home") {
      setTransitionPhase(actualPhase);
      setShowTransition(true);
    }
    prevPhaseRef.current = actualPhase;
  }, [actualPhase]);

  const handleTransitionComplete = useCallback(() => {
    setShowTransition(false);
    setTransitionPhase(null);
  }, []);

  const togglePreference = useCallback(
    (key) => {
      setPreferences((current) => {
        const next = { ...current, [key]: !current[key] };
        localStorage.setItem("fakeit_preferences", JSON.stringify(next));
        game.addToast(`${key === "music" ? "Music" : "Sound"} ${next[key] ? "on" : "off"}.`);
        return next;
      });
    },
    [game]
  );

  const exitGame = useCallback(async () => {
    await game.actions.leaveRoom();
    setSettingsOpen(false);
    setViewPhase("home");
    window.history.pushState({ fakeIt: true, phase: "home" }, "", window.location.href);
    lastHistoryPhase.current = "home";
  }, [game.actions]);

  const copyInvite = useCallback(async () => {
    if (!room?.code) return;
    const url = `${window.location.origin}${window.location.pathname}?room=${room.code}`;
    await navigator.clipboard?.writeText(url);
    game.addToast("Join link copied.");
  }, [game, room?.code]);

  const restartRoom = useCallback(async () => {
    await game.actions.newGame();
    setSettingsOpen(false);
  }, [game.actions]);

  const kickDisconnected = useCallback(
    async (targetId) => {
      await game.actions.kickDisconnectedPlayer(targetId);
    },
    [game.actions]
  );

  useEffect(() => {
    const state = { fakeIt: true, phase: actualPhase };
    setViewPhase(actualPhase);

    if (!window.history.state?.fakeIt) {
      window.history.replaceState(state, "", window.location.href);
      lastHistoryPhase.current = actualPhase;
      return;
    }

    if (lastHistoryPhase.current === actualPhase) {
      return;
    }

    if (actualPhase === "clue" && lastHistoryPhase.current === "role") {
      window.history.replaceState(state, "", window.location.href);
    } else {
      window.history.pushState(state, "", window.location.href);
    }
    lastHistoryPhase.current = actualPhase;
  }, [actualPhase]);

  useEffect(() => {
    function handlePopState(event) {
      const phase = event.state?.fakeIt ? event.state.phase : "home";
      setViewPhase(phase);
      lastHistoryPhase.current = phase;
      if (phase === "home" && roomRef.current) {
        actionsRef.current.leaveRoom();
      }
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const visibleRoom = room && viewPhase !== "home" ? { ...room, phase: viewPhase } : room;
  const visibleGame = visibleRoom === room ? game : { ...game, room: visibleRoom };

  return (
    <main className="animated-bg min-h-screen text-white">
      {/* CRT overlay for heavy spy monitor vibe */}
      <div className="crt-overlay" />

      {/* Floating particles background */}
      <FloatingParticles />

      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-5" style={{ zIndex: 1 }}>
        {(!visibleRoom || viewPhase === "home") && <Home actions={game.actions} />}
        {visibleRoom?.phase === "lobby" && <Lobby game={visibleGame} />}
        {visibleRoom?.phase === "role" && <RoleReveal game={visibleGame} />}
        {visibleRoom?.phase === "clue" && <CluePhase game={visibleGame} />}
        {visibleRoom?.phase === "discussion" && <Discussion game={visibleGame} />}
        {visibleRoom?.phase === "voting" && <Voting game={visibleGame} />}
        {visibleRoom?.phase === "results" && <Results game={visibleGame} />}
        {visibleRoom?.phase === "final" && <FinalGameOver game={visibleGame} />}
      </div>

      <button
        type="button"
        onClick={() => setSettingsOpen(true)}
        className="fixed bottom-4 left-4 z-50 grid h-12 w-12 place-items-center rounded-xl bg-[#1A1A24]/95 text-[#F5A623] shadow-hardware-btn ring-1 ring-white/10 backdrop-blur transition hover:bg-[#2A2A35]"
        aria-label="Open settings"
      >
        <Settings className="h-6 w-6" />
      </button>

      <SettingsMenu
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        preferences={preferences}
        onTogglePreference={togglePreference}
        canExit={Boolean(room)}
        onExitGame={exitGame}
        room={room}
        playerId={game.playerId}
        onCopyInvite={copyInvite}
        onRestartRoom={restartRoom}
        onKickDisconnected={kickDisconnected}
      />

      {/* Phase transition overlay */}
      {showTransition && transitionPhase && (
        <PhaseTransition phase={transitionPhase} onComplete={handleTransitionComplete} />
      )}

      {/* Toast notifications */}
      <Toasts toasts={game.toasts} />

      {/* Connection indicator */}
      <ConnectionIndicator connected={game.connected} />
    </main>
  );
}
