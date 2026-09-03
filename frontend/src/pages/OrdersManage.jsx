import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast, errMsg } from '../context/ToastContext';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import StatusBadge, { ORDER_STATUSES } from '../components/StatusBadge';
import { formatINR, formatDate, shortId } from '../utils/format';
import { btnGhost, btnPrimary, input, xs } from '../utils/ui';

/**
 * Orders management.
 *  - Admin → sees ALL orders and can update fulfilment status
 *  - Sales → sees only orders containing THEIR products (read-only), scoped by the backend
 */
export default function OrdersManage({ mode = 'admin' }) {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [data, setData] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState(null);

  const fetchOrders = useCallback(async () => {
    const q = new URLSearchParams({ page, limit: 10 });
    if (statusFilter) q.set('status', statusFilter);
    try {
      const { data: d } = await api.get(`/orders?${q}`);
      setData(d);
    } catch (err) {
      error(errMsg(err, 'Could not load orders'));
      setData({ orders: [], page: 1, pages: 1, total: 0 });
    }
  }, [page, statusFilter, error]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const onStatus = async (order, status) => {
    try {
      await api.patch(`/orders/${order._id}/status`, { status });
      success(`Order ${shortId(order._id)} → ${status}`);
      fetchOrders();
    } catch (err) {
      error(errMsg(err, 'Status update failed'));
    }
  };

  if (data === null) return <Loader full label="Loading orders…" />;

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-14 pt-7">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {mode === 'admin' ? 'All Orders (Admin)' : 'Orders Containing My Products'}
          </h1>
          <p className="mt-0.5 max-w-xl text-sm text-slate-500">
            {mode === 'admin'
              ? 'View and update every order in the system.'
              : 'Read-only view — you see only orders that include products you sell (scoped on the backend).'}
          </p>
        </div>
        {mode === 'admin' && (
          <select className={`${input} w-auto`} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} aria-label="Filter by status">
            <option value="">All statuses</option>
            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
      </div>

      {data.orders.length === 0 ? (
        <EmptyState icon="🧾" title="No orders found" message={statusFilter ? 'Try a different status filter.' : 'Orders will appear here after customers check out.'} />
      ) : (
        <div className="flex flex-col gap-4">
          {data.orders.map((order) => {
            const mineItems = mode === 'sales' ? order.items.filter((i) => i.seller?._id === user._id) : order.items;
            const myEarnings = mineItems.reduce((s, i) => s + i.price * i.quantity, 0);
            const isOpen = expanded === order._id;
            return (
              <div key={order._id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex cursor-pointer flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-slate-50" onClick={() => setExpanded(isOpen ? null : order._id)}>
                  <div>
                    <strong className="block text-base text-slate-900">Order {shortId(order._id)}</strong>
                    <span className="text-xs text-slate-500">
                      {formatDate(order.createdAt)} · {order.user?.name || 'Unknown'} ({order.user?.email})
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={order.status} />
                    <span className="text-lg font-extrabold text-slate-900">{formatINR(order.totalAmount)}</span>
                    <span className="text-xs text-slate-400">{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>

                {isOpen && (
                  <>
                    <div className="flex flex-col gap-2.5 border-t border-slate-100 px-5 py-3">
                      {order.items.map((item, i) => {
                        const isMine = item.seller?._id === user._id;
                        return (
                          <div key={i} className={`grid grid-cols-[56px_1fr_auto] items-center gap-3 py-1.5 ${mode === 'sales' && !isMine ? 'opacity-45' : ''}`}>
                            <img className="h-14 w-14 rounded-lg border border-slate-200 bg-slate-100 object-cover" src={item.image} alt="" onError={(e) => (e.target.style.visibility = 'hidden')} />
                            <div>
                              <Link to={`/products/${item.product}`} className="block text-sm font-bold text-slate-900 hover:text-indigo-600">{item.name}</Link>
                              <span className="block text-xs text-slate-500">
                                Qty {item.quantity} × {formatINR(item.price)} · Seller: {item.seller?.name || '—'}
                                {mode === 'sales' && isMine && <b className="text-indigo-600"> (yours)</b>}
                              </span>
                            </div>
                            <span className="text-sm font-extrabold">{formatINR(item.price * item.quantity)}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 border-t border-slate-100 bg-slate-50/60 px-5 py-3 text-xs text-slate-500">
                      <span className="min-w-[200px] flex-1">
                        📦 {order.shippingAddress.fullName}, {order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode} · ☎ {order.shippingAddress.phone}
                      </span>
                      {mode === 'sales' && <span className="font-semibold text-green-600">Your earnings: <b>{formatINR(myEarnings)}</b></span>}
                      {order.payment?.razorpayPaymentId && (
                        <span className="font-semibold text-green-600">Razorpay: <code className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">{order.payment.razorpayPaymentId}</code></span>
                      )}
                    </div>
                    {mode === 'admin' && (
                      <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-5 py-3 text-sm text-slate-500">
                        <span>Update status:</span>
                        {ORDER_STATUSES.map((s) => (
                          <button
                            key={s}
                            className={`${order.status === s ? btnPrimary : btnGhost} ${xs}`}
                            onClick={() => s !== order.status && onStatus(order, s)}
                            disabled={order.status === s}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {data.pages > 1 && (
        <nav className="mt-7 flex items-center justify-center gap-2">
          <button className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold disabled:opacity-40" disabled={data.page <= 1} onClick={() => setPage(data.page - 1)}>← Prev</button>
          <span className="text-sm text-slate-500">Page {data.page} of {data.pages}</span>
          <button className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold disabled:opacity-40" disabled={data.page >= data.pages} onClick={() => setPage(data.page + 1)}>Next →</button>
        </nav>
      )}
    </div>
  );
}
