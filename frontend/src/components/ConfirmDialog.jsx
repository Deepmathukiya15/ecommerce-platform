/**
 * Lightweight promise-based confirm dialog (replaces window.confirm).
 * Usage: const ok = await confirmDialog({ title, message, confirmLabel });
 */
import { createRoot } from 'react-dom/client';
import { btn, btnGhost, btnDanger, btnPrimary, md } from '../utils/ui';

export default function confirmDialog({ title = 'Are you sure?', message = '', confirmLabel = 'Confirm', danger = true }) {
  return new Promise((resolve) => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);

    const close = (result) => {
      root.unmount();
      host.remove();
      resolve(result);
    };

    root.render(
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-sm"
        onMouseDown={(e) => e.target === e.currentTarget && close(false)}
      >
        <div className="pop-anim w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" role="dialog" aria-modal="true">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          {message && <p className="mt-1.5 text-sm text-slate-500">{message}</p>}
          <div className="mt-5 flex flex-wrap justify-end gap-2.5">
            <button className={`${btnGhost} ${md}`} onClick={() => close(false)}>Cancel</button>
            <button className={`${danger ? btnDanger : btnPrimary} ${md}`} onClick={() => close(true)}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    );
  });
}
