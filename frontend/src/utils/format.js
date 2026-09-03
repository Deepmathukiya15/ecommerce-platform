/** Format a number as Indian Rupees */
export const formatINR = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(
    Number(amount || 0)
  );

/** e.g. "3 Sep 2026, 2:45 pm" */
export const formatDate = (d) =>
  d
    ? new Date(d).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

/** Order-ID display: last 8 chars uppercased */
export const shortId = (id) => (id ? `#${String(id).slice(-8).toUpperCase()}` : '');

/** Human-friendly role labels */
export const roleLabel = (role) =>
  ({ admin: 'Admin', sales: 'Sales Person', user: 'Customer' }[role] || role);
