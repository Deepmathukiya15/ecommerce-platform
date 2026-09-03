import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';

/**
 * Route guard:
 *  - `requireAuth`  → user must be logged in
 *  - `roles`        → additionally, the user's role must be in the list
 * Redirects to /login (remembering the intended page) or shows a 403 card.
 */
export default function ProtectedRoute({ children, roles = null }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loader full label="Checking your session…" />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="mx-auto w-full max-w-2xl px-5 pb-14 pt-7 text-center">
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white px-7 py-14">
          <div className="mb-2.5 text-5xl">🚫</div>
          <h2 className="text-xl font-bold text-slate-900">403 — Access denied</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Your role (<strong>{user.role}</strong>) does not have permission to view this page.
            This restriction is enforced by the backend, not just the UI.
          </p>
        </div>
      </div>
    );
  }

  return children;
}
