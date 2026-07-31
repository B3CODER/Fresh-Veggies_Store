import { createContext, useContext, useState, ReactNode } from 'react';
import type { CartItem, Vegetable } from '../types/database';

interface CartContextValue {
  items: CartItem[];
  addItem: (vegetable: Vegetable) => void;
  removeItem: (vegetableId: string) => void;
  updateQuantity: (vegetableId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalAmount: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  function addItem(vegetable: Vegetable) {
    setItems((prev) => {
      const existing = prev.find((i) => i.vegetable.id === vegetable.id);
      if (existing) {
        return prev.map((i) =>
          i.vegetable.id === vegetable.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...prev, { vegetable, quantity: 1 }];
    });
  }

  function removeItem(vegetableId: string) {
    setItems((prev) => prev.filter((i) => i.vegetable.id !== vegetableId));
  }

  function updateQuantity(vegetableId: string, quantity: number) {
    if (quantity <= 0) {
      removeItem(vegetableId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.vegetable.id === vegetableId ? { ...i, quantity } : i)),
    );
  }

  function clearCart() {
    setItems([]);
  }

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalAmount = items.reduce((sum, i) => sum + i.vegetable.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
