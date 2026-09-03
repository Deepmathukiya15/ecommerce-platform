const ORDER_STATUS_META = {
  pending: { label: 'Pending', cls: 'bg-slate-100 text-slate-600' },
  paid: { label: 'Paid', cls: 'bg-blue-100 text-blue-700' },
  processing: { label: 'Processing', cls: 'bg-amber-100 text-amber-700' },
  shipped: { label: 'Shipped', cls: 'bg-indigo-100 text-indigo-700' },
  delivered: { label: 'Delivered', cls: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', cls: 'bg-red-100 text-red-700' },
};

export default function StatusBadge({ status }) {
  const meta = ORDER_STATUS_META[status] || { label: status, cls: 'bg-slate-100 text-slate-600' };
  return (
    <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-bold capitalize ${meta.cls}`}>
      {meta.label}
    </span>
  );
}

export const ORDER_STATUSES = Object.keys(ORDER_STATUS_META);
