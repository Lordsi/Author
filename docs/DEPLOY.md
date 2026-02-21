# Deploy Queens & Gods with Wrangler

Deploy the site to Cloudflare Pages using Wrangler. Project: **soft-dream-8fb9**.

## Prerequisites

1. **Node.js** (v18+)
2. **Wrangler** — install globally or use `npx`:
   ```bash
   npm install -g wrangler
   ```
3. **Cloudflare account** — [dash.cloudflare.com](https://dash.cloudflare.com)

---

## Step 1: Install dependencies

```bash
npm install
```

---

## Step 2: Log in to Cloudflare

```bash
npx wrangler login
```

This opens a browser to authenticate with your Cloudflare account.

---

## Step 3: Create the Pages project (first time only)

If the project **soft-dream-8fb9** does not exist yet:

```bash
npx wrangler pages project create soft-dream-8fb9
```

When prompted:
- **Production branch:** `main` (or your default branch)
- The project will be available at `https://soft-dream-8fb9.pages.dev` (or similar)

If the project already exists, skip this step.

---

## Step 4: Set environment variables

Set secrets for Stripe and Supabase in the Cloudflare dashboard or via Wrangler.

### Option A: Cloudflare dashboard

1. Go to [Workers & Pages](https://dash.cloudflare.com/?to=/:account/workers-and-pages)
2. Open project **soft-dream-8fb9**
3. **Settings** → **Environment variables**
4. Add these for **Production** (and Preview if needed):

| Variable | Value | Encrypted |
|----------|-------|-----------|
| `STRIPE_SECRET_KEY` | Your Stripe secret key (`sk_...`) | Yes |
| `STRIPE_PRICE_ID` | Your Stripe Price ID (`price_...`) | No |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret (`whsec_...`) | Yes |
| `SUPABASE_URL` | `https://tvejzgdnbrvkceljgvqy.supabase.co` | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key | Yes |

### Option B: Wrangler CLI

```bash
npx wrangler pages secret put STRIPE_SECRET_KEY --project-name=soft-dream-8fb9
npx wrangler pages secret put STRIPE_PRICE_ID --project-name=soft-dream-8fb9
npx wrangler pages secret put STRIPE_WEBHOOK_SECRET --project-name=soft-dream-8fb9
npx wrangler pages secret put SUPABASE_URL --project-name=soft-dream-8fb9
npx wrangler pages secret put SUPABASE_SERVICE_ROLE_KEY --project-name=soft-dream-8fb9
```

You'll be prompted to enter each value.

---

## Step 5: Deploy

From the project root:

```bash
npx wrangler pages deploy . --project-name=soft-dream-8fb9
```

This deploys:
- Static files (HTML, CSS, JS, images)
- Functions in `functions/` (`create-checkout-session`, `verify-session`, `stripe-webhook`)

---

## Step 6: Configure Stripe webhook

In [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks):

1. **Add endpoint**
2. **Endpoint URL:** `https://soft-dream-8fb9.pages.dev/stripe-webhook`  
   (or `https://soft-dream-8fb9.praisemagangani.workers.dev/stripe-webhook` if using that custom domain)
3. **Events:** `checkout.session.completed`
4. Copy the **Signing secret** and add it as `STRIPE_WEBHOOK_SECRET` (Step 4).

---

## Step 7: Custom domain (optional)

Your Pages deployment will be at `https://soft-dream-8fb9.pages.dev`. To use `https://soft-dream-8fb9.praisemagangani.workers.dev` instead:

1. In the Cloudflare dashboard, open your Pages project.
2. **Custom domains** → **Set up a custom domain**
3. Add the domain and follow Cloudflare’s DNS instructions.

---

## Local development

1. Copy `.dev.vars.example` to `.dev.vars` and fill in your values.
2. Run:

```bash
npx wrangler pages dev . --project-name=soft-dream-8fb9
```

3. Open the URL shown (e.g. `http://localhost:8788`).
4. For Stripe webhooks locally, use [Stripe CLI](https://stripe.com/docs/stripe-cli):
   ```bash
   stripe listen --forward-to http://localhost:8788/stripe-webhook
   ```

---

## Deployment checklist

- [ ] `npm install` completed
- [ ] `wrangler login` successful
- [ ] Pages project created (or already exists)
- [ ] Environment variables set (Stripe + Supabase)
- [ ] `wrangler pages deploy . --project-name=soft-dream-8fb9` successful
- [ ] Stripe webhook URL updated
- [ ] `js/config.js` has correct Supabase URL and anon key (already configured)

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `pages_build_output_dir` warning | Ensure `wrangler.toml` has `pages_build_output_dir = "."` |
| Functions not found | Ensure `functions/` folder exists and deploy from project root |
| Stripe errors | Check `STRIPE_SECRET_KEY` and `STRIPE_PRICE_ID` are set |
| Supabase errors | Check `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` |
| Webhook signature failed | Verify `STRIPE_WEBHOOK_SECRET` matches the Stripe dashboard |
