# HunterRaid store

DiddyGrab-style single-product Whop store (orange and dark brown). Projector hunting game
with two toy shotguns, $109.99 (was $159.99), Family Pack of 2 and Ultimate Pack of 3,
add-ons: Shipping Protection and 1 Year Warranty.

## Launch

```bash
whop quickstart
```
Choose "Create a new business", name it `HunterRaid`.

```bash
npm install && node scripts/setup-whop.mjs && whop apps deploy && node scripts/hide-free-product.mjs
```
Setup creates the product and all 12 bundle/add-on prices and turns tax collection off.
Deploy asks: Website, name `HunterRaid`, domain `hunterraid.whop.site`.

## Edit

| What | File |
|---|---|
| Reviews, "Loved By N+", recent orders pill | `src/theme/reviews.json` |
| Page text, tabs, FAQ | `theme/templates/product.json` |
| Prices and add-ons | `src/theme/bundle.json` (re-run setup for new prices) |
| Photos | `public/images/` |
