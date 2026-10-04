"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { products } from "@/data/products";

export type CartItem = {
  slug: string;
  size: string;
  qty: number;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  total: number;
  add: (slug: string, size: string) => void;
  setQty: (slug: string, size: string, qty: number) => void;
  remove: (slug: string, size: string) => void;
};

const STORAGE_KEY = "arc-cart";
const CHANGE_EVENT = "arc-cart-change";

const CartContext = createContext<CartContextValue | null>(null);

// The cart lives in localStorage and is read through useSyncExternalStore, so the server
// render (empty cart) and the first client render match, with no effect needed.
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

function getSnapshot(): string {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    // Storage blocked (private mode): the cart starts empty.
    return "";
  }
}

function getServerSnapshot(): string {
  return "";
}

function parse(raw: string): CartItem[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    return [];
  }
}

function save(items: CartItem[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage unavailable: the cart still works for this visit.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function priceOf(slug: string): number {
  const product = products.find((item) => item.slug === slug);
  return product ? product.price : 0;
}

const same = (item: CartItem, slug: string, size: string) => item.slug === slug && item.size === size;

export function CartProvider({ children }: { children: ReactNode }) {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const items = useMemo(() => parse(raw), [raw]);

  const add = useCallback(
    (slug: string, size: string) => {
      const current = parse(getSnapshot());
      const exists = current.some((item) => same(item, slug, size));
      save(
        exists
          ? current.map((item) => (same(item, slug, size) ? { ...item, qty: Math.min(item.qty + 1, 10) } : item))
          : [...current, { slug, size, qty: 1 }],
      );
    },
    [],
  );

  const setQty = useCallback((slug: string, size: string, qty: number) => {
    const current = parse(getSnapshot());
    save(
      current
        .map((item) => (same(item, slug, size) ? { ...item, qty: Math.min(Math.max(qty, 0), 10) } : item))
        .filter((item) => item.qty > 0),
    );
  }, []);

  const remove = useCallback((slug: string, size: string) => {
    save(parse(getSnapshot()).filter((item) => !same(item, slug, size)));
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: items.reduce((sum, item) => sum + item.qty, 0),
      total: items.reduce((sum, item) => sum + item.qty * priceOf(item.slug), 0),
      add,
      setQty,
      remove,
    }),
    [items, add, setQty, remove],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
