/**
 * Shared Tailwind class recipes — keeps the JSX readable while every
 * style remains a Tailwind utility applied from the components.
 */
export const btn =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-semibold transition disabled:cursor-not-allowed disabled:opacity-50';
export const btnPrimary = `${btn} bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md hover:shadow-indigo-200`;
export const btnGhost = `${btn} border border-slate-200 bg-transparent text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700`;
export const btnOutline = `${btn} border border-indigo-600 bg-white text-indigo-600 hover:bg-indigo-50`;
export const btnDanger = `${btn} bg-red-600 text-white hover:bg-red-700`;

export const xs = 'rounded-md px-2.5 py-1 text-xs';
export const sm = 'px-3 py-1.5 text-sm';
export const md = 'px-4 py-2 text-sm';
export const lg = 'px-6 py-3 text-base';
export const block = 'mt-2.5 w-full';

export const input =
  'w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100';
export const label = 'text-sm font-semibold text-slate-700';
export const hint = 'text-xs text-slate-500';

export const card = 'rounded-2xl border border-slate-200 bg-white shadow-sm';
export const container = 'mx-auto w-full max-w-6xl px-5';

export const linkBtn = 'bg-transparent p-1 text-sm font-semibold text-indigo-600 hover:underline';

/** Role badge colours (Navbar, seller cards, user table) */
export const roleBadgeClass = (role) =>
  `${
    { admin: 'bg-amber-100 text-amber-800', sales: 'bg-blue-100 text-blue-800', user: 'bg-green-100 text-green-800' }[
      role
    ] || 'bg-slate-100 text-slate-700'
  } inline-block w-fit rounded-full px-2.5 py-0.5 text-xs font-bold`;

/** Stock pill colours */
export const stockPillClass = (stock) =>
  `${
    stock <= 0
      ? 'bg-red-100 text-red-700'
      : stock <= 5
        ? 'bg-amber-100 text-amber-700'
        : 'bg-green-100 text-green-700'
  } inline-block min-w-[34px] rounded-full px-2.5 py-0.5 text-center text-xs font-bold`;
