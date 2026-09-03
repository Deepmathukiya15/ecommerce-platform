import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/axios';
import Loader from '../components/Loader';
import StatusBadge from '../components/StatusBadge';
import ProductImage from '../components/ProductImage';
import { formatINR, formatDate, shortId } from '../utils/format';
import { btnGhost, btnPrimary, md } from '../utils/ui';

export default function OrderSuccess() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/orders/${id}`).then(({ data }) => setOrder(data)).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader full label="Fetching your order…" />;
  if (!order)
    return (
      <div className="mx-auto w-full max-w-2xl px-5 pb-14 pt-7 text-center">
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white px-7 py-14">
          <div className="mb-2.5 text-5xl">🤔</div>
          <h2 className="text-xl font-bold text-slate-900">Order not found</h2>
          <div className="mt-4">
            <Link className={`${btnPrimary} ${md}`} to="/my-orders">View my orders</Link>
          </div>
        </div>
      </div>
    );

  return (
    <div className="mx-auto w-full max-w-2xl px-5 pb-14 pt-7">
      <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <div className="pop-anim mx-auto mb-3.5 flex h-[74px] w-[74px] items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-600 text-4xl font-extrabold text-white shadow-lg shadow-green-200">
          ✓
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900">Payment successful!</h1>
        <p className="mt-1 text-sm text-slate-500">Order {shortId(order._id)} · placed on {formatDate(order.createdAt)}</p>
        <div className="mt-2"><StatusBadge status={order.status} /></div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-base font-bold text-slate-900">Order items</h2>
        <div className="flex flex-col gap-3">
          {order.items.map((item, i) => (
            <div key={i} className="grid grid-cols-[56px_1fr_auto] items-center gap-3">
              <ProductImage images={[{ url: item.image }]} name={item.name} className="h-14 w-14 rounded-lg border border-slate-200 bg-slate-100 object-cover" />
              <div>
                <span className="block text-sm font-bold text-slate-900">{item.name}</span>
                <span className="block text-xs text-slate-500">Qty {item.quantity} × {formatINR(item.price)} · Seller: {item.seller?.name || '—'}</span>
              </div>
              <span className="text-sm font-extrabold">{formatINR(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-between border-t-2 border-slate-100 pt-3 text-lg font-extrabold text-slate-900">
          <span>Paid via Razorpay</span><span>{formatINR(order.totalAmount)}</span>
        </div>
        <p className="mt-2.5 text-xs text-slate-500">
          Payment ID: <code className="rounded bg-slate-100 px-1.5 py-0.5">{order.payment?.razorpayPaymentId}</code>
        </p>

        <h2 className="mb-2 mt-5 text-base font-bold text-slate-900">Shipping to</h2>
        <p className="text-sm leading-relaxed text-slate-700">
          <strong>{order.shippingAddress.fullName}</strong> ({order.shippingAddress.phone})<br />
          {order.shippingAddress.address}, {order.shippingAddress.city},<br />
          {order.shippingAddress.state} — {order.shippingAddress.pincode}
        </p>

        <div className="mt-5 flex flex-wrap justify-end gap-2.5">
          <Link to="/my-orders" className={`${btnPrimary} ${md}`}>View all my orders</Link>
          <Link to="/" className={`${btnGhost} ${md}`}>Continue shopping</Link>
        </div>
      </div>
    </div>
  );
}
