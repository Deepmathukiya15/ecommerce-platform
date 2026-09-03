import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { roleLabel } from '../utils/format';
import { btn, btnPrimary, btnGhost, sm, roleBadgeClass } from '../utils/ui';

const navLinkCls = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-semibold transition ${
    isActive ? 'bg-indigo-50 text-indigo-600' : 'text-slate-700 hover:bg-indigo-50 hover:text-indigo-700'
  }`;

export default function Navbar() {
  const { user, logout, isAdmin, isSales, canSell } = useAuth();
  const { cart } = useCart();
  const { count: wishCount } = useWishlist();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    navigate(keyword.trim() ? `/?keyword=${encodeURIComponent(keyword.trim())}` : '/');
    setMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    setMenuOpen(false);
    navigate('/');
  };

  const searchInput =
    'w-full min-w-0 rounded-l-lg border border-r-0 border-slate-200 bg-slate-50 px-4 py-2 outline-none focus:border-indigo-500 focus:bg-white';
  const searchBtn = 'rounded-r-lg border border-l-0 border-slate-200 bg-slate-50 px-3 hover:bg-slate-100';
  const iconBtn =
    'relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-xl text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-600';
  const badge =
    'absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[11px] font-bold text-white';

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-5">
        <Link to="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-slate-900" onClick={() => setMenuOpen(false)}>
          <span className="text-2xl">🛒</span>
          <span>
            Shop<span className="text-indigo-600">Kart</span>
          </span>
        </Link>

        {/* Desktop search */}
        <form className="hidden max-w-md flex-1 md:flex" onSubmit={onSearch}>
          <input type="search" placeholder="Search products…" value={keyword} onChange={(e) => setKeyword(e.target.value)} className={searchInput} aria-label="Search products" />
          <button type="submit" className={searchBtn} aria-label="Search">🔍</button>
        </form>

        {/* Desktop nav — adapts by role */}
        <nav className="ml-auto hidden items-center gap-1 lg:flex">
          {isAdmin && (
            <>
              <NavLink to="/admin" className={navLinkCls}>Dashboard</NavLink>
              <NavLink to="/admin/products" className={navLinkCls}>Products</NavLink>
              <NavLink to="/admin/orders" className={navLinkCls}>Orders</NavLink>
              <NavLink to="/admin/users" className={navLinkCls}>Users</NavLink>
            </>
          )}
          {isSales && (
            <>
              <NavLink to="/my-products" className={navLinkCls}>My Products</NavLink>
              <NavLink to="/my-orders" className={navLinkCls}>My Orders</NavLink>
            </>
          )}
          {canSell && <NavLink to="/products/new" className={navLinkCls}>+ Add Product</NavLink>}
          {user && !isAdmin && !isSales && <NavLink to="/my-orders" className={navLinkCls}>My Orders</NavLink>}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-2">
          <Link to="/wishlist" className={iconBtn} aria-label="Wishlist" title="Wishlist">
            <span aria-hidden="true">♥</span>
            {wishCount > 0 && <span className={`${badge} bg-pink-500`}>{wishCount}</span>}
          </Link>

          <Link to="/cart" className={iconBtn} aria-label="Cart" title="Cart">
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {cart.itemsCount > 0 && <span className={`${badge} bg-indigo-600`}>{cart.itemsCount}</span>}
          </Link>

          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button className="flex items-center gap-1.5 rounded-full p-0.5" onClick={() => setDropdownOpen((o) => !o)} aria-haspopup="menu" aria-expanded={dropdownOpen}>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 font-bold text-white">
                  {user.name?.charAt(0).toUpperCase()}
                </span>
                <span className="text-xs text-slate-500">▾</span>
              </button>
              {dropdownOpen && (
                <div className="pop-anim absolute right-0 top-12 z-50 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl" role="menu">
                  <div className="mb-1.5 flex flex-col gap-1 border-b border-slate-100 px-3 py-2.5">
                    <strong className="text-sm text-slate-900">{user.name}</strong>
                    <span className={roleBadgeClass(user.role)}>{roleLabel(user.role)}</span>
                    <small className="text-xs text-slate-500">{user.email}</small>
                  </div>
                  <Link to="/my-orders" className="block rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700" onClick={() => setDropdownOpen(false)}>
                    My Orders
                  </Link>
                  {canSell && (
                    <Link to={isAdmin ? '/admin/products' : '/my-products'} className="block rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700" onClick={() => setDropdownOpen(false)}>
                      Manage Products
                    </Link>
                  )}
                  <button className="block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Link to="/login" className={`${btnGhost} ${sm}`}>Login</Link>
              <Link to="/register" className={`${btnPrimary} ${sm}`}>Sign up</Link>
            </div>
          )}

          <button className="flex flex-col gap-1 rounded-lg p-2 lg:hidden" onClick={() => setMenuOpen((o) => !o)} aria-label="Toggle menu">
            <span className="h-0.5 w-5 rounded bg-slate-900" />
            <span className="h-0.5 w-5 rounded bg-slate-900" />
            <span className="h-0.5 w-5 rounded bg-slate-900" />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="fixed inset-x-0 top-16 z-40 flex flex-col gap-1 border-b border-slate-200 bg-white p-4 shadow-xl lg:hidden">
          <form className="mb-2 flex" onSubmit={onSearch}>
            <input type="search" placeholder="Search products…" value={keyword} onChange={(e) => setKeyword(e.target.value)} className={searchInput} />
            <button type="submit" className={searchBtn}>🔍</button>
          </form>
          {isAdmin && (
            <>
              <NavLink to="/admin" className={navLinkCls} onClick={() => setMenuOpen(false)}>Dashboard</NavLink>
              <NavLink to="/admin/products" className={navLinkCls} onClick={() => setMenuOpen(false)}>Products</NavLink>
              <NavLink to="/admin/orders" className={navLinkCls} onClick={() => setMenuOpen(false)}>Orders</NavLink>
              <NavLink to="/admin/users" className={navLinkCls} onClick={() => setMenuOpen(false)}>Users</NavLink>
            </>
          )}
          {isSales && (
            <>
              <NavLink to="/my-products" className={navLinkCls} onClick={() => setMenuOpen(false)}>My Products</NavLink>
              <NavLink to="/my-orders" className={navLinkCls} onClick={() => setMenuOpen(false)}>My Orders</NavLink>
            </>
          )}
          {canSell && <NavLink to="/products/new" className={navLinkCls} onClick={() => setMenuOpen(false)}>+ Add Product</NavLink>}
          {user && !isAdmin && !isSales && <NavLink to="/my-orders" className={navLinkCls} onClick={() => setMenuOpen(false)}>My Orders</NavLink>}
          {!user && (
            <div className="mt-2 flex gap-2">
              <Link to="/login" className={`${btnGhost} ${sm} flex-1`} onClick={() => setMenuOpen(false)}>Login</Link>
              <Link to="/register" className={`${btnPrimary} ${sm} flex-1`} onClick={() => setMenuOpen(false)}>Sign up</Link>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}
