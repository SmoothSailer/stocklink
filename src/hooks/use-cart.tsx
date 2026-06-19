"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  unit: string;
  quantity: number;
  minOrderQty: number;
  maxStock: number;
  imageUrl: string | null;
  category: string;
  piecesPerUnit?: number | null;
  wholesalePrice?: number; // flash deal price
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  total: number;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, unit: string) => void;
  updateQuantity: (productId: string, unit: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "ristoka_cart";

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CartItem[];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // localStorage full or unavailable
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setItems(loadCart());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) saveCart(items);
  }, [items, mounted]);

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => {
      const idx = prev.findIndex(
        (i) => i.productId === item.productId && i.unit === item.unit
      );
      if (idx >= 0) {
        const updated = [...prev];
        const newQty = updated[idx].quantity + item.quantity;
        updated[idx] = {
          ...updated[idx],
          quantity: Math.min(newQty, updated[idx].maxStock),
        };
        return updated;
      }
      return [...prev, item];
    });
  }, []);

  const removeItem = useCallback((productId: string, unit: string) => {
    setItems((prev) =>
      prev.filter((i) => !(i.productId === productId && i.unit === unit))
    );
  }, []);

  const updateQuantity = useCallback(
    (productId: string, unit: string, quantity: number) => {
      setItems((prev) =>
        prev.map((i) =>
          i.productId === productId && i.unit === unit
            ? { ...i, quantity: Math.max(i.minOrderQty, Math.min(quantity, i.maxStock)) }
            : i
        )
      );
    },
    []
  );

  const clearCart = useCallback(() => setItems([]), []);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const total = items.reduce((sum, i) => {
    const price = i.wholesalePrice ?? i.price;
    return sum + price * i.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{ items, itemCount, total, addItem, removeItem, updateQuantity, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within <CartProvider>");
  return ctx;
}
