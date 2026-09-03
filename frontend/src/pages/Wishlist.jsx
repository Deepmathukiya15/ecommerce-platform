import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useToast, errMsg } from '../context/ToastContext';
import EmptyState from '../components/EmptyState';
import ProductImage from '../components/ProductImage';
import { formatINR } from '../utils/format';
import { btnGhost, btnPrimary, sm } from '../utils/ui';

export default function Wishlist() {
  const { products, toggle } = useWishlist();
  const { addToCart } = useCart();
  const { success, error } = useToast();

  if (products.length === 0) {
    return (
      <div className="mx-auto w-full max-w-2xl px-5 pb-14 pt-7">
        <EmptyState icon="♥" title="Your wishlist is empty" message="Tap the heart on any product to save it for later." actionLabel="Explore products" actionTo="/" />
      </div>
    );
  }

  const moveToCart = async (p) => {
    try {
      await addToCart(p._id, 1);
      await toggle(p._id);
      success(`"${p.name}" moved to cart`);
    } catch (err) {
      error(errMsg(err, 'Could not move to cart'));
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-14 pt-7">
      <h1 className="mb-5 text-2xl font-extrabold text-slate-900">
        My Wishlist{' '}
        <span className="rounded-full bg-pink-50 px-3 py-0.5 align-middle text-base font-bold text-pink-600">{products.length}</span>
      </h1>

      <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]">
        {products.map((p) => (
          <div key={p._id} className="grid grid-cols-[92px_1fr] gap-3.5 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
            <Link to={`/products/${p._id}`} className="h-[92px] w-[92px] overflow-hidden rounded-xl bg-slate-50">
              <ProductImage images={p.images} name={p.name} className="h-full w-full object-cover" />
            </Link>
            <div className="flex min-w-0 flex-col gap-1">
              <Link to={`/products/${p._id}`} className="truncate font-bold text-slate-900 hover:text-indigo-600">{p.name}</Link>
              <span className="font-extrabold text-indigo-700">{formatINR(p.price)}</span>
              <span className={`text-xs font-semibold ${p.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {p.stock > 0 ? `In stock (${p.stock})` : 'Out of stock'}
              </span>
              <div className="mt-1.5 flex gap-2">
                <button className={`${btnPrimary} ${sm}`} onClick={() => moveToCart(p)} disabled={p.stock <= 0}>Move to cart</button>
                <button className={`${btnGhost} ${sm}`} onClick={() => toggle(p._id)}>Remove</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
