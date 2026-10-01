# Glow by Grace

Online shop for Glow by Grace, a hair shop in Lagos. Customers sign in with Google, pay with Paystack,
get an email confirmation and track their orders. The seller manages products, stock, delivery fees
and orders from an admin page.

**Setting it up for the first time? Follow [SETUP.md](SETUP.md).**

## Tech stack
- HTML5, CSS3, vanilla JavaScript (no framework, no build step)
- Supabase: Postgres database, Google sign-in, photo storage, Edge Functions
- Paystack for payments, Resend for order emails
- Static hosting (GitHub Pages / Netlify / Vercel)

## Structure
```
glowbygrace/
├── index.html            # Home
├── shop.html             # Shop
├── checkout.html         # Checkout (sign in, delivery details, pay)
├── order.html            # Order confirmation (Paystack returns here)
├── account.html          # Customer account: orders + saved details
├── admin.html            # Seller dashboard
├── assets/
│   ├── css/styles.css
│   └── js/
│       ├── config.js     # Supabase URL + public key (edit this)
│       ├── products.js   # Categories + store settings (WhatsApp number)
│       ├── api.js        # Supabase connection, catalogue loading, sign-in
│       ├── main.js       # Header/footer, product cards, bag
│       ├── shop.js       # Shop filters and sorting
│       ├── chat.js       # Grace, the hair assistant
│       ├── checkout.js   # Checkout page
│       ├── order.js      # Order confirmation page
│       ├── account.js    # Account page
│       ├── admin.js      # Admin dashboard
│       └── orders-ui.js  # Shared order display
└── supabase/
    ├── migrations/       # Database schema, security rules, starting data
    └── functions/        # checkout, verify-payment, paystack-webhook (+ _shared)
```

## Run locally
```bash
python3 -m http.server 8080
```
