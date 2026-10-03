// Order shapes and status labels — same wording as the website.
export type OrderItem = { id: string; product_name: string; length: string; color: string | null; unit_price: number; quantity: number; line_total: number; image_url: string | null };
export type Order = {
  id: string;
  order_number: string;
  status: string;
  total: number;
  subtotal: number;
  delivery_fee: number;
  delivery_zone_name: string;
  customer_name: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  notes: string | null;
  payment_reference: string | null;
  payment_channel: string | null;
  paid_at: string | null;
  created_at: string;
  order_items: OrderItem[];
  order_events?: { status: string; created_at: string }[];
};

export const STATUS: Record<string, { label: string; bg: string; fg: string }> = {
  pending_payment: { label: 'Awaiting payment', bg: '#fde6d8', fg: '#9a3d12' },
  paid: { label: 'Paid', bg: '#dff3e5', fg: '#17663a' },
  processing: { label: 'Being prepared', bg: '#f3e6cf', fg: '#7a5520' },
  shipped: { label: 'On its way', bg: '#f3e6cf', fg: '#7a5520' },
  delivered: { label: 'Delivered', bg: '#2a1a14', fg: '#f7f0e7' },
  cancelled: { label: 'Cancelled', bg: '#efe4d6', fg: '#8a7366' },
};
export const FLOW = ['paid', 'processing', 'shipped', 'delivered'];
