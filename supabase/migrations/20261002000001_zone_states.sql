-- Which Nigerian states each delivery option covers. Checkout applies the zone
-- automatically from the customer's state. An empty list = "all other states".
alter table public.delivery_zones add column states text[] not null default '{}';

update public.delivery_zones set states = '{Lagos}' where name = 'Within Lagos';
