import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';
import Pagination from '../components/Pagination';
import EmptyState from '../components/EmptyState';
import { btnGhost, btnPrimary, input, md, sm } from '../utils/ui';

const SORTS = [
  { value: '-createdAt', label: 'Newest first' },
  { value: 'price-asc', label: 'Price: low → high' },
  { value: 'price-desc', label: 'Price: high → low' },
  { value: 'name', label: 'Name: A → Z' },
];

export default function Home() {
  const [params, setParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pageInfo, setPageInfo] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [keyword, setKeyword] = useState(params.get('keyword') || '');
  const [debounced, setDebounced] = useState(keyword);
  const [category, setCategory] = useState(params.get('category') || '');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('-createdAt');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setKeyword(params.get('keyword') || '');
  }, [params]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(keyword), 350);
    return () => clearTimeout(t);
  }, [keyword]);

  useEffect(() => {
    setPage(1);
  }, [debounced, category, minPrice, maxPrice, sort]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (debounced) q.set('keyword', debounced);
      if (category) q.set('category', category);
      if (minPrice) q.set('minPrice', minPrice);
      if (maxPrice) q.set('maxPrice', maxPrice);
      q.set('sort', sort);
      q.set('page', page);
      q.set('limit', 12);
      const { data } = await api.get(`/products?${q.toString()}`);
      setProducts(data.products);
      setPageInfo({ page: data.page, pages: data.pages, total: data.total });
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [debounced, category, minPrice, maxPrice, sort, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    api.get('/products/categories').then((r) => setCategories(r.data)).catch(() => {});
  }, []);

  const clearFilters = () => {
    setKeyword('');
    setCategory('');
    setMinPrice('');
    setMaxPrice('');
    setSort('-createdAt');
    setParams({});
  };

  const hasActiveFilters = Boolean(keyword || category || minPrice || maxPrice);

  const filterLabel = 'mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500';
  const catPill = (active) =>
    `rounded-full border px-3 py-1 text-xs font-semibold transition ${
      active ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-400 hover:text-indigo-600'
    }`;

  const filterPanel = (
    <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-20">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-900">Filters</h3>
        {hasActiveFilters && (
          <button className="bg-transparent text-sm font-semibold text-indigo-600 hover:underline" onClick={clearFilters}>Clear all</button>
        )}
      </div>

      <div className="mb-4">
        <label htmlFor="f-search" className={filterLabel}>Keyword</label>
        <input id="f-search" type="search" placeholder="Search name, brand…" value={keyword} onChange={(e) => setKeyword(e.target.value)} className={input} />
      </div>

      <div className="mb-4">
        <span className={filterLabel}>Category</span>
        <div className="flex flex-wrap gap-1.5">
          <button className={catPill(!category)} onClick={() => setCategory('')}>All</button>
          {categories.map((c) => (
            <button key={c} className={catPill(category === c)} onClick={() => setCategory(c)}>{c}</button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <span className={filterLabel}>Price range (₹)</span>
        <div className="flex items-center gap-2">
          <input type="number" min="0" placeholder="Min" aria-label="Minimum price" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className={input} />
          <span className="text-slate-400">—</span>
          <input type="number" min="0" placeholder="Max" aria-label="Maximum price" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className={input} />
        </div>
      </div>

      <div>
        <label htmlFor="f-sort" className={filterLabel}>Sort by</label>
        <select id="f-sort" value={sort} onChange={(e) => setSort(e.target.value)} className={input}>
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>
    </aside>
  );

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-slate-200 bg-gradient-to-b from-indigo-50/80 via-white to-purple-50">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-8 px-5 py-14 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <span className="mb-3.5 inline-block rounded-full border border-slate-200 bg-white px-3.5 py-1 text-xs font-semibold text-indigo-700 shadow-sm">
              ⚡ Multi-vendor marketplace
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
              Everything you need,{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">one kart away</span>
            </h1>
            <p className="mt-3 max-w-lg text-base text-slate-500">
              Browse products from verified sellers, pay securely with Razorpay and track your orders — all in one place.
            </p>
            <form
              className="mt-6 flex max-w-xl gap-2.5"
              onSubmit={(e) => {
                e.preventDefault();
                setParams(keyword ? { keyword } : {});
              }}
            >
              <input
                type="search"
                placeholder="Search for headphones, sneakers, books…"
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value);
                  setParams(e.target.value ? { keyword: e.target.value } : {});
                }}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm outline-none focus:border-indigo-500"
                aria-label="Search products"
              />
              <button type="submit" className={`${btnPrimary} ${md}`}>Search</button>
            </form>
          </div>
          <div className="relative hidden h-64 lg:block" aria-hidden="true">
            <div className="animate-float absolute left-[12%] top-2 flex h-28 w-28 items-center justify-center rounded-2xl border border-slate-200 bg-white text-5xl shadow-xl">🎧</div>
            <div className="animate-float absolute right-[14%] top-0 flex h-28 w-28 items-center justify-center rounded-2xl border border-slate-200 bg-white text-5xl shadow-xl [animation-delay:1.1s]">👟</div>
            <div className="animate-float absolute bottom-1 left-[28%] flex h-28 w-28 items-center justify-center rounded-2xl border border-slate-200 bg-white text-5xl shadow-xl [animation-delay:2.2s]">⌚</div>
            <div className="animate-float absolute bottom-6 right-[4%] flex h-28 w-28 items-center justify-center rounded-2xl border border-slate-200 bg-white text-5xl shadow-xl [animation-delay:.6s]">📚</div>
          </div>
        </div>
      </section>

      {/* Shop */}
      <div className="mx-auto grid w-full max-w-6xl items-start gap-6 px-5 py-7 lg:grid-cols-[250px_1fr]">
        <button className={`${btnGhost} ${md} w-full lg:hidden`} onClick={() => setFiltersOpen((o) => !o)}>
          {filtersOpen ? 'Hide filters ▲' : 'Filters & Sort ▼'}
        </button>

        <div className={`${filtersOpen ? 'block' : 'hidden'} lg:block`}>{filterPanel}</div>

        <main>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              {loading ? 'Loading products…' : `${pageInfo.total} product${pageInfo.total === 1 ? '' : 's'} found`}
              {debounced && !loading && <> for “<strong className="text-slate-700">{debounced}</strong>”</>}
              {category && !loading && <> in <strong className="text-slate-700">{category}</strong></>}
            </p>
            <select className={`${input} w-auto lg:hidden`} value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort by">
              {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          {loading ? (
            <Loader label="Fetching products…" />
          ) : products.length === 0 ? (
            <EmptyState
              icon="🔎"
              title="No products match your filters"
              message="Try a different keyword, widen the price range or clear the filters."
              actionLabel="Clear filters"
              onAction={clearFilters}
            />
          ) : (
            <>
              <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(215px,1fr))]">
                {products.map((p) => <ProductCard key={p._id} product={p} />)}
              </div>
              <Pagination
                page={pageInfo.page}
                pages={pageInfo.pages}
                onChange={(p) => {
                  setPage(p);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
