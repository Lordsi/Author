# Setup: Purchase-Gated Reader Accounts

This guide explains how to configure the purchase-gated account system for the Queens & Gods reader. Users must purchase the book (via Stripe or PayPal) before they can create an account and read the excerpts.

## Architecture

- **Supabase** — User authentication and `purchases` table
- **Stripe** — Payments (cards + PayPal via Stripe Checkout)
- **Cloudflare Pages Functions** — Checkout session creation, webhook, session verification

## 1. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run:

```sql
create table purchases (
  email text primary key,
  stripe_session_id text,
  status text default 'completed',
  created_at timestamptz default now()
);

-- Allow service role to manage purchases (webhook, verify-session)
alter table purchases enable row level security;

create policy "Service role can manage purchases"
  on purchases for all
  using (auth.role() = 'service_role');
```

3. In **Settings → API**, copy:
   - **Project URL** → `supabaseUrl` in `js/config.js`
   - **anon public** key → `supabaseAnonKey` in `js/config.js`
   - **service_role** key → used only in Cloudflare env (never in frontend)

4. In **Authentication → Providers**, enable **Email** and configure as needed (e.g. disable "Confirm email" for faster flow).

## 2. Stripe Setup

1. Create an account at [stripe.com](https://stripe.com).
2. In **Products**, create a product (e.g. "Queens & Gods — Digital Access") and add a one-time price. Copy the **Price ID** (e.g. `price_xxx`).
3. In **Developers → API keys**, copy the **Secret key**.
4. In **Developers → Webhooks**, add endpoint:
   - URL: `https://YOUR_CLOUDFLARE_SITE.pages.dev/stripe-webhook` (or your custom domain)
   - Events: `checkout.session.completed`
   - Copy the **Signing secret** (starts with `whsec_`).

## 3. Cloudflare Pages Setup

1. Deploy the site to Cloudflare Pages (connect your repo or upload). The `wrangler.toml` enables `nodejs_compat_v2` so Stripe and Supabase packages run correctly.
2. In **Pages project → Settings → Environment variables**, add:

| Variable | Value |
|----------|-------|
| `STRIPE_SECRET_KEY` | Your Stripe secret key |
| `STRIPE_PRICE_ID` | Your Stripe Price ID |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key |

3. For local development, use `npx wrangler pages dev` or `npx wrangler dev` and add the same variables in `wrangler.toml` or `.dev.vars` (add to `.gitignore`).

## 4. Frontend Config

Edit `js/config.js`:

```javascript
window.AUTH_CONFIG = {
  supabaseUrl: 'https://YOUR_PROJECT.supabase.co',
  supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY',
  apiBaseUrl: '',  // Cloudflare Pages Functions at /create-checkout-session, /verify-session, /stripe-webhook
};
```

For Cloudflare Pages, `apiBaseUrl` can stay empty. The functions are served at the same origin (`/create-checkout-session`, `/verify-session`, `/stripe-webhook`).

## 5. User Flow

1. User visits **Purchase** → pays via Stripe (card or PayPal).
2. Stripe redirects to **Create Account** with `session_id`.
3. `verify-session` confirms payment and returns the customer email.
4. User sets a password and creates their Supabase account.
5. User can **Log in** and read all excerpts.

## 6. Files

| File | Purpose |
|------|---------|
| `purchase.html` | Purchase page with Stripe checkout button |
| `create-account.html` | Account creation (gated by purchase) |
| `login.html` | Login page |
| `js/config.js` | Supabase + API config |
| `js/purchase.js` | Stripe checkout flow |
| `js/create-account.js` | Account creation logic |
| `js/auth.js` | Auth utilities |
| `js/login.js` | Login logic |
| `js/reader-auth.js` | Protects reader pages |
| `functions/create-checkout-session.js` | Creates Stripe session |
| `functions/stripe-webhook.js` | Records purchases |
| `functions/verify-session.js` | Verifies payment, returns email |

## 7. Testing

1. Use Stripe test mode keys for development.
2. Test cards: `4242 4242 4242 4242`.
3. For webhooks locally, use [Stripe CLI](https://stripe.com/docs/stripe-cli):  
   `stripe listen --forward-to http://localhost:8788/stripe-webhook`  
   (adjust port to match your local Cloudflare Pages dev server)
