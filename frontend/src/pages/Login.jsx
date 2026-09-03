import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast, errMsg } from '../context/ToastContext';
import { btnPrimary, input, label, lg, block } from '../utils/ui';

const DEMO_ACCOUNTS = [
  { role: 'Admin', email: 'admin@example.com', password: 'Admin@123', icon: '🛡️' },
  { role: 'Sales Person', email: 'sales@example.com', password: 'Sales@123', icon: '💼' },
  { role: 'Customer', email: 'user@example.com', password: 'User@123', icon: '🧑‍💻' },
];

export default function Login() {
  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  // Real reason for the bounce to /login (set by the axios 401 interceptor)
  const [notice, setNotice] = useState('');

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('shopkart_auth_notice');
      if (stored) {
        setNotice(stored);
        sessionStorage.removeItem('shopkart_auth_notice');
      }
    } catch { /* ignore */ }
  }, []);

  const from = location.state?.from || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const user = await login(email, password);
      success(`Welcome back, ${user.name}!`);
      if (from !== '/') navigate(from, { replace: true });
      else if (user.role === 'admin') navigate('/admin', { replace: true });
      else if (user.role === 'sales') navigate('/my-products', { replace: true });
      else navigate('/', { replace: true });
    } catch (err) {
      error(errMsg(err, 'Login failed'));
    } finally {
      setBusy(false);
    }
  };

  const fill = (acct) => {
    setEmail(acct.email);
    setPassword(acct.password);
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-5 pb-14 pt-7">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <h1 className="text-2xl font-extrabold text-slate-900">Welcome back 👋</h1>
        <p className="mb-5 mt-0.5 text-sm text-slate-500">Log in to your ShopKart account</p>
        {notice && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm font-semibold text-amber-700">
            {notice}
          </div>
        )}
        {!notice && params.get('expired') && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm font-semibold text-amber-700">
            Your session expired. Please log in again.
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className={label}>Email</label>
            <input id="email" type="email" required autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className={label}>Password</label>
            <div className="relative">
              <input id="password" type={showPw ? 'text' : 'password'} required autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className={`${input} pr-11`} />
              <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-base" onClick={() => setShowPw((s) => !s)} aria-label="Toggle password visibility">
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          <button className={`${btnPrimary} ${lg} ${block}`} disabled={busy}>
            {busy ? 'Logging in…' : 'Login'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          New here? <Link to="/register" className="font-semibold text-indigo-600 hover:underline">Create an account</Link>
        </p>

        <div className="mt-5 border-t border-dashed border-slate-200 pt-4">
          <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-slate-500">Demo accounts (click to fill)</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {DEMO_ACCOUNTS.map((a) => (
              <button
                key={a.email}
                type="button"
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-left transition hover:border-indigo-400 hover:bg-indigo-50"
                onClick={() => fill(a)}
                title={`${a.email} / ${a.password}`}
              >
                <span className="text-lg">{a.icon}</span>
                <span>
                  <strong className="block text-xs text-slate-900">{a.role}</strong>
                  <small className="break-all text-[10px] text-slate-500">{a.email}</small>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
