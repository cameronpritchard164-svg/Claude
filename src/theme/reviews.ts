// @ts-nocheck
// Social proof for the product page, from real data only:
//   - reviews you add to src/theme/reviews.json (customers you collected yourself)
//   - reviews buyers leave on Whop for this product (pulled automatically)
//   - paid orders in the last 24 hours (for the "41+ orders" pill)
// Everything stays hidden on the page until there is something real to show.
import manual from './reviews.json'
import { WHOP_ACCOUNT_ID, WHOP_PRODUCT_ID } from './store'

const API = 'https://api.whop.com/api/v1'
const CACHE_MS = 5 * 60_000
// The pill only switches to "N+ orders in the last 24h" from this many orders up.
export const ORDERS_PILL_MIN = 10

let cached = null
let cachedAt = 0

async function getJson(url) {
  const res = await fetch(url, { headers: { accept: 'application/json' } })
  if (!res.ok) throw new Error(`${url} -> ${res.status}`)
  return res.json()
}

const isImage = (f) => f && (f.content_type || '').startsWith('image/') && (f.url || f.source_url)

async function whopReviews() {
  try {
    const data = await getJson(`${API}/reviews?product_id=${WHOP_PRODUCT_ID}&first=50`)
    return (data.data || [])
      .filter((r) => r.status === undefined || r.status === 'published')
      .map((r) => {
        const photo = (r.attachments || []).find(isImage)
        return {
          name: r.user?.name || r.user?.username || 'Whop customer',
          location: '',
          stars: Number(r.stars) || 0,
          title: r.title || '',
          text: r.description || '',
          image: photo ? photo.url || photo.source_url : '',
          verified: r.paid_for_product === true,
          source: 'whop',
        }
      })
  } catch (e) {
    console.error('whop reviews failed', e)
    return []
  }
}

async function ordersLast24h() {
  try {
    const since = new Date(Date.now() - 24 * 3600_000).toISOString()
    const q = new URLSearchParams({ account_id: WHOP_ACCOUNT_ID, product_id: WHOP_PRODUCT_ID, status: 'paid', created_after: since, first: '100' })
    const data = await getJson(`${API}/payments?${q}`)
    return (data.data || []).length
  } catch (e) {
    console.error('orders count failed', e)
    return 0
  }
}

export async function loadSocialProof() {
  if (cached && Date.now() - cachedAt < CACHE_MS) return cached
  const own = (manual.reviews || [])
    .filter((r) => r && String(r.text || '').trim())
    .map((r) => ({ ...r, stars: Math.max(1, Math.min(5, Number(r.stars) || 5)), source: 'manual' }))
  const [fromWhop, orders24h] = await Promise.all([whopReviews(), ordersLast24h()])
  const reviews = [...own, ...fromWhop.filter((r) => r.text.trim() || r.title.trim())]
  const average = reviews.length ? reviews.reduce((s, r) => s + r.stars, 0) / reviews.length : 0
  const happyCustomers = Math.max(0, Math.floor(Number(manual.happy_customers) || 0))
  // Orders from your other store(s), counted only while still inside their 24h window.
  const ro = manual.recent_orders || {}
  const roAt = Date.parse(ro.at || '')
  const otherOrders = !isNaN(roAt) && Date.now() - roAt < 24 * 3600_000 ? Math.max(0, Number(ro.count) || 0) : 0
  cached = { reviews, average, orders24h: orders24h + otherOrders, happyCustomers, noun: manual.loved_by_noun || 'Customers' }
  cachedAt = Date.now()
  return cached
}

const starText = (n) => '★'.repeat(n) + '☆'.repeat(5 - n)
const quoted = (s) => (s ? `“${s}”` : '')

// Fills the product template's stars line, review slider, testimonial cards and
// order pill from real data. Blocks with nothing real to show stay switched off.
export function applySocialProof(tpl, social) {
  if (!social) return tpl
  const t = JSON.parse(JSON.stringify(tpl))
  const B = t.sections?.main?.blocks
  if (!B) return t
  const { reviews, orders24h, happyCustomers, noun } = social

  if (orders24h >= ORDERS_PILL_MIN && B.avatars) {
    const shown = orders24h >= 100 ? 100 : Math.floor(orders24h / 5) * 5
    B.avatars.settings = { ...B.avatars.settings, pill_title: `${shown}+ orders`, pill_sub: 'in the last 24h' }
  }

  // Stars line: your real customer total if you've set one, otherwise reviews with 4+ stars.
  const loved = reviews.filter((r) => r.stars >= 4).length
  const lovedLabel = happyCustomers > loved ? `Loved By ${happyCustomers}+ ${noun}...` : loved > 0 ? `Loved By ${loved} ${noun}...` : ''
  if (B.stars && lovedLabel) {
    delete B.stars.disabled
    B.stars.settings = { ...B.stars.settings, rating: '', count: '', brackets: true, label: lovedLabel }
  }

  if (!reviews.length) return t
  // Best first: highest stars, then ones with a customer photo.
  const ranked = [...reviews].sort((a, b) => b.stars - a.stars || (b.image ? 1 : 0) - (a.image ? 1 : 0))

  if (B.review_slider) {
    const top = ranked.slice(0, 3)
    delete B.review_slider.disabled
    for (let i = 1; i <= 3; i++) {
      const r = top[i - 1]
      B.review_slider.settings[`text_${i}`] = r ? quoted(r.text) : ''
      B.review_slider.settings[`name_${i}`] = r ? `- ${r.location || r.name}` : ''
      B.review_slider.settings[`stars_${i}`] = r ? starText(r.stars) : ''
    }
  }

  const sec = t.sections.reviews
  if (sec) {
    delete sec.disabled
    const top = ranked.slice(0, sec.block_order.length)
    sec.block_order.forEach((bid, i) => {
      const r = top[i]
      const b = sec.blocks[bid]
      if (!r) { b.disabled = true; return }
      delete b.disabled
      b.settings = {
        ...b.settings,
        title: r.title ? `"${r.title}"` : '',
        text: quoted(r.text),
        name: r.name || '',
        location: r.location || '',
        verified: r.verified === true,
        stars: starText(r.stars),
        image: r.image ? { src: r.image, width: 800, height: 800, alt: `Photo from ${r.name || 'a customer'}` } : '',
      }
    })
  }
  return t
}
