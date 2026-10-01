/* =========================================================
   Glow by Grace — product catalogue
   ---------------------------------------------------------
   Edit this file to add / change products. Each product has:
   - model : photo of the hair being worn (shown by default)
   - sample: close-up of the hair itself (shown on hover)
   - lengths: one entry per length option, price in Naira
   Images are free Unsplash photos used as placeholders —
   swap them for your own product shots when ready.
   ========================================================= */

const IMG = (id, w = 900) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

window.GBG_PRODUCTS = [
  {
    id: "grace-bone-straight",
    name: "Grace Bone Straight",
    tagline: "13x4 HD lace frontal",
    category: "straight",
    badge: "Bestseller",
    lace: "13x4 HD Lace Frontal",
    density: "250%",
    lengths: [
      { len: '20"', price: 165000 },
      { len: '24"', price: 195000 },
      { len: '28"', price: 235000 },
      { len: '32"', price: 285000 }
    ],
    desc: "Glass-like, double drawn bone straight that moves like silk and stays sleek all day. Pre-plucked hairline, bleached knots.",
    model: IMG("photo-1551524267-c0baf940832c"),
    sample: IMG("photo-1747398690600-ffe8ecda9df1")
  },
  {
    id: "auburn-silk",
    name: "Auburn Silk",
    tagline: "Glueless 5x5 closure",
    category: "colored",
    badge: "New in",
    lace: "5x5 HD Lace Closure",
    density: "200%",
    lengths: [
      { len: '18"', price: 145000 },
      { len: '22"', price: 175000 },
      { len: '26"', price: 210000 }
    ],
    desc: "A warm copper-auburn straight unit — glueless, pre-cut lace, ready to wear in minutes.",
    model: IMG("photo-1648144651811-bc659e2d3334"),
    sample: IMG("photo-1613323885593-5fbcf35bf8ba")
  },
  {
    id: "blunt-bob",
    name: "Lagos Blunt Bob",
    tagline: "Pre-cut 4x4 closure",
    category: "bob",
    badge: "Under ₦80k",
    lace: "4x4 Lace Closure",
    density: "180%",
    lengths: [
      { len: '10"', price: 59000 },
      { len: '12"', price: 69000 },
      { len: '14"', price: 79000 }
    ],
    desc: "The everyday power bob. Blunt cut, bone straight and feather-light — wear-and-go.",
    model: IMG("photo-1648827966041-f773128fc993"),
    sample: IMG("photo-1630494391399-755f465e8836")
  },
  {
    id: "kinky-curly",
    name: "Kinky Curly Crown",
    tagline: "13x4 lace frontal",
    category: "curly",
    badge: "Bestseller",
    lace: "13x4 HD Lace Frontal",
    density: "250%",
    lengths: [
      { len: '16"', price: 135000 },
      { len: '20"', price: 165000 },
      { len: '24"', price: 199000 }
    ],
    desc: "Full, bouncy kinky curls that blend with natural 4A–4B textures. Volume for days.",
    model: IMG("photo-1585890483046-9461ebc1dace"),
    sample: IMG("photo-1661818302487-467621dd1c19")
  },
  {
    id: "deep-wave",
    name: "Deep Wave Diva",
    tagline: "13x6 HD lace frontal",
    category: "wavy",
    badge: "",
    lace: "13x6 HD Lace Frontal",
    density: "250%",
    lengths: [
      { len: '22"', price: 189000 },
      { len: '26"', price: 229000 },
      { len: '30"', price: 275000 }
    ],
    desc: "Defined, glossy deep waves with a wide 13x6 parting space for every style you can think of.",
    model: IMG("photo-1632984814154-6e07a671ae58"),
    sample: IMG("photo-1596911647169-7085321c81b8")
  },
  {
    id: "honey-spirals",
    name: "Honey Spirals",
    tagline: "Glueless 5x5 closure",
    category: "curly",
    badge: "New in",
    lace: "5x5 HD Lace Closure",
    density: "200%",
    lengths: [
      { len: '16"', price: 115000 },
      { len: '20"', price: 139000 }
    ],
    desc: "Soft, honey-brown spiral curls with natural shine. Glueless and beginner friendly.",
    model: IMG("photo-1694786702218-12124c2c9bcf"),
    sample: IMG("photo-1560264641-1b5191cc63e2")
  },
  {
    id: "knotless-braids",
    name: "Knotless Braid Wig",
    tagline: "Full lace, hand-braided",
    category: "braids",
    badge: "Protective",
    lace: "Full Lace",
    density: "—",
    lengths: [
      { len: '26"', price: 85000 },
      { len: '30"', price: 98000 },
      { len: '36"', price: 115000 }
    ],
    desc: "Hand-braided knotless braids on a breathable full-lace cap. Zero tension, all of the glam.",
    model: IMG("photo-1613099084406-4b9140fc780a"),
    sample: IMG("photo-1663851071150-b6617bbee927")
  },
  {
    id: "afro-glam",
    name: "Afro Glam",
    tagline: "Kinky afro, glueless",
    category: "curly",
    badge: "Under ₦80k",
    lace: "4x4 Lace Closure",
    density: "200%",
    lengths: [
      { len: '10"', price: 55000 },
      { len: '12"', price: 65000 }
    ],
    desc: "A big, beautiful afro unit with a natural kinky texture. Fluff, pick and go.",
    model: IMG("photo-1632765866070-3fadf25d3d5b"),
    sample: IMG("photo-1588527962980-72746d95973e")
  },
  {
    id: "raw-bundles",
    name: "Raw Hair Bundles",
    tagline: "3 bundles · single donor",
    category: "bundles",
    badge: "",
    lace: "Bundles (no lace)",
    density: "100g each",
    lengths: [
      { len: '14/16/18"', price: 120000 },
      { len: '18/20/22"', price: 155000 },
      { len: '24/26/28"', price: 210000 }
    ],
    desc: "Unprocessed raw hair wefts — dye it, curl it, sew it in. Long-lasting, minimal shedding.",
    model: IMG("photo-1645736279976-59f8fd22720c"),
    sample: IMG("photo-1715220210514-5b52d4893f65")
  },
  {
    id: "platinum-613",
    name: "Platinum 613",
    tagline: "13x4 HD lace frontal",
    category: "colored",
    badge: "Statement",
    lace: "13x4 HD Lace Frontal",
    density: "200%",
    lengths: [
      { len: '20"', price: 199000 },
      { len: '24"', price: 245000 }
    ],
    desc: "Icy 613 blonde — a perfect base for custom colour or a head-turning look as is.",
    model: IMG("photo-1593880223042-744ce9a4b58f"),
    sample: IMG("photo-1573617868130-7e757dbad187")
  },
  {
    id: "hd-closure",
    name: "HD Lace Closure",
    tagline: "5x5 · melts into any skin",
    category: "closure",
    badge: "Add-on",
    lace: "5x5 HD Lace",
    density: "150%",
    lengths: [
      { len: '14"', price: 38000 },
      { len: '18"', price: 48000 }
    ],
    desc: "Invisible HD lace closure — pre-plucked and bleached. Pair it with any bundle set.",
    model: IMG("photo-1692216203899-064d122f0655"),
    sample: IMG("photo-1659443188508-3cd2732285dc")
  },
  {
    id: "cornrow-queen",
    name: "Cornrow Queen",
    tagline: "Braided cornrow unit",
    category: "braids",
    badge: "",
    lace: "Full Lace",
    density: "—",
    lengths: [
      { len: '24"', price: 72000 },
      { len: '30"', price: 88000 }
    ],
    desc: "Neat stitch-braid cornrows on a full-lace base. Looks fresh from the salon chair — every day.",
    model: IMG("photo-1652095319417-4bf8a0de1a3d"),
    sample: IMG("photo-1594254773847-9fce26e950bc")
  }
];

window.GBG_CATEGORIES = [
  { key: "all", label: "All hair" },
  { key: "straight", label: "Bone straight" },
  { key: "curly", label: "Curly" },
  { key: "wavy", label: "Wavy" },
  { key: "bob", label: "Bobs" },
  { key: "braids", label: "Braids" },
  { key: "colored", label: "Colour" },
  { key: "bundles", label: "Bundles" },
  { key: "closure", label: "Closures" }
];

/* Store settings — edit WhatsApp number here (international format, no +) */
window.GBG_STORE = {
  name: "Glow by Grace",
  whatsapp: "2348143985557",
  whatsappDisplay: "0814 398 5557"
};
