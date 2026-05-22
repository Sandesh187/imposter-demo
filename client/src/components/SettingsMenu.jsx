import { LogOut, Music, Settings, Volume2, X } from "lucide-react";
import { Button, HardwarePanel } from "./ui";

function ToggleRow({ icon, label, enabled, onToggle }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-black/30 p-3 ring-1 ring-white/10">
      <div className="flex min-w-0 items-center gap-3">
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${enabled ? "bg-[#F5A623] text-black" : "bg-[#1A1A24] text-white/45"}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black text-white">{label}</p>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/40">
            {enabled ? "On" : "Off"}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={`relative h-8 w-16 rounded-full p-1 transition-all duration-200 ${
          enabled ? "bg-[#F5A623] shadow-[0_0_16px_rgba(245,166,35,0.35)]" : "bg-white/10"
        }`}
        aria-pressed={enabled}
        aria-label={`Turn ${label.toLowerCase()} ${enabled ? "off" : "on"}`}
      >
        <span
          className={`block h-6 w-6 rounded-full bg-white shadow-lg transition-transform duration-200 ${
            enabled ? "translate-x-8" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

export function SettingsMenu({
  open,
  onClose,
  preferences,
  onTogglePreference,
  canExit,
  onExitGame
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/65 px-4 pb-4 backdrop-blur-sm sm:items-center sm:pb-0">
      <HardwarePanel className="w-full max-w-md rounded-2xl p-4 shadow-[0_0_40px_rgba(155,89,182,0.25)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#9B59B6] text-white shadow-[0_0_18px_rgba(155,89,182,0.5)]">
              <Settings className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-black text-white">Settings</h2>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/40">Game controls</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-white/70 ring-1 ring-white/10 transition hover:bg-white/15 hover:text-white"
            aria-label="Close settings"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-3">
          <ToggleRow
            icon={<Music className="h-5 w-5" />}
            label="Music"
            enabled={preferences.music}
            onToggle={() => onTogglePreference("music")}
          />
          <ToggleRow
            icon={<Volume2 className="h-5 w-5" />}
            label="Sound"
            enabled={preferences.sound}
            onToggle={() => onTogglePreference("sound")}
          />
        </div>

        <Button
          onClick={onExitGame}
          disabled={!canExit}
          variant="danger"
          className="mt-5 flex w-full items-center justify-center gap-2"
        >
          <LogOut className="h-5 w-5" />
          Exit Game
        </Button>
      </HardwarePanel>
    </div>
  );
}
