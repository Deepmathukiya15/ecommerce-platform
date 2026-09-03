export default function Loader({ full = false, label = 'Loading…' }) {
  return (
    <div
      className={`flex items-center justify-center gap-3 text-slate-500 ${full ? 'flex-col py-24' : 'py-12'}`}
      role="status"
      aria-live="polite"
    >
      <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-slate-200 border-t-indigo-600" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
