# Going live — setup guide

The site is static HTML/JS. Everything dynamic runs on **Supabase** (database, Google sign-in,
photo storage, server functions), **Paystack** (payments) and **Resend** (emails).
All of them are free to start.

Work through the steps in order. You'll collect these values along the way:

| Value | Where it goes |
|---|---|
| Supabase project URL + anon key | `assets/js/config.js` |
| Google OAuth client ID + secret | Supabase → Authentication → Providers → Google |
| Paystack secret key | Supabase function secret `PAYSTACK_SECRET_KEY` |
| Resend API key | Supabase function secret `RESEND_API_KEY` |

> Secret keys (Paystack, Resend, Supabase service role) must **never** go in the website files.

---

## 1. Supabase project

1. Sign up at [supabase.com](https://supabase.com) → **New project**. Pick a strong database password and the region closest to Nigeria (e.g. *West EU (London)*).
2. **Project Settings → API**: copy the **Project URL** and the **anon / public** key into `assets/js/config.js`.
3. **SQL Editor → New query**: paste and run, in order:
   1. `supabase/migrations/20261001000000_init.sql` (tables, security rules, delivery fees)
   2. `supabase/migrations/20261001000001_seed_products.sql` (the starting catalogue — skip it if you'd rather add products yourself)
   3. `supabase/migrations/20261002000000_product_colours.sql` (optional colour choices per product)
4. Make the seller an admin (use the Gmail address they'll sign in with):
   ```sql
   insert into public.admins (email) values ('seller@gmail.com');
   ```

## 2. Google sign-in

1. [console.cloud.google.com](https://console.cloud.google.com) → create a project (e.g. *Glow by Grace*).
2. **APIs & Services → OAuth consent screen** → *External*. Fill in app name, support email and logo.
   On **Branding**, set the home page, privacy policy (`/privacy.html`) and terms (`/terms.html`) links, and under
   **Authorized domains** add `YOUR-PROJECT-REF.supabase.co` and your site's domain (e.g. `glowbygrace.vercel.app`).
   Plain `supabase.co` is rejected — it's a public suffix.
3. **Credentials → Create credentials → OAuth client ID** → *Web application*.
   - **Authorized redirect URI:** `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`
4. Copy the **Client ID** and **Client secret** into Supabase → **Authentication → Sign In / Providers → Google** → enable → save.
5. Supabase → **Authentication → URL Configuration**:
   - **Site URL:** `https://glowbygrace.vercel.app`
   - **Redirect URLs:** add `https://glowbygrace.vercel.app/**` and `http://localhost:8080/**`
6. Back in Google → OAuth consent screen → **Publish app** so anyone can sign in (in testing mode only listed test users can).

## 3. Paystack

1. Sign up at [paystack.com](https://paystack.com). Test mode works straight away.
2. **Settings → API Keys & Webhooks** → copy the **Test Secret Key** (`sk_test_…`).
3. Set the **Test Webhook URL** to
   `https://YOUR-PROJECT-REF.supabase.co/functions/v1/paystack-webhook`

## 4. Resend (order emails)

1. Sign up at [resend.com](https://resend.com) → **API Keys** → create one.
2. **Domains → Add domain** and add the DNS records it shows at your domain registrar.
   Until a domain is verified, Resend only delivers to your own Resend login email
   (use `EMAIL_FROM="Glow by Grace <onboarding@resend.dev>"` for that testing period).

## 5. Deploy the server functions

Install the Supabase CLI (`brew install supabase/tap/supabase`), then from this folder:

```bash
supabase login
supabase link --project-ref YOUR-PROJECT-REF

supabase secrets set \
  PAYSTACK_SECRET_KEY=sk_test_xxx \
  RESEND_API_KEY=re_xxx \
  EMAIL_FROM="Glow by Grace <orders@yourdomain.com>" \
  SELLER_EMAIL=seller@gmail.com \
  SITE_URL=https://glowbygrace.vercel.app \
  ALLOWED_ORIGINS=http://localhost:8080

supabase functions deploy checkout verify-payment paystack-webhook
```

- `SELLER_EMAIL` gets a copy of every paid order and is the reply-to address on customer emails.
- `SITE_URL` is used for the links inside emails and as the fallback return address after payment.
- `ALLOWED_ORIGINS` lists any other addresses (comma separated) you test the site from.

## 6. Hosting

The site is hosted on **Vercel** at <https://glowbygrace.vercel.app>, connected to the GitHub repo:
every push to `main` deploys automatically (no build step — Framework preset *Other*).
If you add a custom domain, update `SITE_URL` and the Supabase Site URL / Redirect URLs to match.

## 7. Test a full order

1. Open the site, add hair to the bag → **Checkout** → sign in with Google.
2. Fill in delivery details and pay with Paystack's test card:
   `4084 0840 8408 4081`, any future expiry, CVV `408`, PIN `0000`, OTP `123456`.
3. You land on the confirmation page, the customer email and seller email arrive,
   and the order appears under **My account** and in **admin.html**.

## 8. Go live

1. Complete business verification in Paystack (starter business with BVN + ID, or CAC registration).
2. Swap in the live secret key and set the **Live Webhook URL** (same URL as above):
   ```bash
   supabase secrets set PAYSTACK_SECRET_KEY=sk_live_xxx
   ```
3. Replace the starting product photos with your own from the admin page (Products → edit → Upload photo).

---

## Running locally

```bash
python3 -m http.server 8080
```
Open <http://localhost:8080>. Google sign-in needs `http://localhost:8080/**` in Supabase's redirect URLs.

## How an order flows

1. **Checkout** (`checkout.html`) sends the bag to the `checkout` function, which re-reads every price,
   stock level and delivery fee from the database, saves the order as *Awaiting payment* and opens Paystack.
2. After paying, Paystack returns the shopper to `order.html`, which calls `verify-payment`. Paystack
   also calls `paystack-webhook` in the background, so orders are confirmed even if the tab is closed.
3. Both check the transaction with Paystack, confirm the amount matches, mark the order *Paid*
   (once only), reduce tracked stock and send the confirmation emails.
4. The seller moves the order through *Being prepared → On its way → Delivered* in `admin.html`;
   the customer sees each step in **My account**.
