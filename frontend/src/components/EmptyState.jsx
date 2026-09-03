import { Link } from 'react-router-dom';
import { btnPrimary, md } from '../utils/ui';

export default function EmptyState({ icon = '📦', title, message, actionLabel, actionTo, onAction }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white px-7 py-14 text-center text-slate-700">
      <div className="mb-2.5 text-5xl">{icon}</div>
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      {message && <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-500">{message}</p>}
      <div className="mt-5">
        {actionTo && (
          <Link to={actionTo} className={`${btnPrimary} ${md}`}>{actionLabel || 'Continue'}</Link>
        )}
        {!actionTo && onAction && (
          <button className={`${btnPrimary} ${md}`} onClick={onAction}>{actionLabel || 'Continue'}</button>
        )}
      </div>
    </div>
  );
}
