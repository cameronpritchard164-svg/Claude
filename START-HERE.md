# GrabCo Store Kit — START HERE

This kit is a complete, working copy of the GrabCo Whop stores as of 19 October 2026.
Give this whole zip to a new Claude chat and say:

> "This is my store kit. Read START-HERE.md, then build me a new store from the
> `clausefart-store` template for a product called ___. Keep everything identical,
> only change the text, photos, prices and colours."

Then attach your new product photos, logo and prices.

---

## What is in the kit

| Folder | What it is | Live at |
|---|---|---|
| `clausefart-store/` | **The template to copy.** Single-product store: product page, Shopify-style checkout, policies, contact page, animated footer. | https://clausefart.whop.site |
| `diddygrab-store/` | Second store (older layout, pink, bundle box with upsells). Keep for reference. | https://diddygrab.whop.site |
| `grabco-dashboard/` | Dark-mode sales and sessions dashboard for all stores. | https://grabco-dashboard.whop.site |

`node_modules` and build output are left out to keep the zip small. Run `npm install`
in a store folder to restore them.

All stores sit on one Whop business account (**GrabCo**, `biz_eBI3bCf0mqzUIk`). Each
store is a Whop "hosted app" on its own `*.whop.site` address.

---

## How a store works (so the new chat understands it)

- **Hosting:** each store is a TanStack Start + Cloudflare Worker app deployed with
  `whop apps deploy`. Every page is rendered on the server by `src/theme/site.ts`.
- **Product page:** `src/theme/product-page.ts`. Plain HTML and CSS in one file.
  Gallery, rating, price, benefit bullets, Buy 1/2/3 selector, trust icons, review
  ticker, FAQ (collapsed), red scrolling bar, two feature sections, testimonials,
  animated wavy footer with email signup. Images are square (1:1).
- **Checkout:** `src/theme/checkout.ts`. Shopify-style page (Contact, Delivery with
  country-aware state/postcode and address suggestions, Shipping method, Payment)
  wrapped around Whop's embedded card form. Apple Pay and Google Pay sit in the
  Express checkout row at the top. The Buy button sends shoppers to
  `/checkout?key=<qty>:` and the checkout loads the matching Whop plan from
  `src/theme/bundle-plans.json`.
- **Prices:** shown prices come from `src/theme/bundle.json`. The amount actually
  charged comes from the Whop plans. **Both must match.**
- **Policies:** `src/theme/policies.ts` generates the Refund & Return and Shipping
  pages. Store name, product and season are passed in from `site.ts`.
- **Contact, policy and 404 pages** use the original Shopify theme in `theme/`
  (colours in `theme/config/settings_data.json`).
- **Payments:** card, Apple Pay and Google Pay only. PayPal, crypto, WeChat, Alipay
  and bank transfer are switched off on every plan. USD, tax inclusive, shipping
  address collected.

---

## Every place to change for a new store

Copy `clausefart-store/` to a new folder (e.g. `newproduct-store/`), then edit:

| File | What to change |
|---|---|
| `whop.app.json` | `name`, `route` (becomes `<route>.whop.site`), and `app_id` (from the new app). |
| `src/theme/product-page.ts` | Title, rating text, benefit bullets, FAQ answers, feature headings and text, testimonial titles, text and names, review ticker lines, page `<title>` and description, `--red` colour. |
| `src/theme/bundle.json` | `product_name`, `noun`, and the three `tiers` (`price` and `compare` for qty 1, 2, 3). |
| `src/theme/bundle-plans.json` | The three new Whop plan IDs and URLs (`"1:"`, `"2:"`, `"3:"`). |
| `src/theme/store.ts` | `WHOP_PRODUCT_ID`, `WHOP_PLAN_ID` (the qty-1 plan), `PRODUCT_HANDLE`, `LOCAL_PRODUCT` title and image paths, fallback title and prices, shop `name`. |
| `src/theme/site.ts` | Every `'ClauseGrab'` store name, the `productPage({...})` image lists, `sale:` text, `policyPages({ store, product, season })`, and the app ID in the contact-log comment. |
| `src/theme/checkout.ts` | Accent colour if not red (`accentHex`). |
| `src/theme/policies.ts` | Contact email (`EMAIL`), and product-specific wording if the product is not a bubble toy. |
| `src/routes/__root.tsx` | Store name in the page title. |
| `theme/config/settings_data.json` | Store name and brand colours for the contact, policy and 404 pages. |
| `public/images/` | `logo.webp`, `logo.png`, `favicon.png`, product photos and review photos. Square images work best. |

Current ClauseFart image names: `cf-1.webp`, `cf-2.webp` (gallery), `cf-r1/2/3.webp`
(feature and testimonial photos). Replace the files or update the paths in `site.ts`.

---

## Launching a new store, step by step

Run these from the new store folder. The proxy settings are needed in Claude's cloud
container:

```bash
export NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt NODE_NO_WARNINGS=1
npm install
```

**1. Sign in to Whop.** Claude starts the login and gives you a link. Open it, approve,
and paste back the `http://localhost:13337/callback?code=...` address **within 5
minutes**. The sign-in expires every hour or so and has to be repeated.

```bash
npx whop login --method oauth --format jsonl
```

**2. Create the hosted app** (gives the `app_id` and the `*.whop.site` address):

```bash
npx whop apps create --name "NewStore" --route newstore --format json
```

Creating an app also creates an empty free product on its route. Hide it in the
dashboard or with `npx whop products update <id> --visibility hidden`.

**3. Create the product** (shipping address can only be switched on at creation):

```bash
npx whop products create --title "Product Name" --route product-route \
  --headline "One-line pitch (max 80 chars)" --description "Short description" \
  --collect_shipping_address --visibility quick_link \
  --idempotency-key newstore-product-1 --format json
```

**4. Create the three plans** (Buy 1, 2, 3). Repeat with qty 2 and 3. Plan titles
must be 30 characters or fewer, and every run needs a new idempotency key.

```bash
npx whop plans create --product_id prod_XXXX --plan_type one_time \
  --release_method buy_now --currency usd --initial_price 29.99 --unlimited_stock \
  --visibility quick_link --adaptive_pricing_enabled=false --override_tax_type inclusive \
  --payment_method_configuration '{"enabled":["card","apple_pay","google_pay"],"disabled":["paypal","paypal_express","crypto","wechat_pay","alipay","us_bank_account"],"include_platform_defaults":false}' \
  --title "Product x1" --description "1 x Product" \
  --metadata '{"bundle_key":"1:","quantity":1}' \
  --idempotency-key newstore-plan-1 --format json

npx whop plans update plan_XXXX --strike_through_initial_price 59.98 --format json
```

`--adaptive_pricing_enabled=false` must be written with `=`, or prices may show in the
buyer's local currency.

**5. Put the IDs in the code:** plan IDs in `bundle-plans.json`, product and qty-1 plan
in `store.ts`, app ID in `whop.app.json`.

**6. Build and deploy:**

```bash
npx vite build
npx whop apps deploy
```

**7. Check:** open `https://<route>.whop.site`, pick Buy 1, 2 and 3, and confirm the
checkout total matches. Optional: make a hidden $1 plan to place a real test order,
then archive it and refund the payment once Whop's balance settles.

**8. Dashboard:** add the new store to `STORES` in `grabco-dashboard/src/app/whop.ts`
(host, product IDs, colour) and redeploy the dashboard.

---

## Business settings already done on the Whop account

- Business name shown at checkout: **GrabCo** (Whop shows the business name, not the
  product name).
- Contact and claims email in policies: **forgerelic@outlook.com**.
- PayPal off, USD only, tax inclusive, card + Apple Pay + Google Pay.

## Known limits

- Whop's pay button always reads "Order now".
- Address suggestions use a free OpenStreetMap service that can be slow. Adding a
  Geoapify key as the app secret `ADDRESS_KEY` makes them instant
  (`npx whop apps secrets set ADDRESS_KEY=...`).
- Shop Pay is Shopify-only and cannot be added.
- Never paste API keys or passwords into chat. The dashboard has its own `/setup`
  page for its key.

## Code also lives on GitHub

Repository `cameronpritchard164-svg/Claude`, branch
`claude/shopify-whop-migration-zz0yhv`. A new Claude Code session can attach that
repository directly instead of using this zip.
