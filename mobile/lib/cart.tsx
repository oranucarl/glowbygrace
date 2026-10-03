// The account bag — the same cart_items rows the website uses.
// Supabase Realtime pushes every change, so adding on the website shows up here instantly (and back).
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { useAuth } from './auth';

export type CartLine = { productId: string; length: string; color: string | null; qty: number };

type Cart = {
  lines: CartLine[];
  count: number;
  loading: boolean;
  add: (productId: string, length: string, color: string | null, qty: number) => Promise<void>;
  setQty: (line: CartLine, qty: number) => Promise<void>;
  remove: (line: CartLine) => Promise<void>;
  refresh: () => Promise<void>;
};

const CartContext = createContext<Cart | null>(null);
const keys = (l: { productId: string; length: string; color: string | null }) => ({
  product_id: l.productId,
  length: l.length,
  color: l.color || '',
});

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    if (!user) return setLines([]);
    const { data, error } = await supabase.from('cart_items').select('*').order('created_at');
    if (error) return console.warn(error.message);
    setLines(data.map((r: any) => ({ productId: r.product_id, length: r.length, color: r.color || null, qty: r.quantity })));
  }, [user?.id]);

  const refresh = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    await load();
  }, [load]);
  const soon = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(load, 150);
  }, [load]);

  // load + subscribe to live changes whenever the signed-in account changes
  useEffect(() => {
    let channel: RealtimeChannel | null = null;
    if (user) {
      setLoading(true);
      load().finally(() => setLoading(false));
      channel = supabase
        .channel(`cart-${user.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'cart_items', filter: `user_id=eq.${user.id}` }, soon)
        // delete events can't be filtered by user, so any delete triggers a (RLS-protected) refetch
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'cart_items' }, soon)
        .subscribe();
    } else {
      setLines([]);
    }
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // catch up after the app was in the background
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => s === 'active' && soon());
    return () => sub.remove();
  }, [soon]);

  async function write(run: () => PromiseLike<{ error: any }>) {
    const { error } = await run();
    if (error) throw new Error(error.message);
    soon();
  }

  const value: Cart = {
    lines,
    count: lines.reduce((s, l) => s + l.qty, 0),
    loading,
    refresh,
    async add(productId, length, color, qty) {
      if (!user) throw new Error('Please sign in to add to your bag.');
      // show it straight away; the database (and realtime) confirm it
      setLines((ls) => {
        const hit = ls.find((l) => l.productId === productId && l.length === length && l.color === color);
        return hit ? ls.map((l) => (l === hit ? { ...l, qty: l.qty + qty } : l)) : [...ls, { productId, length, color, qty }];
      });
      await write(() => supabase.rpc('add_to_cart', { p_product_id: productId, p_length: length, p_color: color || '', p_quantity: qty }));
    },
    async setQty(line, qty) {
      if (qty < 1) return value.remove(line);
      setLines((ls) => ls.map((l) => (l === line ? { ...l, qty } : l)));
      await write(() => supabase.from('cart_items').update({ quantity: qty }).match(keys(line)));
    },
    async remove(line) {
      setLines((ls) => ls.filter((l) => l !== line));
      await write(() => supabase.from('cart_items').delete().match(keys(line)));
    },
  };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
