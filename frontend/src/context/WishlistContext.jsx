import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);

  const refresh = useCallback(async () => {
    if (!user) {
      setProducts([]);
      return;
    }
    try {
      const { data } = await api.get('/wishlist');
      setProducts(data.products || []);
    } catch {
      /* non-critical */
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggle = useCallback(
    async (productId) => {
      const inList = products.some((p) => p._id === productId);
      const { data } = inList
        ? await api.delete(`/wishlist/${productId}`)
        : await api.post('/wishlist', { productId });
      setProducts(data.products || []);
      return !inList; // returns true when the item was ADDED
    },
    [products]
  );

  const has = useCallback((productId) => products.some((p) => p._id === productId), [products]);

  return (
    <WishlistContext.Provider value={{ products, count: products.length, refresh, toggle, has }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
