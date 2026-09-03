import { Link } from 'react-router-dom';
import { btnPrimary, md } from '../utils/ui';

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-2xl px-5 pb-14 pt-7 text-center">
      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white px-7 py-14">
        <div className="mb-2.5 text-5xl">🧭</div>
        <h1 className="text-4xl font-extrabold text-slate-900">404</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">The page you're looking for doesn't exist or has been moved.</p>
        <div className="mt-5">
          <Link to="/" className={`${btnPrimary} ${md}`}>Back to shop</Link>
        </div>
      </div>
    </div>
  );
}
