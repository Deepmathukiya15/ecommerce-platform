import { useState } from 'react';
import api from '../api/axios';
import { useToast, errMsg } from '../context/ToastContext';
import { formatINR } from '../utils/format';
import { btnPrimary, btnGhost, lg, block } from '../utils/ui';

/**
 * DemoCheckoutModal — a Razorpay-lookalike used ONLY when the backend has no
 * Razorpay keys configured (demo mode). Clicking "Pay" asks the backend to play
 * Razorpay's role (mint a payment id + HMAC signature), then hands that back to
 * the parent, which runs the SAME /payments/verify flow as real Razorpay.
 *
 * The "Decline this payment" toggle corrupts the signature so you can watch the
 * server-side verification reject it and refuse to create the order.
 */
export default function DemoCheckoutModal({ amount, currency, orderId, user, onClose, onPaid }) {
  const { error } = useToast();
  const [method, setMethod] = useState('card');
  const [decline, setDecline] = useState(false);
  const [busy, setBusy] = useState(false);

  const flipFirstChar = (hex) => (hex[0] === '0' ? '1' : '0') + hex.slice(1);

  const pay = async () => {
    setBusy(true);
    try {
      const { data } = await api.post('/payments/demo-sign', { razorpayOrderId: orderId });
      const resp = decline
        ? { ...data, razorpay_signature: flipFirstChar(data.razorpay_signature) } // tamper → must fail
        : data;
      await onPaid(resp); // parent verifies signature + creates order (or shows the rejection)
    } catch (err) {
      error(errMsg(err, 'Demo payment could not be initiated'));
      setBusy(false);
    }
  };

  const methods = [
    { id: 'card', label: 'Card', icon: '💳' },
    { id: 'upi', label: 'UPI', icon: '📱' },
    { id: 'netbanking', label: 'Netbanking', icon: '🏦' },
    { id: 'wallet', label: 'Wallet', icon: '👛' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* header */}
        <div className="flex items-center justify-between bg-[#0c2451] px-5 py-4 text-white">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-blue-200">ShopKart</p>
            <p className="text-xl font-extrabold">{formatINR(amount / 100)}</p>
          </div>
          <span className="rounded-full bg-amber-400 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-amber-950">
            Demo mode
          </span>
        </div>

        <div className="px-5 py-4">
          <p className="mb-3 text-xs text-slate-500">
            Order <span className="font-mono text-slate-700">{orderId}</span>
            {user?.email ? <> · {user.email}</> : null}
          </p>

          {/* method pills */}
          <div className="mb-4 grid grid-cols-4 gap-2">
            {methods.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethod(m.id)}
                className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-[11px] font-semibold transition ${
                  method === m.id
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                <span className="text-lg">{m.icon}</span>
                {m.label}
              </button>
            ))}
          </div>

          {method === 'card' && (
            <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              <p className="mb-1 font-bold text-slate-700">Test card (pre-filled)</p>
              <p className="font-mono">4111 1111 1111 1111 · any future expiry · any CVV</p>
            </div>
          )}
          {method === 'upi' && (
            <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              <p className="mb-1 font-bold text-slate-700">Test UPI id</p>
              <p className="font-mono">success@razorpay</p>
            </div>
          )}

          <label className="mb-4 flex cursor-pointer items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700">
            <input
              type="checkbox"
              checked={decline}
              onChange={(e) => setDecline(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-rose-600"
            />
            <span>
              <strong>Decline this payment (test).</strong> Sends a tampered signature so you can see the
              backend reject it and <em>not</em> create an order.
            </span>
          </label>

          <div className="flex gap-2">
            <button type="button" onClick={onClose} disabled={busy} className={`${btnGhost} ${lg}`}>
              Cancel
            </button>
            <button type="button" onClick={pay} disabled={busy} className={`${btnPrimary} ${lg} ${block}`}>
              {busy ? 'Processing…' : `Pay ${formatINR(amount / 100)}`}
            </button>
          </div>

          <p className="mt-3 text-center text-[11px] text-slate-400">
            🔒 No Razorpay keys configured — running the local demo gateway. The order is saved only after the
            server verifies the HMAC signature.
          </p>
        </div>
      </div>
    </div>
  );
}
