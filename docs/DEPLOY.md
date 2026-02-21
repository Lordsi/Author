# Deploy Queens & Gods with Wrangler

Deploy the site to Cloudflare Pages as a **new project**. No link to any existing deployment.

## Prerequisites

1. **Node.js** (v18+)
2. **Wrangler** — install globally or use `npx`:
   ```bash
   npm install -g wrangler
   ```
3. **Cloudflare account** — [dash.cloudflare.com](https://dash.cloudflare.com)

---

## Step 1: Clear any previous project link (optional)

If you previously deployed this folder and want a completely fresh project, clear Wrangler's cached project:

```bash
rm -rf node_modules/.cache/wrangler
```

On Windows (PowerShell):

```powershell
Remove-Item -Recurse -Force node_modules\.cache\wrangler -ErrorAction SilentlyContinue
```

---

## Step 2: Install dependencies

```bash
npm install
```

---

## Step 3: Log in to Cloudflare

```bash
npx wrangler login
```

This opens a browser to authenticate with your Cloudflare account.

---

## Step 4: Create a new Pages project

Create a **new** project (choose a name, e.g. `queens-gods` or any name you prefer):

```bash
npx wrangler pages project create
```

When prompted:
- **Project name:** Enter a new name (e.g. `queens-gods`)
- **Production branch:** `main` (or your default branch)

---

## Step 5: Set environment variables

Set secrets in the Cloudflare dashboard or via Wrangler. Replace `YOUR_PROJECT_NAME` with the name you chose in Step 4.

### Option A: Cloudflare dashboard

1. Go to [Workers & Pages](https://dash.cloudflare.com/?to=/:account/workers-and-pages)
2. Open your new project
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
npx wrangler pages secret put STRIPE_SECRET_KEY --project-name=YOUR_PROJECT_NAME
npx wrangler pages secret put STRIPE_PRICE_ID --project-name=YOUR_PROJECT_NAME
npx wrangler pages secret put STRIPE_WEBHOOK_SECRET --project-name=YOUR_PROJECT_NAME
npx wrangler pages secret put SUPABASE_URL --project-name=YOUR_PROJECT_NAME
npx wrangler pages secret put SUPABASE_SERVICE_ROLE_KEY --project-name=YOUR_PROJECT_NAME
```

---

## Step 6: Deploy

From the project root. Replace `YOUR_PROJECT_NAME` with the name you chose:

```bash
npx wrangler pages deploy . --project-name=YOUR_PROJECT_NAME
```

This deploys:
- Static files (HTML, CSS, JS, images)
- Functions in `functions/` (`create-checkout-session`, `verify-session`, `stripe-webhook`)

Your site will be at `https://YOUR_PROJECT_NAME.pages.dev`.

---

## Step 7: Configure Stripe webhook

In [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks):

1. **Add endpoint**
2. **Endpoint URL:** `https://YOUR_PROJECT_NAME.pages.dev/stripe-webhook`
3. **Events:** `checkout.session.completed`
4. Copy the **Signing secret** and add it as `STRIPE_WEBHOOK_SECRET` (Step 5).

---

## Step 8: Custom domain (optional)

1. In the Cloudflare dashboard, open your Pages project.
2. **Custom domains** → **Set up a custom domain**
3. Add your domain and follow the DNS instructions.

---

## Local development

1. Copy `.dev.vars.example` to `.dev.vars` and fill in your values.
2. Run:

```bash
npx wrangler pages dev . --project-name=YOUR_PROJECT_NAME
```

3. Open the URL shown (e.g. `http://localhost:8788`).
4. For Stripe webhooks locally, use [Stripe CLI](https://stripe.com/docs/stripe-cli):
   ```bash
   stripe listen --forward-to http://localhost:8788/stripe-webhook
   ```

---

## Deployment checklist

- [ ] Cleared wrangler cache (if deploying as new)
- [ ] `npm install` completed
- [ ] `wrangler login` successful
- [ ] New Pages project created
- [ ] Environment variables set (Stripe + Supabase)
- [ ] `wrangler pages deploy . --project-name=YOUR_PROJECT_NAME` successful
- [ ] Stripe webhook URL updated
- [ ] `js/config.js` has correct Supabase URL and anon key (already configured)

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Deploys to old project | Clear `node_modules/.cache/wrangler` and create a new project |
| `pages_build_output_dir` warning | Ensure `wrangler.toml` has `pages_build_output_dir = "."` |
| Functions not found | Ensure `functions/` folder exists and deploy from project root |
| Stripe errors | Check `STRIPE_SECRET_KEY` and `STRIPE_PRICE_ID` are set |
| Supabase errors | Check `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` |
| Webhook signature failed | Verify `STRIPE_WEBHOOK_SECRET` matches the Stripe dashboard |
