import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import Loader from '../components/Loader';
import StatusBadge from '../components/StatusBadge';
import { useToast, errMsg } from '../context/ToastContext';
import { formatINR, formatDate, shortId } from '../utils/format';
import { btnGhost, btnPrimary, sm } from '../utils/ui';

const th = 'border-b border-slate-200 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500';
const td = 'border-b border-slate-100 px-4 py-3 align-middle';

/** Admin dashboard — basic sales stats + recent orders (GET /api/admin/stats) */
export default function AdminDashboard() {
  const { error } = useToast();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/admin/stats').then(({ data }) => setStats(data)).catch((err) => error(errMsg(err)));
  }, [error]);

  if (!stats) return <Loader full label="Crunching numbers…" />;

  const maxUnits = Math.max(1, ...stats.topProducts.map((p) => p.unitsSold));

  const cards = [
    { label: 'Total Revenue', value: formatINR(stats.totalRevenue), icon: '💰', bar: 'bg-green-500' },
    { label: 'Total Orders', value: stats.totalOrders, icon: '🧾', bar: 'bg-indigo-500' },
    { label: 'Paid Orders', value: stats.paidOrders, icon: '✅', bar: 'bg-sky-500' },
    { label: 'Products Listed', value: stats.totalProducts, icon: '📦', bar: 'bg-amber-500' },
    { label: 'Registered Users', value: stats.totalUsers, icon: '👥', bar: 'bg-purple-500' },
    { label: 'Sales Persons', value: stats.totalSalesPersons, icon: '💼', bar: 'bg-pink-500' },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-14 pt-7">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Admin Dashboard</h1>
          <p className="mt-0.5 text-sm text-slate-500">Platform-wide sales statistics and the latest orders.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className={`${btnGhost} ${sm}`} to="/admin/orders">All orders →</Link>
          <Link className={`${btnGhost} ${sm}`} to="/admin/users">Manage users →</Link>
          <Link className={`${btnPrimary} ${sm}`} to="/products/new">+ Add Product</Link>
        </div>
      </div>

      <div className="mb-6 grid gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(170px,1fr))]">
        {cards.map((c) => (
          <div key={c.label} className="relative flex items-center gap-3.5 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <span className={`absolute inset-y-0 left-0 w-1 ${c.bar}`} />
            <span className="text-3xl">{c.icon}</span>
            <div>
              <span className="block text-xl font-extrabold tracking-tight text-slate-900">{c.value}</span>
              <span className="block text-xs font-semibold text-slate-500">{c.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[1.6fr_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-base font-bold text-slate-900">Recent orders</h2>
          {stats.recentOrders.length === 0 ? (
            <p className="text-sm text-slate-500">No orders yet — they'll appear here after the first Razorpay checkout.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr><th className={th}>Order</th><th className={th}>Customer</th><th className={th}>Total</th><th className={th}>Status</th><th className={th}>Date</th></tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map((o) => (
                    <tr key={o._id} className="hover:bg-indigo-50/30">
                      <td className={td}><Link className="font-semibold text-indigo-600 hover:underline" to={`/order-success/${o._id}`}>{shortId(o._id)}</Link></td>
                      <td className={td}>{o.user?.name || '—'}</td>
                      <td className={td}>{formatINR(o.totalAmount)}</td>
                      <td className={td}><StatusBadge status={o.status} /></td>
                      <td className={`${td} text-slate-500`}>{formatDate(o.createdAt).split(',')[0]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="flex flex-col gap-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-base font-bold text-slate-900">Top products</h2>
            {stats.topProducts.length === 0 ? (
              <p className="text-sm text-slate-500">No sales data yet.</p>
            ) : (
              <div className="flex flex-col gap-3.5">
                {stats.topProducts.map((p) => (
                  <div key={p._id}>
                    <div className="flex justify-between gap-2.5 text-sm">
                      <span className="truncate font-bold text-slate-900">{p.name}</span>
                      <span className="whitespace-nowrap text-slate-500">{p.unitsSold} sold</span>
                    </div>
                    <div className="my-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                      <span className="block h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: `${(p.unitsSold / maxUnits) * 100}%` }} />
                    </div>
                    <small className="text-xs text-slate-500">{formatINR(p.revenue)} revenue</small>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-base font-bold text-slate-900">Low stock alert</h2>
            {stats.lowStock.length === 0 ? (
              <p className="text-sm text-slate-500">All products are well stocked. 🎉</p>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                {stats.lowStock.map((p) => (
                  <li key={p._id} className="flex items-center justify-between gap-3 text-sm">
                    <span>{p.name}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${p.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{p.stock} left</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-base font-bold text-slate-900">Orders by status</h2>
            <div className="flex flex-col gap-2.5">
              {Object.entries(stats.ordersByStatus).map(([s, n]) => (
                <span key={s} className="flex items-center justify-between text-sm"><StatusBadge status={s} /> <b>{n}</b></span>
              ))}
              {Object.keys(stats.ordersByStatus).length === 0 && <p className="text-sm text-slate-500">No orders yet.</p>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
