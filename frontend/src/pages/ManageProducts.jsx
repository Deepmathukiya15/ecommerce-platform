import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast, errMsg } from '../context/ToastContext';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import ProductImage from '../components/ProductImage';
import confirmDialog from '../components/ConfirmDialog';
import { formatINR, formatDate } from '../utils/format';
import { btnDanger, btnGhost, btnPrimary, input, md, xs } from '../utils/ui';

const th = 'whitespace-nowrap border-b border-slate-200 bg-slate-50 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500';
const td = 'border-b border-slate-100 px-4 py-3 align-middle';

/**
 * Product management table.
 *  - Admin  (scope="all")  → sees & manages EVERY product, can activate/deactivate
 *  - Sales  (scope="mine") → sees & manages ONLY their own products (backend enforces too)
 */
export default function ManageProducts({ scope = 'mine' }) {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [rows, setRows] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [debounced, setDebounced] = useState('');
  const [pageInfo, setPageInfo] = useState({ page: 1, pages: 1, total: 0 });
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => { setDebounced(keyword); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [keyword]);

  const fetchProducts = useCallback(async () => {
    const q = new URLSearchParams({ limit: 10, page, includeInactive: '1' });
    if (debounced) q.set('keyword', debounced);
    if (scope === 'mine') q.set('seller', 'mine');
    try {
      const { data } = await api.get(`/products?${q}`);
      setRows(data.products);
      setPageInfo({ page: data.page, pages: data.pages, total: data.total });
    } catch (err) {
      error(errMsg(err, 'Could not load products'));
      setRows([]);
    }
  }, [debounced, page, scope, error]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const onDelete = async (p) => {
    const ok = await confirmDialog({
      title: `Delete "${p.name}"?`,
      message: 'This removes the product and its Cloudinary images. This cannot be undone.',
      confirmLabel: 'Delete product',
    });
    if (!ok) return;
    try {
      await api.delete(`/products/${p._id}`);
      success('Product deleted');
      fetchProducts();
    } catch (err) {
      error(errMsg(err, 'Delete failed'));
    }
  };

  const onToggleActive = async (p) => {
    try {
      await api.put(`/products/${p._id}`, { isActive: !p.isActive });
      success(p.isActive ? 'Product deactivated' : 'Product activated');
      fetchProducts();
    } catch (err) {
      error(errMsg(err));
    }
  };

  const title = scope === 'all' ? 'All Products (Admin)' : 'My Products';

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-14 pt-7">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">{title}</h1>
          <p className="mt-0.5 max-w-xl text-sm text-slate-500">
            {scope === 'all'
              ? 'Full control — manage every seller’s products, activate or deactivate listings.'
              : 'Add, edit and delete the products you own. Other sellers’ products are off-limits (enforced by the backend).'}
          </p>
        </div>
        <Link to="/products/new" className={`${btnPrimary} ${md}`}>+ Add Product</Link>
      </div>

      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
        <input
          type="search" placeholder="Search by name, brand, category…" value={keyword}
          onChange={(e) => setKeyword(e.target.value)} aria-label="Search products"
          className={`${input} max-w-sm`}
        />
        <span className="text-sm text-slate-500">{pageInfo.total} product{pageInfo.total === 1 ? '' : 's'}</span>
      </div>

      {rows === null ? (
        <Loader label="Loading products…" />
      ) : rows.length === 0 ? (
        <EmptyState
          icon="🗂️"
          title={scope === 'mine' ? 'You have no products yet' : 'No products found'}
          message={scope === 'mine' ? 'Create your first listing — it takes under a minute.' : 'Try a different search.'}
          actionLabel={scope === 'mine' ? '+ Add your first product' : undefined}
          actionTo={scope === 'mine' ? '/products/new' : undefined}
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className={th}>Product</th>
                <th className={th}>Category</th>
                <th className={th}>Price</th>
                <th className={th}>Stock</th>
                {scope === 'all' && <th className={th}>Seller</th>}
                {scope === 'all' && <th className={th}>Status</th>}
                <th className={th}>Created</th>
                <th className={`${th} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p._id} className={`hover:bg-indigo-50/30 ${!p.isActive ? 'opacity-55' : ''}`}>
                  <td className={td}>
                    <div className="flex min-w-[190px] items-center gap-2.5">
                      <ProductImage images={p.images} name={p.name} className="h-11 w-11 shrink-0 rounded-lg border border-slate-200 bg-slate-100 object-cover" />
                      <Link to={`/products/${p._id}`} className="max-w-[240px] truncate font-bold text-slate-900 hover:text-indigo-600">{p.name}</Link>
                    </div>
                  </td>
                  <td className={td}><span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700">{p.category}</span></td>
                  <td className={td}>{formatINR(p.price)}</td>
                  <td className={td}>
                    <span className={`inline-block min-w-[34px] rounded-full px-2.5 py-0.5 text-center text-xs font-bold ${p.stock === 0 ? 'bg-red-100 text-red-700' : p.stock <= 5 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                      {p.stock}
                    </span>
                  </td>
                  {scope === 'all' && <td className={td}>{p.seller?.name || '—'}{p.seller?._id === user._id && <em> (you)</em>}</td>}
                  {scope === 'all' && (
                    <td className={td}>
                      <button
                        className={`cursor-pointer rounded-full px-3 py-0.5 text-xs font-bold capitalize ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                        onClick={() => onToggleActive(p)}
                        title="Click to toggle"
                      >
                        {p.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                  )}
                  <td className={`${td} text-slate-500`}>{formatDate(p.createdAt).split(',')[0]}</td>
                  <td className={`${td} whitespace-nowrap text-right`}>
                    <Link className={`${btnGhost} ${xs}`} to={`/products/${p._id}/edit`}>Edit</Link>{' '}
                    <button className={`${btnDanger} ${xs}`} onClick={() => onDelete(p)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pageInfo.pages > 1 && (
        <nav className="mt-7 flex items-center justify-center gap-2">
          <button className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold disabled:opacity-40" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
          <span className="text-sm text-slate-500">Page {pageInfo.page} of {pageInfo.pages}</span>
          <button className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold disabled:opacity-40" disabled={page >= pageInfo.pages} onClick={() => setPage(page + 1)}>Next →</button>
        </nav>
      )}
    </div>
  );
}
