import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/config';
import { CartLine } from '@/types';

interface CartState {
  lines: CartLine[];
  itemCount: number;
  subtotal: number;
  isEmpty: boolean;
  hydrated: boolean;
  add: (line: Omit<CartLine, 'quantity'>, quantity?: number) => void;
  setQuantity: (key: string, quantity: number) => void;
  increment: (key: string) => void;
  decrement: (key: string) => void;
  remove: (key: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartState | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const hydratedRef = useRef(false);

  // Hydrate once.
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEYS.cart);
        if (raw) setLines(JSON.parse(raw) as CartLine[]);
      } catch {
        /* ignore */
      } finally {
        hydratedRef.current = true;
        setHydrated(true);
      }
    })();
  }, []);

  // Persist after hydration (avoid clobbering stored cart with the empty initial state).
  useEffect(() => {
    if (!hydratedRef.current) return;
    AsyncStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(lines)).catch(() => {});
  }, [lines]);

  const value = useMemo<CartState>(() => {
    const itemCount = lines.reduce((n, l) => n + l.quantity, 0);
    const subtotal = lines.reduce((n, l) => n + l.unitPrice * l.quantity, 0);

    const setQuantity = (key: string, quantity: number) =>
      setLines((prev) =>
        quantity <= 0
          ? prev.filter((l) => l.key !== key)
          : prev.map((l) => (l.key === key ? { ...l, quantity } : l)),
      );

    return {
      lines,
      itemCount,
      subtotal,
      isEmpty: lines.length === 0,
      hydrated,
      add: (line, quantity = 1) =>
        setLines((prev) => {
          const existing = prev.find((l) => l.key === line.key);
          if (existing) {
            return prev.map((l) =>
              l.key === line.key ? { ...l, quantity: l.quantity + quantity } : l,
            );
          }
          return [...prev, { ...line, quantity }];
        }),
      setQuantity,
      increment: (key) =>
        setLines((prev) =>
          prev.map((l) => (l.key === key ? { ...l, quantity: l.quantity + 1 } : l)),
        ),
      decrement: (key) =>
        setLines((prev) =>
          prev
            .map((l) => (l.key === key ? { ...l, quantity: l.quantity - 1 } : l))
            .filter((l) => l.quantity > 0),
        ),
      remove: (key) => setLines((prev) => prev.filter((l) => l.key !== key)),
      clear: () => setLines([]),
    };
  }, [lines, hydrated]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartState {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
