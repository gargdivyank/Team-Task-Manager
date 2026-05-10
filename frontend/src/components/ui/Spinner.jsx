export default function Spinner({ label = 'Loading' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-sm text-slate-400">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-600 border-t-brand-500" />
      {label && <span>{label}</span>}
    </div>
  );
}
