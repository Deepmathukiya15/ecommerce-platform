import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import ProductImage from '../components/ProductImage';
import { formatINR, formatDate, shortId } from '../utils/format';

/** A customer's own order history (GET /api/orders/mine) */
export default function MyOrders() {
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    api.get('/orders/mine').then(({ data }) => setOrders(data)).catch(() => setOrders([]));
  }, []);

  if (orders === null) return <Loader full label="Loading your orders…" />;

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-14 pt-7">
      <h1 className="mb-5 text-2xl font-extrabold text-slate-900">My Orders</h1>

      {orders.length === 0 ? (
        <EmptyState icon="🧾" title="No orders yet" message="When you buy something, it will show up here." actionLabel="Start shopping" actionTo="/" />
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <div key={order._id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div>
                  <strong className="block text-base text-slate-900">Order {shortId(order._id)}</strong>
                  <span className="text-xs text-slate-500">{formatDate(order.createdAt)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={order.status} />
                  <span className="text-lg font-extrabold text-slate-900">{formatINR(order.totalAmount)}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 border-t border-slate-100 px-5 py-3">
                {order.items.map((item, i) => (
                  <Link to={`/products/${item.product}`} key={i} className="grid grid-cols-[56px_1fr] items-center gap-3 py-1.5 text-slate-900">
                    <ProductImage images={[{ url: item.image }]} name={item.name} className="h-14 w-14 rounded-lg border border-slate-200 bg-slate-100 object-cover" />
                    <div>
                      <span className="block text-sm font-bold hover:text-indigo-600">{item.name}</span>
                      <span className="block text-xs text-slate-500">Qty {item.quantity} × {formatINR(item.price)}</span>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-4 border-t border-slate-100 bg-slate-50/60 px-5 py-3 text-xs text-slate-500">
                <span className="min-w-[200px] flex-1">
                  📦 {order.shippingAddress.fullName}, {order.shippingAddress.city}, {order.shippingAddress.state}
                </span>
                {order.isPaid && <span className="font-semibold text-green-600">✓ Paid {order.paidAt ? formatDate(order.paidAt) : ''}</span>}
                <Link className="font-semibold text-indigo-600 hover:underline" to={`/order-success/${order._id}`}>View details →</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
