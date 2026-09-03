import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast, errMsg } from '../context/ToastContext';
import { btnPrimary, input, label, lg, block, hint } from '../utils/ui';

export default function Register() {
  const { register } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', role: 'user' });
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return error('Passwords do not match');
    if (form.password.length < 6) return error('Password must be at least 6 characters');
    setBusy(true);
    try {
      const user = await register({ name: form.name, email: form.email, password: form.password, role: form.role });
      success(`Account created — welcome, ${user.name}!`);
      navigate(user.role === 'sales' ? '/my-products' : '/', { replace: true });
    } catch (err) {
      error(errMsg(err, 'Registration failed'));
    } finally {
      setBusy(false);
    }
  };

  const roleOption = (selected) =>
    `flex cursor-pointer items-center gap-2.5 rounded-xl border bg-white p-3 transition ${
      selected ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300'
    }`;

  return (
    <div className="mx-auto w-full max-w-2xl px-5 pb-14 pt-7">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <h1 className="text-2xl font-extrabold text-slate-900">Create account 🚀</h1>
        <p className="mb-5 mt-0.5 text-sm text-slate-500">Join ShopKart as a customer or a seller</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className={label}>Full name</label>
            <input id="name" type="text" required maxLength={60} placeholder="e.g. Priya Sharma" value={form.name} onChange={set('name')} className={input} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className={label}>Email</label>
            <input id="email" type="email" required autoComplete="email" placeholder="you@example.com" value={form.email} onChange={set('email')} className={input} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className={label}>Password</label>
              <input id="password" type="password" required minLength={6} autoComplete="new-password" placeholder="Min 6 characters" value={form.password} onChange={set('password')} className={input} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirm" className={label}>Confirm password</label>
              <input id="confirm" type="password" required autoComplete="new-password" placeholder="Repeat password" value={form.confirm} onChange={set('confirm')} className={input} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className={label}>I am joining as a…</span>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <label className={roleOption(form.role === 'user')}>
                <input type="radio" name="role" value="user" checked={form.role === 'user'} onChange={set('role')} className="accent-indigo-600" />
                <span className="text-2xl">🧑‍💻</span>
                <span>
                  <strong className="block text-sm text-slate-900">Customer</strong>
                  <small className="text-xs text-slate-500">Browse & buy products</small>
                </span>
              </label>
              <label className={roleOption(form.role === 'sales')}>
                <input type="radio" name="role" value="sales" checked={form.role === 'sales'} onChange={set('role')} className="accent-indigo-600" />
                <span className="text-2xl">💼</span>
                <span>
                  <strong className="block text-sm text-slate-900">Sales Person</strong>
                  <small className="text-xs text-slate-500">Sell & manage my products</small>
                </span>
              </label>
            </div>
            <small className={hint}>
              Admin accounts are granted by existing admins only — self-registration as Admin is blocked on the backend.
            </small>
          </div>

          <button className={`${btnPrimary} ${lg} ${block}`} disabled={busy}>
            {busy ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          Already registered? <Link to="/login" className="font-semibold text-indigo-600 hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
