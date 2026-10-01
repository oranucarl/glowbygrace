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

/* Nigerian states (used at checkout and to match delivery zones) */
window.GBG_STATES = ["Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT (Abuja)", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"];

/* Store settings — edit WhatsApp number here (international format, no +) */
window.GBG_STORE = {
  name: "Glow by Grace",
  whatsapp: "2348143985557",
  whatsappDisplay: "0814 398 5557"
};
