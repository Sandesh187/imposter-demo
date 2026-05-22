import { CheckCircle, AlertTriangle, Users, Vote } from "lucide-react";

function getToastMeta(message) {
  if (message.includes("joined")) return { icon: <Users className="h-4 w-4 text-emerald-400" />, accent: "border-l-emerald-400" };
  if (message.includes("left") || message.includes("disconnected")) return { icon: <Users className="h-4 w-4 text-amber-400" />, accent: "border-l-amber-400" };
  if (message.includes("vote") || message.includes("locked")) return { icon: <Vote className="h-4 w-4 text-red-400" />, accent: "border-l-red-400" };
  if (message.includes("copied")) return { icon: <CheckCircle className="h-4 w-4 text-emerald-400" />, accent: "border-l-emerald-400" };
  return { icon: <AlertTriangle className="h-4 w-4 text-[#F5A623]" />, accent: "border-l-[#F5A623]" };
}

export function Toasts({ toasts }) {
  return (
    <div className="fixed left-0 right-0 top-3 z-50 mx-auto flex w-full max-w-md flex-col gap-2 px-4">
      {toasts.map((toast) => {
        const { icon, accent } = getToastMeta(toast.message);
        return (
          <div
            key={toast.id}
            className={`toast flex items-center gap-3 rounded-lg border-l-[3px] bg-slate-950/90 px-4 py-3 text-sm font-black text-white shadow-xl ring-1 ring-white/10 backdrop-blur-sm ${accent}`}
          >
            {icon}
            <span className="flex-1">{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
}
