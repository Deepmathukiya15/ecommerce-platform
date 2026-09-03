import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast, errMsg } from '../context/ToastContext';
import Loader from '../components/Loader';
import confirmDialog from '../components/ConfirmDialog';
import { roleLabel, formatDate } from '../utils/format';
import { btnDanger, btnGhost, hint, xs } from '../utils/ui';

const ROLES = ['user', 'sales', 'admin'];
const th = 'whitespace-nowrap border-b border-slate-200 bg-slate-50 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500';
const td = 'border-b border-slate-100 px-4 py-3 align-middle';

/** Admin-only: list users, change roles, activate/deactivate, delete (GET/PATCH/DELETE /api/users) */
export default function AdminUsers() {
  const { user: me } = useAuth();
  const { success, error } = useToast();
  const [users, setUsers] = useState(null);

  const fetchUsers = () => {
    api.get('/users').then(({ data }) => setUsers(data)).catch((err) => {
      error(errMsg(err));
      setUsers([]);
    });
  };
  useEffect(() => { fetchUsers(); }, []);

  const onRole = async (u, role) => {
    if (role === u.role) return;
    try {
      await api.patch(`/users/${u._id}/role`, { role });
      success(`${u.name} is now ${roleLabel(role)}`);
      fetchUsers();
    } catch (err) {
      error(errMsg(err, 'Could not change role'));
    }
  };

  const onToggleActive = async (u) => {
    try {
      await api.patch(`/users/${u._id}/status`, { isActive: !u.isActive });
      success(u.isActive ? `${u.name} deactivated` : `${u.name} reactivated`);
      fetchUsers();
    } catch (err) {
      error(errMsg(err));
    }
  };

  const onDelete = async (u) => {
    const ok = await confirmDialog({
      title: `Delete ${u.name}?`,
      message: `This permanently removes ${u.email}. Products they own will be reassigned to you.`,
      confirmLabel: 'Delete user',
    });
    if (!ok) return;
    try {
      await api.delete(`/users/${u._id}`);
      success('User deleted');
      fetchUsers();
    } catch (err) {
      error(errMsg(err, 'Could not delete user'));
    }
  };

  if (users === null) return <Loader full label="Loading users…" />;

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-14 pt-7">
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold text-slate-900">Manage Users</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          {users.length} registered account{users.length === 1 ? '' : 's'} — change roles, deactivate or delete.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className={th}>User</th>
              <th className={th}>Role</th>
              <th className={th}>Products</th>
              <th className={th}>Status</th>
              <th className={th}>Joined</th>
              <th className={`${th} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isMe = u._id === me._id;
              return (
                <tr key={u._id} className={`hover:bg-indigo-50/30 ${!u.isActive ? 'opacity-55' : ''}`}>
                  <td className={td}>
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-sm font-bold text-white">
                        {u.name.charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <span className="block font-bold text-slate-900">{u.name}{isMe && <em> (you)</em>}</span>
                        <small className="block text-xs text-slate-500">{u.email}</small>
                      </div>
                    </div>
                  </td>
                  <td className={td}>
                    <select
                      className="cursor-pointer rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                      value={u.role}
                      disabled={isMe}
                      onChange={(e) => onRole(u, e.target.value)}
                      aria-label={`Role for ${u.name}`}
                    >
                      {ROLES.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
                    </select>
                  </td>
                  <td className={td}>{u.role === 'sales' || u.role === 'admin' ? u.productCount : '—'}</td>
                  <td className={td}>
                    <span className={`rounded-full px-3 py-0.5 text-xs font-bold ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.isActive ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td className={`${td} text-slate-500`}>{formatDate(u.createdAt).split(',')[0]}</td>
                  <td className={`${td} whitespace-nowrap text-right`}>
                    <button className={`${btnGhost} ${xs}`} disabled={isMe} onClick={() => onToggleActive(u)}>
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>{' '}
                    <button className={`${btnDanger} ${xs}`} disabled={isMe} onClick={() => onDelete(u)}>Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className={`${hint} mt-5`}>
        Safety rails (backend-enforced): admins cannot demote, deactivate or delete their own account —
        so the platform always keeps at least one administrator.
      </p>
    </div>
  );
}
