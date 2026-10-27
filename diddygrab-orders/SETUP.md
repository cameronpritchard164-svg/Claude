# Whop Orders: supplier page for your Whop store

> **Using Claude Code?** Open this folder in Claude Code and say:
> **"Read CLAUDE.md and SETUP.md and set this up for my store, step by step."**
> It was made in another Claude account (your brother Damian's) so your Claude won't remember
> it. That's fine, everything it needs is in these files. It runs the commands, and you only do
> the steps marked **(you)**.

You get a private website where you and your supplier log in with a passcode, see every paid
order with its shipping address, download a CSV, and add tracking numbers. Adding a tracking
number marks the order shipped on Whop.

- **Owner login**: sees everything (emails, totals, refunds, full CSV).
- **Supplier login**: names, addresses, phones, quantities, add-ons. Adds tracking.
  Can't see emails or money and can't refund anything.
- Orders are numbered **1001, 1002, 1003…** oldest first.
- If your supplier uses **店小秘 (Dianxiaomi)**, orders go into it automatically with the product
  picture and tracking comes back by itself (step 8).

Runs on Whop's own hosting for free, so no computer has to stay on. About 20 minutes.

---

## 1. Install the Whop CLI and log in

```bash
curl -fsSL https://whop.com/install.sh | sh
```

If that fails use `npm install -g @whop/cli`. Check it with `whop --version`.

```bash
whop login
```

**(you)** It opens the browser. Log in to your Whop account.

## 2. Pick the right business

```bash
whop quickstart
```

**(you)** Pick the business your store is in. **This matters.** The page is created under
whichever business is picked here, and the wrong one will never see your orders.

## 3. Fill in `worker/config.ts`

Get your business ID:

```bash
whop accounts list
```

In `worker/config.ts` set:

- `account_id` to your `biz_...` ID
- `name` to your store name, e.g. `WolfPaws`
- `product` to what you sell, e.g. `Dog Hoodie`
- `owner` passcode, only for you
- `supplier` passcode, the one you give your supplier
- `WOOCOMMERCE` keys to long random strings, keeping the `ck_` and `cs_` at the front
  (only used if your supplier has 店小秘, but set them anyway)

In `wrangler.jsonc` and `package.json` change `mystore-orders` to your slug, e.g.
`wolfpaws-orders` (lowercase, hyphens ok, no spaces).

## 4. Add your product photo

Put a square photo of your product at `public/images/product.jpg` (around 800×800).
This is the picture 店小秘 shows on each order. Claude can copy and resize one of your store
images for you.

## 5. Install and deploy

```bash
npm install
```

```bash
whop apps deploy
```

First time it asks:
- What are you building? **A website**
- Name: e.g. `WolfPaws Orders`
- Domain: e.g. `wolfpaws-orders`, so the page is `https://wolfpaws-orders.whop.site`

Open the link and you'll see the login page. Orders will show an error until step 6, that's
normal.

## 6. Give the page an API key **(you)**

Whop's hosting uses a key that can't read orders, so you make one that can.

1. Go to https://whop.com/dashboard, make sure your store's business is selected top-left, then
   **Developer** (bottom of the left menu) → **Company API keys** → **Create API key**.
2. Name it `Orders`. Tick:
   `payment:basic:read`, `member:basic:read`, `member:email:read`, `member:phone:read`,
   `plan:basic:read`, `access_pass:basic:read`, `shipment:basic:read`, `shipment:create`,
   `shipment:update` (if it's there). Nothing about refunds, payouts or products.
3. Copy the key (starts with `apik_`). **Don't paste it into the Claude chat.**
4. In your own terminal, in this folder, run this with your key right after the `=`
   (no spaces, no quotes):

```bash
whop apps secrets set --secret ORDERS_API_KEY=
```

The name has to be exactly `ORDERS_API_KEY`. `WHOP_API_KEY` is reserved and gets rejected.

5. Deploy once more so it picks the key up:

```bash
whop apps deploy
```

## 7. Test it, then send it to your supplier

Open `https://<your-slug>.whop.site` and log in with the **supplier** passcode. You should see
your paid orders, numbered from 1001, with addresses and a "To ship" count. Log out (top right)
and log in with the **owner** passcode to see emails and totals too.

Message for the supplier:

> Orders page: https://your-slug.whop.site
> Passcode: your supplier passcode
>
> "To ship" is the list. When you post one, type the tracking number into the row and press Save,
> or paste a whole list with "Paste tracking numbers" (order number then tracking number on each
> line). Saving the tracking marks it shipped. Export CSV gives you a spreadsheet of the
> addresses.

## 8. Optional: supplier uses 店小秘 (Dianxiaomi)

Then they don't need the page at all. 店小秘 pulls the orders and sends tracking back.

1. Make sure steps 3 to 7 are done first. 店小秘 keeps the order number it sees the first time,
   so the name and numbering should be final before they connect.
2. Send the supplier:
   - 站点URL (site URL): `https://your-slug.whop.site`
   - Consumer Key: the `ck_...` from `worker/config.ts`
   - Consumer Secret: the `cs_...` from `worker/config.ts`
3. They add it in 店小秘: 平台授权 → 更多平台 → WooCommerce → 添加授权 →
   **WooCommerce (REST API 授权)** → paste the three things → 授权.
4. Orders sync with the picture from step 4. When they ship in 店小秘, the tracking number lands on
   the Whop order and the order shows Shipped on your page.

---

## Day to day

- Orders come live from Whop every time the page loads. Nothing to sync.
- Tabs for To ship, Shipped, Refunded and All, plus country filter and search.
- Refunded orders are greyed out and the CSV says `REFUNDED - DO NOT SHIP`.
- Fix a wrong tracking number with the "edit" link next to it.
- Change a passcode: edit `worker/config.ts` and `whop apps deploy`, or
  `whop apps secrets set --secret SUPPLIER_PASS=newcode` (no deploy needed).
- If the courier rejects an address (for example the customer only typed a house number),
  email the customer for the full address. Nothing to fix in the page.

## If something goes wrong

| What you see | Fix |
|---|---|
| "Company API key is not authorized for the payment:basic:read scope" | Step 6 not done, or the key is missing a permission. Make a new key with all the ticks and set it again, then deploy. |
| Page works but no orders | Deployed under the wrong business. `whop quickstart`, pick the right one, delete `whop.app.json`, deploy again, redo step 6. |
| "Secret name 'WHOP_API_KEY' is reserved" | Use `ORDERS_API_KEY`. |
| 店小秘 shows no picture | `public/images/product.jpg` missing. Add it and deploy. |
| 店小秘 says tracking couldn't sync | Run `whop apps logs <app_id>` and look for `[woo] unhandled` lines. Give them to Claude. |
| Deploy tries to use `bun` and fails | Delete any `bun.lock` file in the folder. |
| Typecheck fails | `npm install` again, then `whop apps deploy`. |

## Files

- `CLAUDE.md`: notes for Claude Code (loaded automatically when you open the folder)
- `worker/config.ts`: store ID, name, product, passcodes, 店小秘 keys (the file you edit)
- `public/images/product.jpg`: product photo for 店小秘
- `worker/index.ts`: server, orders from Whop, CSV, tracking to shipments, passcode login
- `worker/woo.ts`: the WooCommerce-style connection 店小秘 uses
- `index.html`: the page
- `vite.config.ts`, `wrangler.jsonc`, `package.json`, `tsconfig.json`: build setup, only change the slug
