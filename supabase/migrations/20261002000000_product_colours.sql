-- Optional colour choices per product (e.g. {"Natural black","1B","Honey blonde"}).
-- Empty = the product has no colour option. Price and stock are per length.
alter table public.products add column colors text[] not null default '{}';

-- the colour the customer chose, kept on the order line
alter table public.order_items add column color text;
