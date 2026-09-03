import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import ProductImage from '../components/ProductImage';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast, errMsg } from '../context/ToastContext';
import { formatINR, formatDate, roleLabel } from '../utils/format';
import { btnGhost, btnOutline, btnPrimary, lg, roleBadgeClass, sm } from '../utils/ui';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, canSell } = useAuth();
  const { addToCart } = useCart();
  const { has, toggle } = useWishlist();
  const { success, error } = useToast();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/products/${id}`)
      .then(({ data }) => setProduct(data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader full label="Loading product…" />;
  if (notFound || !product)
    return (
      <div className="mx-auto w-full max-w-2xl px-5 pb-14 pt-7">
        <EmptyState icon="🕳️" title="Product not found" message="It may have been removed by the seller." actionLabel="Back to shop" actionTo="/" />
      </div>
    );

  const outOfStock = product.stock <= 0;
  const isOwner = canSell && product.seller?._id === user?._id;

  const onAdd = async () => {
    if (!user) {
      error('Please log in to add items to your cart');
      return navigate('/login', { state: { from: `/products/${id}` } });
    }
    setBusy(true);
    try {
      await addToCart(product._id, qty);
      success(`Added ${qty} × "${product.name}" to cart`);
    } catch (err) {
      error(errMsg(err, 'Could not add to cart'));
    } finally {
      setBusy(false);
    }
  };

  const onWishlist = async () => {
    if (!user) {
      error('Please log in to use your wishlist');
      return navigate('/login', { state: { from: `/products/${id}` } });
    }
    try {
      const added = await toggle(product._id);
      success(added ? 'Added to wishlist ♥' : 'Removed from wishlist');
    } catch (err) {
      error(errMsg(err));
    }
  };

  const stepperBtn = 'h-10 w-9 border-none bg-transparent text-lg font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-40';

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-14 pt-7">
      <nav className="mb-4 flex flex-wrap items-center gap-2 text-sm text-slate-500" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-indigo-600">Shop</Link> <span className="text-slate-300">/</span>
        <Link to={`/?category=${encodeURIComponent(product.category)}`} className="hover:text-indigo-600">{product.category}</Link>
        <span className="text-slate-300">/</span>
        <span className="font-semibold text-slate-900">{product.name}</span>
      </nav>

      <div className="grid items-start gap-9 lg:grid-cols-2">
        <div className="lg:sticky lg:top-20">
          <ProductImage images={product.images} name={product.name} className="aspect-square w-full rounded-2xl border border-slate-200 bg-white object-cover" />
          {product.images?.length > 1 && (
            <div className="mt-3 flex gap-2.5">
              {product.images.map((img, i) => (
                <img key={i} src={img.url} alt={`${product.name} view ${i + 1}`} className="h-[74px] w-[74px] cursor-pointer rounded-xl border border-slate-200 object-cover" />
              ))}
            </div>
          )}
        </div>

        <div>
          <span className="mb-2.5 inline-block rounded-full bg-indigo-50 px-3.5 py-1 text-xs font-bold text-indigo-700">{product.category}</span>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{product.name}</h1>
          {product.brand && <p className="mt-1 text-sm text-slate-500">Brand: <strong className="text-slate-700">{product.brand}</strong></p>}
          <p className="mt-2 text-3xl font-extrabold text-indigo-700">{formatINR(product.price)}</p>

          <p className={`mt-1.5 text-sm font-bold ${outOfStock ? 'text-red-600' : product.stock <= 5 ? 'text-amber-600' : 'text-green-600'}`}>
            {outOfStock ? '✕ Out of stock' : product.stock <= 5 ? `⚠ Hurry — only ${product.stock} left` : `✓ In stock (${product.stock} available)`}
          </p>

          <p className="mb-6 mt-4 leading-relaxed text-slate-700">{product.description}</p>

          <div className="mb-6 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center overflow-hidden rounded-lg border border-slate-200 bg-white">
              <button className={stepperBtn} onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">−</button>
              <span className="min-w-[42px] text-center font-bold">{qty}</span>
              <button className={stepperBtn} onClick={() => setQty((q) => Math.min(product.stock || 1, q + 1))} aria-label="Increase quantity">+</button>
            </div>
            <button className={`${btnPrimary} ${lg}`} onClick={onAdd} disabled={outOfStock || busy}>
              {busy ? 'Adding…' : outOfStock ? 'Sold out' : 'Add to cart'}
            </button>
            <button
              className={`${btnOutline} ${lg} ${has(product._id) ? '!border-pink-500 !bg-pink-50 !text-pink-600' : ''}`}
              onClick={onWishlist}
            >
              {has(product._id) ? '♥ Wishlisted' : '♡ Wishlist'}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3.5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 text-lg font-extrabold text-white">
              {product.seller?.name?.charAt(0) || '?'}
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <strong className="text-sm text-slate-900">Sold by {product.seller?.name || 'Unknown'}</strong>
              <span className={roleBadgeClass(product.seller?.role)}>{roleLabel(product.seller?.role)}</span>
              <p className="text-xs text-slate-500">Listed on {formatDate(product.createdAt)}</p>
            </div>
            {isOwner && (
              <Link className={`${btnGhost} ${sm}`} to={`/products/${product._id}/edit`}>Edit product</Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
