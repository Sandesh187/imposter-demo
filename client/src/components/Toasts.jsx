export function Toasts({ toasts }) {
  return (
    <div className="fixed left-0 right-0 top-3 z-50 mx-auto flex w-full max-w-md flex-col gap-2 px-4">
      {toasts.map((toast) => (
        <div key={toast.id} className="toast rounded-lg bg-slate-950/90 px-4 py-3 text-sm font-black text-white shadow-xl ring-1 ring-white/10">
          {toast.message}
        </div>
      ))}
    </div>
  );
}
