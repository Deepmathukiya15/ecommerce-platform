import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast, errMsg } from '../context/ToastContext';
import { loadRazorpayScript } from '../utils/razorpay';
import ProductImage from '../components/ProductImage';
import EmptyState from '../components/EmptyState';
import DemoCheckoutModal from '../components/DemoCheckoutModal';
import { formatINR } from '../utils/format';
import { btnGhost, btnPrimary, input, label, lg, md, block } from '../utils/ui';

const INITIAL_ADDRESS = { fullName: '', phone: '', address: '', city: '', state: '', pincode: '' };

export default function Checkout() {
  const { user } = useAuth();
  const { cart, refresh } = useCart();
  const { success, error, info } = useToast();
  const navigate = useNavigate();

  const [addr, setAddr] = useState(() => ({ ...INITIAL_ADDRESS, fullName: user?.name || '' }));
  const [paying, setPaying] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [demoData, setDemoData] = useState(null); // { amount, currency, orderId, user }

  // Ask the backend whether real Razorpay or the demo gateway is active
  useEffect(() => {
    api.get('/payments/mode').then(({ data }) => setDemoMode(Boolean(data.demo))).catch(() => {});
  }, []);

  if (cart.items.length === 0 && !paying) {
    return (
      <div className="mx-auto w-full max-w-2xl px-5 pb-14 pt-7">
        <EmptyState icon="🧾" title="Nothing to checkout" message="Your cart is empty — add a few products first." actionLabel="Go shopping" actionTo="/" />
      </div>
    );
  }

  const set = (k) => (e) => setAddr((a) => ({ ...a, [k]: e.target.value }));

  /**
   * Shared step 3: send the payment result (from real Razorpay OR the demo
   * gateway) to the backend, which verifies the HMAC signature and only then
   * persists the order, decrements stock and clears the cart.
   */
  const handlePaid = async (resp) => {
    try {
      const { data } = await api.post('/payments/verify', {
        razorpay_order_id: resp.razorpay_order_id,
        razorpay_payment_id: resp.razorpay_payment_id,
        razorpay_signature: resp.razorpay_signature,
        shippingAddress: addr,
      });
      await refresh();
      setDemoData(null);
      success('Payment verified — order placed! 🎉');
      navigate(`/order-success/${data.order._id}`, { replace: true });
    } catch (verr) {
      error(errMsg(verr, 'Payment verification failed — order NOT created'));
      setPaying(false);
      setDemoData(null);
    }
  };

  /**
   * Full checkout flow:
   *  1. Backend creates an order (amount computed server-side from the cart)
   *  2. Real Razorpay widget opens, OR the demo modal opens when no keys are set
   *  3. handlePaid() → backend verifies the signature → order created, cart cleared
   */
  const payNow = async (e) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(addr.phone)) return error('Enter a valid 10-digit phone number');
    if (!/^\d{6}$/.test(addr.pincode)) return error('Enter a valid 6-digit pincode');

    setPaying(true);
    try {
      const { data: rzp } = await api.post('/payments/create-order');

      // ---- Demo gateway (no Razorpay keys on the server) ----
      if (rzp.demo) {
        setDemoData({ amount: rzp.amount, currency: rzp.currency, orderId: rzp.razorpayOrderId, user: rzp.user });
        return; // the modal drives the rest; keep `paying` true until it resolves
      }

      // ---- Real Razorpay ----
      const scriptOk = await loadRazorpayScript();
      if (!scriptOk) {
        error('Failed to load Razorpay checkout. Check your internet connection.');
        return setPaying(false);
      }

      const options = {
        key: rzp.key,
        amount: rzp.amount,
        currency: rzp.currency,
        name: 'ShopKart',
        description: `Order ${rzp.razorpayOrderId}`,
        order_id: rzp.razorpayOrderId,
        prefill: { name: rzp.user.name, email: rzp.user.email, contact: addr.phone },
        theme: { color: '#4f46e5' },
        handler: handlePaid,
        modal: {
          ondismiss: () => {
            info('Payment cancelled — you can retry anytime');
            setPaying(false);
          },
        },
      };

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.on('payment.failed', (resp) => {
        error(`Payment failed: ${resp.error?.description || 'unknown error'}`);
        setPaying(false);
      });
      rzpInstance.open();
    } catch (err) {
      error(errMsg(err, 'Could not start checkout'));
      setPaying(false);
    }
  };

  const closeDemo = () => {
    setDemoData(null);
    setPaying(false);
    info('Payment cancelled — you can retry anytime');
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-14 pt-7">
      <h1 className="mb-5 text-2xl font-extrabold text-slate-900">Checkout</h1>

      <div className="grid items-start gap-6 lg:grid-cols-[1.35fr_1fr]">
        <form className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" onSubmit={payNow}>
          <h2 className="mb-4 text-lg font-bold text-slate-900">Shipping address</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="fullName" className={label}>Full name *</label>
              <input id="fullName" required value={addr.fullName} onChange={set('fullName')} placeholder="Recipient name" className={input} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="phone" className={label}>Phone *</label>
              <input id="phone" required inputMode="numeric" pattern="[0-9]{10}" maxLength={10} value={addr.phone} onChange={set('phone')} placeholder="10-digit mobile" className={input} />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label htmlFor="address" className={label}>Address *</label>
              <textarea id="address" required rows={2} value={addr.address} onChange={set('address')} placeholder="Flat / street / area" className={input} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="city" className={label}>City *</label>
              <input id="city" required value={addr.city} onChange={set('city')} placeholder="Ahmedabad" className={input} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="state" className={label}>State *</label>
              <input id="state" required value={addr.state} onChange={set('state')} placeholder="Gujarat" className={input} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="pincode" className={label}>Pincode *</label>
              <input id="pincode" required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={addr.pincode} onChange={set('pincode')} placeholder="380001" className={input} />
            </div>
          </div>

          {demoMode ? (
            <div className="my-4 flex gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <span className="text-xl">🧪</span>
              <p className="m-0">
                <strong>Demo payment mode</strong> — no Razorpay keys are set on this server, so checkout runs a
                local demo gateway. It still does the real thing: the backend <strong>verifies the HMAC
                signature</strong> before saving the order and clearing the cart. Add{' '}
                <code className="rounded bg-amber-100 px-1.5 py-0.5 text-xs">RAZORPAY_KEY_ID</code> /{' '}
                <code className="rounded bg-amber-100 px-1.5 py-0.5 text-xs">RAZORPAY_KEY_SECRET</code> test keys to
                <code className="mx-1 rounded bg-amber-100 px-1.5 py-0.5 text-xs">.env</code> to switch to the real
                Razorpay widget automatically.
              </p>
            </div>
          ) : (
            <div className="my-4 flex gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-slate-700">
              <span className="text-xl">💳</span>
              <p className="m-0">
                You'll pay via <strong>Razorpay (test mode)</strong>. Use test cards like{' '}
                <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">4111 1111 1111 1111</code> (any future expiry, any CVV)
                or the UPI id <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">success@razorpay</code>.
                The order is saved only after the backend verifies the payment signature.
              </p>
            </div>
          )}

          <button className={`${btnPrimary} ${lg} ${block}`} disabled={paying}>
            {paying ? 'Waiting for payment…' : `Pay ${formatINR(cart.total)} securely →`}
          </button>
        </form>

        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-bold text-slate-900">Your items ({cart.itemsCount})</h2>
          <div className="mb-3 flex flex-col gap-3">
            {cart.items.map((i) => (
              <div key={i.product._id} className="grid grid-cols-[56px_1fr_auto] items-center gap-3">
                <ProductImage images={i.product.images} name={i.product.name} className="h-14 w-14 rounded-lg border border-slate-200 bg-slate-100 object-cover" />
                <div>
                  <span className="block text-sm font-bold text-slate-900">{i.product.name}</span>
                  <span className="block text-xs text-slate-500">Qty {i.quantity} × {formatINR(i.product.price)}</span>
                </div>
                <span className="text-sm font-extrabold">{formatINR(i.product.price * i.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between py-1.5 text-sm text-slate-700"><span>Delivery</span><span className="font-bold text-green-600">FREE</span></div>
          <div className="flex justify-between border-t-2 border-slate-100 pt-3 text-lg font-extrabold text-slate-900"><span>Total payable</span><span>{formatINR(cart.total)}</span></div>
          <Link to="/cart" className={`${btnGhost} ${md} ${block}`}>← Edit cart</Link>
        </aside>
      </div>

      {demoData && (
        <DemoCheckoutModal
          amount={demoData.amount}
          currency={demoData.currency}
          orderId={demoData.orderId}
          user={demoData.user}
          onClose={closeDemo}
          onPaid={handlePaid}
        />
      )}
    </div>
  );
}
