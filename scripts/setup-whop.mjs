// One-time Whop setup for a new store (slug = package.json "name"). Run with the new business selected
// (`whop quickstart`):   node scripts/setup-whop.mjs
// Creates the product (shipping address on) and one link-only price for every
// bundle + add-on combination in src/theme/bundle.json, writes the IDs into
// src/theme/bundle-plans.json and src/theme/store.ts, and switches the business to
// "I'll handle tax myself". Safe to re-run: existing prices are skipped.
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'

const root = new URL('../src/theme/', import.meta.url)
const bundle = JSON.parse(readFileSync(new URL('bundle.json', root)))
const plansFile = new URL('bundle-plans.json', root)
const storeFile = new URL('store.ts', root)
const plans = JSON.parse(readFileSync(plansFile))
const SLUG = JSON.parse(readFileSync(new URL('../package.json', import.meta.url))).name
const whop = (args) => JSON.parse(execFileSync('whop', [...args, '--format', 'json'], { encoding: 'utf8' }))
const round = (n) => Math.round(n * 100) / 100
const subsets = (arr) => arr.reduce((acc, x) => acc.concat(acc.map((s) => [...s, x])), [[]])

console.log('Creating product…')
const product = whop([
  'products', 'create',
  '--title', bundle.product_name,
  '--route', `${SLUG}-product`,
  '--headline', bundle.headline || bundle.product_name,
  '--description', bundle.description || bundle.product_name,
  '--collect_shipping_address',
  '--visibility', 'quick_link',
  '--idempotency-key', `${SLUG}-product-1`,
])
const account = product.account?.id
console.log('  product', product.id, 'account', account)

for (const tier of bundle.tiers) {
  for (const addons of subsets(bundle.addons)) {
    const key = `${tier.qty}:${addons.map((a) => a.key).join(',')}`
    if (plans[key]) continue
    const price = round(tier.price + addons.reduce((s, a) => s + a.price, 0))
    const compare = round(tier.compare + addons.reduce((s, a) => s + a.compare, 0))
    const title = [`${tier.qty} ${bundle.plan_noun || 'Item'}${tier.qty > 1 ? 's' : ''}`, ...addons.map((a) => a.short)].join(' + ') // max 30 chars
    const plan = whop([
      'variants', 'create',
      '--product_id', product.id,
      '--billing_type', 'one_time',
      '--release_method', 'buy_now',
      '--currency', 'usd',
      '--initial_price', String(price),
      '--unlimited_stock',
      '--visibility', 'quick_link',
      '--adaptive_pricing_enabled=false',
      '--override_tax_type', 'inclusive',
      '--payment_method_configuration', JSON.stringify({ enabled: ['card', 'apple_pay', 'google_pay'], disabled: ['paypal', 'paypal_express', 'crypto', 'wechat_pay', 'alipay', 'us_bank_account'], include_platform_defaults: false }),
      '--title', title,
      '--description', [`${tier.qty} x ${bundle.product_name}`, ...addons.map((a) => a.title)].join(' + '),
      '--metadata', JSON.stringify({ bundle_key: key, quantity: tier.qty, addons: addons.map((a) => a.key).join(',') }),
      '--idempotency-key', `${SLUG}-bundle-${key.replace(/[:,]/g, '-')}`,
    ])
    if (compare > price) whop(['variants', 'update', plan.id, '--strike_through_initial_price', String(compare)])
    plans[key] = { id: plan.id, url: plan.purchase_url || `https://whop.com/checkout/${plan.id}` }
    writeFileSync(plansFile, JSON.stringify(plans, null, 2) + '\n')
    console.log(' ', key.padEnd(32), plan.id, price, 'was', compare)
  }
}

let store = readFileSync(storeFile, 'utf8')
  .replace(/export const WHOP_PRODUCT_ID = '[^']*'/, `export const WHOP_PRODUCT_ID = '${product.id}'`)
  .replace(/export const WHOP_PLAN_ID = '[^']*'/, `export const WHOP_PLAN_ID = '${plans['1:'].id}'`)
if (account) store = store.replace(/export const WHOP_ACCOUNT_ID = '[^']*'/, `export const WHOP_ACCOUNT_ID = '${account}'`)
writeFileSync(storeFile, store)

if (account) {
  whop(['accounts', 'update', account, '--tax_remitted_by', 'none'])
  console.log('Tax set to "I\'ll handle tax myself"')
}
console.log(`\nDone: ${Object.keys(plans).length} prices. Next: whop apps deploy`)
