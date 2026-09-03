const pageBtn =
  'h-9 min-w-[38px] rounded-lg border border-slate-200 bg-white px-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-400 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40';

export default function Pagination({ page, pages, onChange }) {
  if (!pages || pages <= 1) return null;

  const window_ = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(pages, start + 4);
  for (let i = start; i <= end; i++) window_.push(i);

  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-1.5" aria-label="Pagination">
      <button className={pageBtn} onClick={() => onChange(page - 1)} disabled={page <= 1}>← Prev</button>
      {start > 1 && (
        <>
          <button className={pageBtn} onClick={() => onChange(1)}>1</button>
          {start > 2 && <span className="px-1 text-sm text-slate-500">…</span>}
        </>
      )}
      {window_.map((p) => (
        <button
          key={p}
          className={`${pageBtn} ${p === page ? '!border-indigo-600 !bg-indigo-600 !text-white' : ''}`}
          onClick={() => onChange(p)}
        >
          {p}
        </button>
      ))}
      {end < pages && (
        <>
          {end < pages - 1 && <span className="px-1 text-sm text-slate-500">…</span>}
          <button className={pageBtn} onClick={() => onChange(pages)}>{pages}</button>
        </>
      )}
      <button className={pageBtn} onClick={() => onChange(page + 1)} disabled={page >= pages}>Next →</button>
    </nav>
  );
}
