#!/usr/bin/env bash
# One-time Whop setup for the DiddyGrab site: registers the hosted app,
# creates the product, base plan and photos, then wires the IDs into the
# site and creates the bundle plans. Needs a logged-in `whop` CLI.
set -euo pipefail
cd "$(dirname "$0")/.."
S="${PHOTO_DIR:-/tmp/claude-0/-home-user-Claude/86c2885f-6484-51bb-8257-bf008f1b9ffe/scratchpad}"
j() { python3 -c "import json,sys;d=json.load(sys.stdin);print(d$1)"; }

echo "== app"
APP=$(whop apps create --name DiddyGrab --route diddygrab --app_type website --idempotency-key diddygrab-app-v1 --format json)
APP_ID=$(echo "$APP" | j "['id']"); echo "app $APP_ID $(echo "$APP" | j "['hosted_url']")"
printf '{\n\t"app_id": "%s",\n\t"name": "DiddyGrab",\n\t"route": "diddygrab"\n}\n' "$APP_ID" > whop.app.json
sed -i "s/APP_ID_TBD/$APP_ID/" src/theme/site.ts

echo "== product"
# Registering the app auto-created a free product on the `diddygrab` route (hidden
# below); the real product lives on `diddygrab-costume` so it can collect a
# shipping address, which `products update` cannot switch on.
PROD=$(whop products create --title "DiddyGrab™ Inflatable Carry-Me Costume" --route diddygrab-costume \
  --headline "He's got you. The inflatable carry-me costume." \
  --description "The inflatable carry-me costume where a big guy in a black suit carries you off. You step into his legs, the battery fan inflates him around you, and your real head and hands come out of the little guy in the blue jeans. Walk, dance and sit down in it. One adult size fits roughly 5'3 to 6'4 (160 to 195 cm). Stands up in about 60 seconds on 4 AA batteries (not included) and runs for roughly 4 hours. Dispatched in 1 to 3 business days, delivered in 2 to 3 weeks with tracking. 30-day money-back guarantee." \
  --collect_shipping_address --custom_cta order_now --visibility visible --idempotency-key diddygrab-product-v4 --format json)
PID=$(echo "$PROD" | j "['id']"); echo "product $PID"

echo "== base plan"
PLAN=$(whop plans create --product_id "$PID" --plan_type one_time --release_method buy_now --initial_price 99.99 --currency usd \
  --unlimited_stock --visibility visible --title "DiddyGrab Costume" --adaptive_pricing_enabled=false --idempotency-key diddygrab-plan-v2 --format json)
PLID=$(echo "$PLAN" | j "['id']"); echo "plan $PLID"
whop plans update "$PLID" --strike_through_initial_price 199.98 --format json | grep -E "strike_through_initial_price|adaptive_pricing"

echo "== photos"
F1=$(whop files create --filepath "$S/diddygrab-studio.jpg" --visibility public --format json); F1_ID=$(echo "$F1" | j "['id']"); F1_URL=$(echo "$F1" | j "['url']")
F2=$(whop files create --filepath "$S/diddygrab-infographic.jpg" --visibility public --format json); F2_ID=$(echo "$F2" | j "['id']"); F2_URL=$(echo "$F2" | j "['url']")
echo "files $F1_ID $F2_ID"
whop products update "$PID" --gallery_images "[{\"id\":\"$F1_ID\"},{\"id\":\"$F2_ID\"}]" --metadata '{"gallery_version":"1"}' --format json | grep -c '"id"' >/dev/null

echo "== wire ids into the site"
python3 - "$PID" "$PLID" "$F1_ID" "$F1_URL" "$F2_ID" "$F2_URL" <<'EOF'
import re, sys
pid, plid, f1, u1, f2, u2 = sys.argv[1:]
p = 'src/theme/store.ts'; s = open(p).read()
s = re.sub(r"WHOP_PRODUCT_ID = '[^']+'", f"WHOP_PRODUCT_ID = '{pid}'", s)
s = re.sub(r"WHOP_PLAN_ID = '[^']+'", f"WHOP_PLAN_ID = '{plid}'", s)
start = s.index("    gallery_images: [\n      { id:"); end = s.index("    ],", start) + len("    ],")
s = s[:start] + f"""    gallery_images: [
      {{ id: '{f1}', url: '{u1}', content_type: 'image/jpeg', width: 1024, height: 1536 }},
      {{ id: '{f2}', url: '{u2}', content_type: 'image/jpeg', width: 1108, height: 1420 }},
    ],""" + s[end:]
open(p, 'w').write(s)
p = 'scripts/create-bundle-plans.mjs'; s = open(p).read()
s = re.sub(r"const PRODUCT_ID = '[^']+'", f"const PRODUCT_ID = '{pid}'", s)
s = re.sub(r"const BASE_PLAN_ID = '[^']+'", f"const BASE_PLAN_ID = '{plid}'", s)
s = s.replace("clausegrab-bundle-", "diddygrab-bundle-")
open(p, 'w').write(s)
print('ids wired')
EOF

echo "== bundle plans"
rm -f src/theme/bundle-plans.json
node scripts/create-bundle-plans.mjs | tail -3
echo "== done"
