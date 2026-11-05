// Hides the free product Whop creates automatically with the app (anything visible
// on the business that isn't the real product). Run after the first `whop apps deploy`.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const store = readFileSync(new URL('../src/theme/store.ts', import.meta.url), 'utf8')
const account = store.match(/WHOP_ACCOUNT_ID = '([^']+)'/)[1]
const realProduct = store.match(/WHOP_PRODUCT_ID = '([^']+)'/)[1]
const whop = (args) => JSON.parse(execFileSync('whop', [...args, '--format', 'json'], { encoding: 'utf8' }))
const list = whop(['products', 'list', '--account_id', account])
for (const p of list.data || list) {
  if (p.id !== realProduct && p.visibility === 'visible') {
    whop(['products', 'update', p.id, '--visibility', 'hidden'])
    console.log('hidden', p.id, p.title)
  }
}
console.log('done')
