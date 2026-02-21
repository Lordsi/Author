# Queens & Gods — Edwin C. Polela

A **static author website** for **Queens & Gods: The Testaments of Queens** by Edwin C. Polela. The reader is **purchase-gated**: users must buy the book (Stripe or PayPal) before creating an account and reading excerpts.

---

## Website description

The site promotes the book and the author: it showcases the cover, provides short excerpts (reader pages), a “From the Journal” blog, author bio, and a way to request signed physical copies. The design is warm and literary (charcoal, cream, gold) with subtle transitioning gradients and a mobile-friendly layout. It is built for accessibility (skip link, focus styles, reduced motion, ARIA, form labels) and works without JavaScript.

---

## Pages

| Page | Description |
|------|-------------|
| **index.html** | Home: hero with book cover, three feature cards (Books, Blog, Excerpt), latest blog preview, newsletter signup form. |
| **books.html** | Books list — single book card linking to the book detail page. |
| **book-info.html** | Book detail: cover, title, tags, synopsis (expandable “Read more”), “Where to buy” (signed copies, Amazon/Kindle coming soon), chapter list with links to free excerpts. |
| **author.html** | Meet the Author: bio, author photo placeholder, links to Blog and Order. |
| **blog.html** | “From the Journal”: post cards; clicking a card opens a blurred overlay with the post title and short text and a Close button (hash-based, no JS). |
| **order.html** | Order physical copy: book image, form (name, email, address, number of copies), “Request to Buy” button, trust copy about signed copies and shipping. |
| **reader/*.html** | One page per excerpt (Eve, Bathsheba, Abishag, Yael, Makeda, plus The First Spark, Whispers of the Past, etc.): back link, chapter title, reading content, prev/next chapter links; some have a settings/details panel. |

---

## Features

- **Design:** Warm palette (charcoal `#1a1814`, cream `#e8e4dc`, gold `#c9a227`), transitioning background gradients, Inter + Lora (Google Fonts).
- **Navigation:** Sticky header with Home, Books, Meet the Author, Blog, Order Print, Log in; on mobile, a dropdown menu (no header stretch).
- **Accessibility:** Skip-to-main link, visible focus styles, `prefers-reduced-motion` support, meta descriptions, theme-color, ARIA on nav and blog overlays, form labels associated with inputs.
- **Blog overlays:** On the Blog page, each post card opens a full-screen blurred overlay (URL hash); overlay has `role="dialog"` and `aria-labelledby` for screen readers.
- **Forms:** Newsletter (home) and order form (order page) are present; both use `action="#"` and are not wired to a backend — ready for you to connect to a server or form service.
- **Favicon:** Full set in `favicon/` (ico, PNG sizes, apple-touch-icon, Android Chrome, `site.webmanifest`) and linked from all main pages.
- **Responsive:** Mobile-first; touch-friendly targets; dropdown menu on small screens; no `background-attachment: fixed` on mobile.

---

## Integrations

- **Google Fonts:** Inter and Lora loaded via `@import` in `css/styles.css`.
- **Auth & payments:** Supabase (auth + purchases table), Stripe (cards + PayPal), Netlify Functions. See `docs/SETUP-AUTH.md` for setup.

---

## Assets

- **Book cover:** `src/book.png` — used on home, books, book-info, and order.
- **Favicon:** `favicon/` — favicon.ico, PNG sizes, apple-touch-icon, Android Chrome icons, `site.webmanifest`.

---

## Run locally

**Option 1 — Open directly**  
Open `index.html` in your browser. For full behaviour (relative links, hash-based overlays), a local server is better.

**Option 2 — Local server (recommended)**  
From the project folder:

```powershell
python -m http.server 8000
```

Then open **http://localhost:8000**.

For the purchase-gated reader, deploy to Cloudflare Pages and configure Supabase + Stripe (see `docs/SETUP-AUTH.md`). Local dev with functions: `npm install` then `npx wrangler pages dev`.
