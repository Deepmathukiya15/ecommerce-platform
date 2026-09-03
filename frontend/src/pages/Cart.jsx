import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast, errMsg } from '../context/ToastContext';
import EmptyState from '../components/EmptyState';
import ProductImage from '../components/ProductImage';
import confirmDialog from '../components/ConfirmDialog';
import { formatINR } from '../utils/format';
import { btnGhost, btnPrimary, lg, md, block } from '../utils/ui';

export default function Cart() {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const [busyId, setBusyId] = useState(null);

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto w-full max-w-2xl px-5 pb-14 pt-7">
        <EmptyState icon="🛒" title="Your cart is empty" message="Browse the shop and add something you love!" actionLabel="Start shopping" actionTo="/" />
      </div>
    );
  }

  const onQty = async (item, next) => {
    if (next < 0) return;
    if (next > item.product.stock) return error(`Only ${item.product.stock} in stock`);
    setBusyId(item.product._id);
    try {
      if (next === 0) await removeFromCart(item.product._id);
      else await updateQuantity(item.product._id, next);
    } catch (err) {
      error(errMsg(err, 'Could not update quantity'));
    } finally {
      setBusyId(null);
    }
  };

  const onRemove = async (item) => {
    const ok = await confirmDialog({ title: 'Remove item?', message: `Remove "${item.product.name}" from your cart?`, confirmLabel: 'Remove' });
    if (!ok) return;
    try {
      await removeFromCart(item.product._id);
      success('Item removed from cart');
    } catch (err) {
      error(errMsg(err));
    }
  };

  const onClear = async () => {
    const ok = await confirmDialog({ title: 'Clear cart?', message: 'Remove all items from your cart?', confirmLabel: 'Clear cart' });
    if (!ok) return;
    try {
      await clearCart();
      success('Cart cleared');
    } catch (err) {
      error(errMsg(err));
    }
  };

  const stepperBtn = 'h-9 w-8 border-none bg-transparent text-base font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-40';

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-14 pt-7">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-slate-900">
          Your Cart{' '}
          <span className="rounded-full bg-indigo-50 px-3 py-0.5 align-middle text-base font-bold text-indigo-700">
            {cart.itemsCount} item{cart.itemsCount === 1 ? '' : 's'}
          </span>
        </h1>
        <button className="bg-transparent text-sm font-semibold text-red-600 hover:underline" onClick={onClear}>Clear cart</button>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white px-5 shadow-sm">
          {cart.items.map((item) => {
            const p = item.product;
            if (!p) return null;
            return (
              <div key={p._id} className="grid grid-cols-[64px_1fr] items-center gap-4 border-b border-slate-100 py-4 last:border-0 sm:grid-cols-[86px_1fr_auto]">
                <Link to={`/products/${p._id}`} className="h-[86px] w-16 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 sm:w-[86px]">
                  <ProductImage images={p.images} name={p.name} className="h-full w-full object-cover" />
                </Link>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <Link to={`/products/${p._id}`} className="font-bold text-slate-900 hover:text-indigo-600">{p.name}</Link>
                  <span className="text-xs text-slate-500">{p.category}</span>
                  <span className="font-bold text-indigo-700">{formatINR(p.price)}</span>
                  {p.stock < item.quantity && <span className="text-xs font-semibold text-amber-600">⚠ only {p.stock} left</span>}
                </div>
                <div className="col-span-2 flex items-center justify-between gap-3 sm:col-span-1 sm:flex-col sm:items-end">
                  <div className="inline-flex items-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                    <button className={stepperBtn} onClick={() => onQty(item, item.quantity - 1)} disabled={busyId === p._id} aria-label="Decrease">−</button>
                    <span className="min-w-[38px] text-center font-bold">{item.quantity}</span>
                    <button className={stepperBtn} onClick={() => onQty(item, item.quantity + 1)} disabled={busyId === p._id || item.quantity >= p.stock} aria-label="Increase">+</button>
                  </div>
                  <span className="font-extrabold text-slate-900">{formatINR(p.price * item.quantity)}</span>
                  <button className="rounded p-1 text-base opacity-60 hover:opacity-100" onClick={() => onRemove(item)} aria-label={`Remove ${p.name}`}>🗑</button>
                </div>
              </div>
            );
          })}
        </div>

        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-20">
          <h2 className="mb-3 text-lg font-bold text-slate-900">Order summary</h2>
          <div className="flex justify-between py-1.5 text-sm text-slate-700"><span>Items ({cart.itemsCount})</span><span>{formatINR(cart.total)}</span></div>
          <div className="flex justify-between py-1.5 text-sm text-slate-700"><span>Delivery</span><span className="font-bold text-green-600">FREE</span></div>
          <div className="mt-2 flex justify-between border-t-2 border-slate-100 pt-3 text-lg font-extrabold text-slate-900"><span>Total</span><span>{formatINR(cart.total)}</span></div>
          <button className={`${btnPrimary} ${lg} ${block}`} onClick={() => navigate('/checkout')}>Proceed to checkout →</button>
          <Link to="/" className={`${btnGhost} ${md} ${block}`}>Continue shopping</Link>
          <p className="mt-3.5 text-center text-xs text-slate-500">🔒 Payments secured by Razorpay (test mode)</p>
        </aside>
      </div>
    </div>
  );
}
