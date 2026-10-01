-- Starting catalogue (the products the site launched with).
-- Edit or replace them from the admin page.

insert into public.products (id, name, tagline, category, badge, lace, density, description, model_url, sample_url, featured, sort) values
  ('grace-bone-straight', 'Grace Bone Straight', '13x4 HD lace frontal', 'straight', 'Bestseller', '13x4 HD Lace Frontal', '250%', 'Glass-like, double drawn bone straight that moves like silk and stays sleek all day. Pre-plucked hairline, bleached knots.', 'https://images.unsplash.com/photo-1551524267-c0baf940832c?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1747398690600-ffe8ecda9df1?auto=format&fit=crop&w=900&q=80', true, 1),
  ('auburn-silk', 'Auburn Silk', 'Glueless 5x5 closure', 'colored', 'New in', '5x5 HD Lace Closure', '200%', 'A warm copper-auburn straight unit — glueless, pre-cut lace, ready to wear in minutes.', 'https://images.unsplash.com/photo-1648144651811-bc659e2d3334?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1613323885593-5fbcf35bf8ba?auto=format&fit=crop&w=900&q=80', false, 2),
  ('blunt-bob', 'Lagos Blunt Bob', 'Pre-cut 4x4 closure', 'bob', 'Under ₦80k', '4x4 Lace Closure', '180%', 'The everyday power bob. Blunt cut, bone straight and feather-light — wear-and-go.', 'https://images.unsplash.com/photo-1648827966041-f773128fc993?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1630494391399-755f465e8836?auto=format&fit=crop&w=900&q=80', true, 3),
  ('kinky-curly', 'Kinky Curly Crown', '13x4 lace frontal', 'curly', 'Bestseller', '13x4 HD Lace Frontal', '250%', 'Full, bouncy kinky curls that blend with natural 4A–4B textures. Volume for days.', 'https://images.unsplash.com/photo-1585890483046-9461ebc1dace?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1661818302487-467621dd1c19?auto=format&fit=crop&w=900&q=80', true, 4),
  ('deep-wave', 'Deep Wave Diva', '13x6 HD lace frontal', 'wavy', '', '13x6 HD Lace Frontal', '250%', 'Defined, glossy deep waves with a wide 13x6 parting space for every style you can think of.', 'https://images.unsplash.com/photo-1632984814154-6e07a671ae58?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1596911647169-7085321c81b8?auto=format&fit=crop&w=900&q=80', true, 5),
  ('honey-spirals', 'Honey Spirals', 'Glueless 5x5 closure', 'curly', 'New in', '5x5 HD Lace Closure', '200%', 'Soft, honey-brown spiral curls with natural shine. Glueless and beginner friendly.', 'https://images.unsplash.com/photo-1694786702218-12124c2c9bcf?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1560264641-1b5191cc63e2?auto=format&fit=crop&w=900&q=80', false, 6),
  ('knotless-braids', 'Knotless Braid Wig', 'Full lace, hand-braided', 'braids', 'Protective', 'Full Lace', '—', 'Hand-braided knotless braids on a breathable full-lace cap. Zero tension, all of the glam.', 'https://images.unsplash.com/photo-1613099084406-4b9140fc780a?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1663851071150-b6617bbee927?auto=format&fit=crop&w=900&q=80', false, 7),
  ('afro-glam', 'Afro Glam', 'Kinky afro, glueless', 'curly', 'Under ₦80k', '4x4 Lace Closure', '200%', 'A big, beautiful afro unit with a natural kinky texture. Fluff, pick and go.', 'https://images.unsplash.com/photo-1632765866070-3fadf25d3d5b?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1588527962980-72746d95973e?auto=format&fit=crop&w=900&q=80', false, 8),
  ('raw-bundles', 'Raw Hair Bundles', '3 bundles · single donor', 'bundles', '', 'Bundles (no lace)', '100g each', 'Unprocessed raw hair wefts — dye it, curl it, sew it in. Long-lasting, minimal shedding.', 'https://images.unsplash.com/photo-1645736279976-59f8fd22720c?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1715220210514-5b52d4893f65?auto=format&fit=crop&w=900&q=80', false, 9),
  ('platinum-613', 'Platinum 613', '13x4 HD lace frontal', 'colored', 'Statement', '13x4 HD Lace Frontal', '200%', 'Icy 613 blonde — a perfect base for custom colour or a head-turning look as is.', 'https://images.unsplash.com/photo-1593880223042-744ce9a4b58f?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1573617868130-7e757dbad187?auto=format&fit=crop&w=900&q=80', false, 10),
  ('hd-closure', 'HD Lace Closure', '5x5 · melts into any skin', 'closure', 'Add-on', '5x5 HD Lace', '150%', 'Invisible HD lace closure — pre-plucked and bleached. Pair it with any bundle set.', 'https://images.unsplash.com/photo-1692216203899-064d122f0655?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1659443188508-3cd2732285dc?auto=format&fit=crop&w=900&q=80', false, 11),
  ('cornrow-queen', 'Cornrow Queen', 'Braided cornrow unit', 'braids', '', 'Full Lace', '—', 'Neat stitch-braid cornrows on a full-lace base. Looks fresh from the salon chair — every day.', 'https://images.unsplash.com/photo-1652095319417-4bf8a0de1a3d?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1594254773847-9fce26e950bc?auto=format&fit=crop&w=900&q=80', false, 12)
on conflict (id) do nothing;

insert into public.product_variants (product_id, length, price, sort) values
  ('grace-bone-straight', '20"', 165000, 1),
  ('grace-bone-straight', '24"', 195000, 2),
  ('grace-bone-straight', '28"', 235000, 3),
  ('grace-bone-straight', '32"', 285000, 4),
  ('auburn-silk', '18"', 145000, 1),
  ('auburn-silk', '22"', 175000, 2),
  ('auburn-silk', '26"', 210000, 3),
  ('blunt-bob', '10"', 59000, 1),
  ('blunt-bob', '12"', 69000, 2),
  ('blunt-bob', '14"', 79000, 3),
  ('kinky-curly', '16"', 135000, 1),
  ('kinky-curly', '20"', 165000, 2),
  ('kinky-curly', '24"', 199000, 3),
  ('deep-wave', '22"', 189000, 1),
  ('deep-wave', '26"', 229000, 2),
  ('deep-wave', '30"', 275000, 3),
  ('honey-spirals', '16"', 115000, 1),
  ('honey-spirals', '20"', 139000, 2),
  ('knotless-braids', '26"', 85000, 1),
  ('knotless-braids', '30"', 98000, 2),
  ('knotless-braids', '36"', 115000, 3),
  ('afro-glam', '10"', 55000, 1),
  ('afro-glam', '12"', 65000, 2),
  ('raw-bundles', '14/16/18"', 120000, 1),
  ('raw-bundles', '18/20/22"', 155000, 2),
  ('raw-bundles', '24/26/28"', 210000, 3),
  ('platinum-613', '20"', 199000, 1),
  ('platinum-613', '24"', 245000, 2),
  ('hd-closure', '14"', 38000, 1),
  ('hd-closure', '18"', 48000, 2),
  ('cornrow-queen', '24"', 72000, 1),
  ('cornrow-queen', '30"', 88000, 2)
on conflict (product_id, length) do nothing;
