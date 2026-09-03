import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState({ items: [], itemsCount: 0, total: 0 });
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setCart({ items: [], itemsCount: 0, total: 0 });
      return;
    }
    try {
      const { data } = await api.get('/cart');
      setCart(data);
    } catch {
      /* cart fetch is non-critical */
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addToCart = useCallback(async (productId, quantity = 1) => {
    setLoading(true);
    try {
      const { data } = await api.post('/cart', { productId, quantity });
      setCart(data);
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateQuantity = useCallback(async (productId, quantity) => {
    const { data } = await api.put(`/cart/${productId}`, { quantity });
    setCart(data);
    return data;
  }, []);

  const removeFromCart = useCallback(async (productId) => {
    const { data } = await api.delete(`/cart/${productId}`);
    setCart(data);
    return data;
  }, []);

  const clearCart = useCallback(async () => {
    const { data } = await api.delete('/cart');
    setCart({ ...data, items: [] });
    return data;
  }, []);

  const quantityOf = useCallback(
    (productId) => cart.items.find((i) => i.product?._id === productId)?.quantity || 0,
    [cart]
  );

  return (
    <CartContext.Provider
      value={{ cart, loading, refresh, addToCart, updateQuantity, removeFromCart, clearCart, quantityOf }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
