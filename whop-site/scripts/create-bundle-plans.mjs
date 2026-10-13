// Creates one link-only Whop plan per bundle combination (costume quantity x
// add-ons) from src/theme/bundle.json and records the plan IDs in
// src/theme/bundle-plans.json. Safe to re-run: existing combos are skipped.
// Usage: node scripts/create-bundle-plans.mjs   (needs a logged-in `whop` CLI)
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const root = new URL('../src/theme/', import.meta.url)
const bundle = JSON.parse(readFileSync(new URL('bundle.json', root)))
const outFile = new URL('bundle-plans.json', root)
const plans = existsSync(outFile) ? JSON.parse(readFileSync(outFile)) : {}

const PRODUCT_ID = 'prod_63epfH2IUlzYn'
const BASE_PLAN_ID = 'plan_rFXSUE37gHuPi' // 1 costume, no add-ons
const round = (n) => Math.round(n * 100) / 100

export const comboKey = (qty, keys) => `${qty}:${keys.join(',')}`

const subsets = (arr) => arr.reduce((acc, x) => acc.concat(acc.map((s) => [...s, x])), [[]])

for (const tier of bundle.tiers) {
  for (const addons of subsets(bundle.addons)) {
    const key = comboKey(tier.qty, addons.map((a) => a.key))
    if (plans[key]) continue
    if (tier.qty === 1 && !addons.length) {
      plans[key] = { id: BASE_PLAN_ID, url: `https://whop.com/checkout/${BASE_PLAN_ID}` }
      continue
    }
    const price = round(tier.price + addons.reduce((s, a) => s + a.price, 0))
    const compare = round(tier.compare + addons.reduce((s, a) => s + a.compare, 0))
    const noun = `${tier.qty} Costume${tier.qty > 1 ? 's' : ''}`
    const title = [noun, ...addons.map((a) => a.short)].join(' + ')
    const description = [`${tier.qty} × ${bundle.product_name}`, ...addons.map((a) => a.title)].join(' + ')
    const args = [
      'plans', 'create',
      '--product_id', PRODUCT_ID,
      '--plan_type', 'one_time',
      '--release_method', 'buy_now',
      '--currency', 'usd',
      '--initial_price', String(price),
      '--unlimited_stock',
      '--visibility', 'quick_link',
      '--title', title,
      '--description', description,
      '--internal_notes', description,
      '--metadata', JSON.stringify({ bundle_key: key, quantity: tier.qty, addons: addons.map((a) => a.key).join(',') }),
      '--idempotency-key', `clausegrab-bundle-${key.replace(/[:,]/g, '-')}`,
      '--format', 'json',
    ]
    const plan = JSON.parse(execFileSync('whop', args, { encoding: 'utf8' }))
    execFileSync('whop', ['plans', 'update', plan.id, '--strike_through_initial_price', String(compare), '--format', 'json'], { encoding: 'utf8' })
    plans[key] = { id: plan.id, url: plan.purchase_url }
    writeFileSync(outFile, JSON.stringify(plans, null, 2) + '\n')
    console.log(key, plan.id, price, compare, title)
  }
}
writeFileSync(outFile, JSON.stringify(plans, null, 2) + '\n')
console.log('total combos', Object.keys(plans).length)
