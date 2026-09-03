import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { useToast, errMsg } from '../context/ToastContext';
import { formatINR } from '../utils/format';
import ProductImage from './ProductImage';
import { btnPrimary, sm } from '../utils/ui';

export default function ProductCard({ product }) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { has, toggle } = useWishlist();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const outOfStock = product.stock <= 0;
  const inWishlist = has(product._id);

  const requireLogin = () => {
    error('Please log in to use this feature');
    navigate('/login', { state: { from: window.location.pathname } });
    return false;
  };

  const onAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return requireLogin();
    setBusy(true);
    try {
      await addToCart(product._id, 1);
      success(`"${product.name}" added to cart`);
    } catch (err) {
      error(errMsg(err, 'Could not add to cart'));
    } finally {
      setBusy(false);
    }
  };

  const onToggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return requireLogin();
    try {
      const added = await toggle(product._id);
      success(added ? 'Added to wishlist ♥' : 'Removed from wishlist');
    } catch (err) {
      error(errMsg(err, 'Could not update wishlist'));
    }
  };

  return (
    <Link
      to={`/products/${product._id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative aspect-square overflow-hidden bg-slate-50">
        <ProductImage images={product.images} name={product.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
        {outOfStock && (
          <span className="absolute left-2.5 top-2.5 rounded-md bg-red-600 px-2 py-0.5 text-xs font-bold text-white">Out of stock</span>
        )}
        {!outOfStock && product.stock <= 5 && (
          <span className="absolute left-2.5 top-2.5 rounded-md bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">Only {product.stock} left</span>
        )}
        {user && (
          <button
            className={`absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-lg shadow transition hover:scale-110 ${
              inWishlist ? 'text-pink-500' : 'text-slate-400'
            }`}
            onClick={onToggleWishlist}
            aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            {inWishlist ? '♥' : '♡'}
          </button>
        )}
        {product.category && (
          <span className="absolute bottom-2.5 left-2.5 rounded-md bg-slate-900/70 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur">
            {product.category}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3.5">
        <h3 className="line-clamp-2 min-h-[2.5em] text-[15px] font-bold text-slate-900" title={product.name}>
          {product.name}
        </h3>
        <p className="flex flex-wrap gap-1.5 text-xs text-slate-500">
          {product.brand || '—'}
          {product.seller?.name && <span className="rounded-md bg-slate-100 px-1.5 py-px">by {product.seller.name}</span>}
        </p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2.5">
          <span className="text-lg font-extrabold text-slate-900">{formatINR(product.price)}</span>
          <button className={`${btnPrimary} ${sm}`} onClick={onAddToCart} disabled={outOfStock || busy}>
            {outOfStock ? 'Sold out' : busy ? 'Adding…' : 'Add to cart'}
          </button>
        </div>
      </div>
    </Link>
  );
}
