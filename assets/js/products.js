/* =========================================================
   Glow by Grace — catalogue settings
   ---------------------------------------------------------
   Products, prices, stock and delivery fees live in the
   database and are managed from admin.html. api.js loads
   them into window.GBG_PRODUCTS / window.GBG_ZONES.
   ========================================================= */

window.GBG_PRODUCTS = [];
window.GBG_ZONES = [];

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
