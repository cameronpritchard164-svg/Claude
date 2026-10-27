# Read this first (note for Claude)

This folder was built and tested in **a different Claude account** (Damian's, the user's brother)
and handed over as a kit. You have no earlier conversation about it and nothing is missing:
everything you need is in this folder. Don't go looking for past chats, and don't rebuild it
from scratch. The code is finished and already running live for Damian's store
(GrinchTissue, with a supplier using 店小秘 / Dianxiaomi). Your job is to set it up for **this**
user's own Whop store.

## What it is

A private orders page hosted on Whop (free Whop hosting, Cloudflare Workers runtime):

- Owner and supplier log in with passcodes. Supplier sees names, addresses, phones, quantities.
  Supplier cannot see emails or money and cannot refund anything.
- Every paid Whop order with its shipping address, CSV export for the supplier.
- Tracking numbers typed or pasted in become Whop shipments (order shows Shipped).
- Orders are numbered 1001, 1002… oldest first.
- Optional: the site also pretends to be a WooCommerce store, so the supplier's ERP
  (店小秘 / Dianxiaomi) pulls orders with pictures automatically and pushes tracking back.

## How to help

1. Walk the user through `SETUP.md` **one step at a time**. Run the commands yourself where
   you can, and wait for them on the steps marked **(you)**.
2. Assume the user is not technical. Short plain messages, one action at a time.
3. Never ask the user to paste their Whop API key into the chat, and never type it into anything
   yourself. They run the `whop apps secrets set` command in their own terminal.
4. The only files that should need editing are `worker/config.ts`, the slug in `wrangler.jsonc`
   and `package.json`, and the product photo at `public/images/product.jpg`.

## Facts already verified live (don't re-discover these)

- `whop apps deploy` creates the app under the CLI's **currently selected business**. Run
  `whop quickstart` and pick the store's business first. If it went to the wrong one: switch,
  delete `whop.app.json`, deploy again.
- Website apps don't show under Developer → Apps and have no Permissions tab. Whop hosting signs
  API calls with an auto "AI Agent Backend" key that can't read payments, so the page shows
  "Company API key is not authorized for the payment:basic:read scope" until the user makes a
  Company API key and stores it as the app secret `ORDERS_API_KEY` (`WHOP_API_KEY` is reserved
  and gets rejected). `whop apps permissions` returns 403 with a browser login, so skip it.
- `wrangler.jsonc` must keep `assets.binding: "ASSETS"` and `run_worker_first: true`.
- `whop apps dev` locally can read orders (it mints a temporary key from the CLI login), but the
  hosted site only works once `ORDERS_API_KEY` is set and redeployed.
- 店小秘 connects as **WooCommerce (REST API 授权)**. It calls `/wp-json/wc/v3/system_status`,
  `/orders` (paged, modified_after), `/products/{id}` for pictures, and on shipping it calls
  `POST /orders/{id}/NOTES` (uppercase), `PUT /orders/{id}` and
  `POST /wc-shipment-tracking/v3/orders/{id}/shipment-trackings`. All of these are handled in
  `worker/woo.ts`. If something new shows up, `whop apps logs <app_id>` prints `[woo] unhandled`.
- 店小秘 keeps the order number it saw on first import, so set everything up (store name,
  numbering) before the supplier connects it.
- Courier rejections usually mean a bad address from the customer (for example only a house
  number with no street). The fix is emailing the customer, not changing code.
