// Products and delivery zones — the same tables the website reads.
import { useEffect, useState } from 'react';
import { supabase } from './supabase';

export type Length = { id: string; len: string; price: number; stock: number | null };
export type Product = {
  id: string;
  name: string;
  tagline: string;
  category: string;
  badge: string;
  lace: string;
  density: string;
  desc: string;
  model: string;
  sample: string;
  colors: string[];
  featured: boolean;
  lengths: Length[];
};
export type Zone = { id: string; name: string; description: string | null; fee: number; states: string[]; sort: number };

export const CATEGORIES = [
  { key: 'all', label: 'All hair' },
  { key: 'straight', label: 'Bone straight' },
  { key: 'curly', label: 'Curly' },
  { key: 'wavy', label: 'Wavy' },
  { key: 'bob', label: 'Bobs' },
  { key: 'braids', label: 'Braids' },
  { key: 'colored', label: 'Colour' },
  { key: 'bundles', label: 'Bundles' },
  { key: 'closure', label: 'Closures' },
];

export const STATES = ['Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT (Abuja)', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'];

export const inStock = (l: Length) => l.stock === null || l.stock === undefined || l.stock > 0;
export const soldOut = (p: Product) => !p.lengths.some(inStock);
export const minPrice = (p: Product) => {
  const avail = p.lengths.filter(inStock);
  return Math.min(...(avail.length ? avail : p.lengths).map((l) => l.price));
};

function mapProduct(r: any): Product {
  return {
    id: r.id,
    name: r.name,
    tagline: r.tagline || '',
    category: r.category,
    badge: r.badge || '',
    lace: r.lace || '—',
    density: r.density || '—',
    desc: r.description || '',
    model: r.model_url || '',
    sample: r.sample_url || r.model_url || '',
    colors: r.colors || [],
    featured: r.featured,
    lengths: (r.product_variants || [])
      .slice()
      .sort((a: any, b: any) => a.sort - b.sort || a.price - b.price)
      .map((v: any) => ({ id: v.id, len: v.length, price: v.price, stock: v.stock })),
  };
}

let cache: { products: Product[]; zones: Zone[] } | null = null;

export async function loadCatalog(force = false) {
  if (cache && !force) return cache;
  const [prods, zones] = await Promise.all([
    supabase.from('products').select('*, product_variants(*)').eq('active', true).order('sort').order('name'),
    supabase.from('delivery_zones').select('*').eq('active', true).order('sort'),
  ]);
  if (prods.error) throw prods.error;
  if (zones.error) throw zones.error;
  cache = {
    products: prods.data.map(mapProduct).filter((p) => p.lengths.length),
    zones: zones.data.map((z: any) => ({ ...z, states: z.states || [] })),
  };
  return cache;
}

export function useCatalog() {
  const [state, setState] = useState<{ products: Product[]; zones: Zone[]; loading: boolean; error: string | null }>({
    products: cache?.products || [],
    zones: cache?.zones || [],
    loading: !cache,
    error: null,
  });
  const refresh = async (force = true) => {
    try {
      const c = await loadCatalog(force);
      setState({ ...c, loading: false, error: null });
    } catch (e: any) {
      setState((s) => ({ ...s, loading: false, error: "We couldn't load the collection. Pull down to try again." }));
    }
  };
  useEffect(() => {
    refresh(false);
  }, []);
  return { ...state, refresh };
}

// Same rule as the website and the checkout server function.
const norm = (s: string) => String(s || '').toLowerCase().replace(/\(.*?\)/g, '').trim();
export function zoneFor(zones: Zone[], state: string) {
  if (!state) return null;
  return zones.find((z) => z.states.some((s) => norm(s) === norm(state))) || zones.find((z) => !z.states.length) || null;
}
