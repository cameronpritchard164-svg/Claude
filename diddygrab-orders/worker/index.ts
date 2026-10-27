// Whop Orders — hosted fulfilment console (Whop hosting / Cloudflare Workers).
//
// Whop's runtime signs every server-side fetch to the Whop API with this app's key,
// so no API key lives in this code. The page is gated by a passcode cookie:
// owner (you) or supplier. Tracking numbers become Whop shipments.
import { PASSCODES, STORE } from './config'
import { handleWoo } from './woo'

type Env = {
  ASSETS: Fetcher
  WHOP_API_ORIGIN?: string
  // Company API key with payment + shipment scopes (set with `whop apps secrets set ORDERS_API_KEY=...`).
  // Without it, Whop's runtime signs requests with the app's default key, which lacks those scopes.
  ORDERS_API_KEY?: string
  WHOP_API_KEY?: string
  OWNER_PASS?: string
  SUPPLIER_PASS?: string
}
type Role = 'owner' | 'supplier'
type Money = { amount?: string | number } | null | undefined
type Address = { name?: string; line1?: string; line2?: string; city?: string; state?: string; postal_code?: string; country?: string } | null
type Payment = {
  id: string
  status: string
  created_at: string
  updated_at?: string | null
  paid_at?: string | null
  customer_email?: string | null
  customer_phone?: string | null
  shipping_address?: Address
  billing_address?: Address
  metadata?: Record<string, unknown> | null
  line_items?: { plan_title?: string; quantity?: number }[]
  user?: { name?: string | null; username?: string | null } | null
  total?: Money
  currency?: string
  refunded_amount?: Money
  dispute_created_at?: string | null
  dispute_alerted_at?: string | null
  shipment_id?: string | null
}
type Shipment = { id: string; status?: string; created_at?: string; tracking_code?: string; tracking_number?: string; payment_id?: string; payment?: { id: string } | null }

const API_VERSION = '2026-10-07-2'

async function whop<T>(env: Env, path: string, init?: RequestInit): Promise<T> {
  // Locally, `whop apps dev` mints a short-lived WHOP_API_KEY; on Whop hosting we use ORDERS_API_KEY.
  const key = env.ORDERS_API_KEY || (import.meta.env.DEV ? env.WHOP_API_KEY : undefined)
  const origin = key ? 'https://api.whop.com' : env.WHOP_API_ORIGIN ?? 'https://api.whop.com'
  const res = await fetch(`${origin}/api/v1${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Api-Version-Date': API_VERSION,
      ...(key ? { Authorization: `Bearer ${key}` } : {}),
      ...init?.headers,
    },
  })
  const text = await res.text()
  let body: any = null
  try { body = text ? JSON.parse(text) : null } catch { body = text }
  if (!res.ok) {
    const message = body?.error?.message ?? body?.message ?? (typeof body === 'string' ? body : res.statusText)
    console.error(`[whop] ${init?.method ?? 'GET'} ${path} -> ${res.status}: ${message}`)
    throw new Error(message || `Whop API error ${res.status}`)
  }
  return body as T
}
async function whopAll<T>(env: Env, path: string): Promise<T[]> {
  type Page = { data: T[]; page_info?: { has_next_page?: boolean; end_cursor?: string | null } }
  const out: T[] = []
  let after: string | null = null
  for (let i = 0; i < 50; i++) {
    const page: Page = await whop<Page>(env, `${path}&first=100${after ? `&after=${encodeURIComponent(after)}` : ''}`)
    out.push(...(page.data || []))
    if (!page.page_info?.has_next_page || !page.page_info.end_cursor) break
    after = page.page_info.end_cursor
  }
  return out
}

// ---------- orders ----------
const COUNTRIES: Record<string, string> = { US: 'United States', AU: 'Australia', CA: 'Canada', GB: 'United Kingdom', NZ: 'New Zealand', DE: 'Germany', FR: 'France', ES: 'Spain', NL: 'Netherlands', IT: 'Italy', IE: 'Ireland', BE: 'Belgium', AT: 'Austria', CH: 'Switzerland', SE: 'Sweden', NO: 'Norway', DK: 'Denmark', FI: 'Finland', PL: 'Poland', PT: 'Portugal', HU: 'Hungary', HR: 'Croatia', CZ: 'Czechia', SK: 'Slovakia', RO: 'Romania', GR: 'Greece', MX: 'Mexico', BR: 'Brazil', JP: 'Japan', KR: 'South Korea', SG: 'Singapore', MY: 'Malaysia', PH: 'Philippines', ID: 'Indonesia', TH: 'Thailand', IN: 'India', AE: 'United Arab Emirates', SA: 'Saudi Arabia', IL: 'Israel', ZA: 'South Africa', AR: 'Argentina', CL: 'Chile', CO: 'Colombia', TR: 'Turkey', UA: 'Ukraine', LT: 'Lithuania', LV: 'Latvia', EE: 'Estonia', SI: 'Slovenia', BG: 'Bulgaria', RS: 'Serbia', LU: 'Luxembourg', IS: 'Iceland', TW: 'Taiwan', HK: 'Hong Kong', VN: 'Vietnam', PR: 'Puerto Rico' }
const ADDON_NAMES: Record<string, string> = { guarantee: '30-Day Money-Back Guarantee', protection: 'Shipping Protection', mystery: 'Mystery Box' }
const money = (m: Money) => (m && m.amount != null ? Number(m.amount) : 0)
const shipPayment = (s: Shipment) => s.payment_id || s.payment?.id || ''

function normalise(p: Payment, shipment: Shipment | undefined) {
  const a = p.shipping_address || p.billing_address || {}
  const meta = (p.metadata || {}) as Record<string, any>
  const key = String(meta.bundle_key || '')
  const [tierQty, addonStr] = key.includes(':') ? key.split(':') : ['', '']
  const addons = String(addonStr || meta.addons || '').split(',').map((s) => s.trim()).filter(Boolean).map((k) => ADDON_NAMES[k] || k)
  const qty = Number(meta.quantity) || Number(tierQty) || (p.line_items || []).reduce((s, li) => s + (Number(li.quantity) || 0), 0) || 1
  const tracking = shipment?.tracking_code || shipment?.tracking_number || ''
  return {
    id: p.id,
    ref: p.id.slice(-6).toUpperCase(),
    // Sequential order number (1001, 1002, ...) in the order the orders were placed; set in loadOrders.
    seq: 0,
    created_at: p.created_at,
    // Last change the ERP should notice: shipment added, else Whop's own update time.
    modified_at: shipment?.created_at || p.updated_at || p.created_at,
    paid_at: p.paid_at || '',
    refunded: money(p.refunded_amount) > 0,
    refunded_amount: money(p.refunded_amount),
    disputed: Boolean(p.dispute_created_at || p.dispute_alerted_at),
    name: a.name || meta.customer_name || p.user?.name || p.user?.username || '',
    email: p.customer_email || '',
    phone: p.customer_phone || String(meta.phone || ''),
    product: STORE.product,
    plan_title: (p.line_items || [])[0]?.plan_title || '',
    qty,
    addons,
    line1: a.line1 || '', line2: a.line2 || '', city: a.city || '', state: a.state || '', postal_code: a.postal_code || '',
    country: a.country || '', country_name: COUNTRIES[a.country || ''] || a.country || '',
    total: money(p.total), currency: (p.currency || 'usd').toUpperCase(),
    tracking,
    shipment_id: shipment?.id || p.shipment_id || null,
    shipment_status: shipment?.status || (tracking ? 'pre_transit' : ''),
    shipped: Boolean(tracking),
  }
}
type Order = ReturnType<typeof normalise>

// The ERP pages through orders in many small requests; keep one pull from Whop for a minute.
let ordersCache: { at: number; data: { store: typeof STORE; fetched_at: string; orders: Order[] } } | null = null
const CACHE_MS = 60_000

async function loadOrders(env: Env, fresh = false) {
  if (!fresh && ordersCache && Date.now() - ordersCache.at < CACHE_MS) return ordersCache.data
  const [payments, shipments] = await Promise.all([
    Promise.all(STORE.products.map((id) => whopAll<Payment>(env, `/payments?account_id=${STORE.account_id}&product_id=${id}&status=paid&order=created_at&direction=desc`))).then((r) => r.flat()),
    whopAll<Shipment>(env, `/shipments?account_id=${STORE.account_id}`).catch(() => [] as Shipment[]),
  ])
  const byPayment = new Map(shipments.map((s) => [shipPayment(s), s]))
  const orders = payments.map((p) => normalise(p, byPayment.get(p.id)))
  const oldestFirst = [...orders].sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id))
  oldestFirst.forEach((o, idx) => { o.seq = 1001 + idx })
  const data = { store: STORE, fetched_at: new Date().toISOString(), orders }
  ordersCache = { at: Date.now(), data }
  return data
}

async function saveTracking(env: Env, paymentId: string, tracking: string, orders: Order[]) {
  tracking = String(tracking || '').trim()
  if (!/^pay_/.test(paymentId)) throw new Error('bad payment id')
  if (!tracking) throw new Error('empty tracking number')
  const existing = orders.find((o) => o.id === paymentId)?.shipment_id
  const result = existing
    ? await whop<Shipment>(env, `/shipments/${existing}`, { method: 'PATCH', body: JSON.stringify({ tracking_number: tracking }) })
    : await whop<Shipment>(env, '/shipments', {
        method: 'POST',
        headers: { 'Idempotency-Key': `${paymentId}-${tracking}` },
        body: JSON.stringify({ account_id: STORE.account_id, payment_id: paymentId, tracking_number: tracking }),
      })
  ordersCache = null
  return result
}

// ---------- CSV ----------
const esc = (v: unknown) => { const s = v == null ? '' : String(v); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }
type Col = [string, (r: Order) => unknown]
const toCsv = (rows: Order[], cols: Col[]) => '﻿' + [cols.map((c) => esc(c[0])).join(','), ...rows.map((r) => cols.map((c) => esc(c[1](r))).join(','))].join('\r\n') + '\r\n'
const fmtDate = (iso: string) => (iso ? new Date(iso).toISOString().slice(0, 10) : '')
const SUPPLIER_COLS: Col[] = [
  ['Order', (r) => r.seq], ['Ref', (r) => r.ref], ['Order Date', (r) => fmtDate(r.created_at)], ['Payment ID', (r) => r.id],
  ['Customer Name', (r) => r.name], ['Phone', (r) => r.phone],
  ['Product', (r) => r.product], ['Quantity', (r) => r.qty], ['Add-ons', (r) => r.addons.join(' + ')],
  ['Address Line 1', (r) => r.line1], ['Address Line 2', (r) => r.line2], ['City', (r) => r.city], ['State / Province', (r) => r.state],
  ['Postal Code', (r) => r.postal_code], ['Country', (r) => r.country_name], ['Country Code', (r) => r.country],
  ['Tracking Number', (r) => r.tracking], ['Status', (r) => (r.refunded ? 'REFUNDED - DO NOT SHIP' : r.disputed ? 'DISPUTED - HOLD' : r.shipped ? 'Shipped' : 'To ship')],
]
const FULL_COLS: Col[] = [...SUPPLIER_COLS.slice(0, 6), ['Email', (r) => r.email], ...SUPPLIER_COLS.slice(6, 17), ['Total', (r) => r.total.toFixed(2)], ['Currency', (r) => r.currency], ['Refunded', (r) => (r.refunded ? r.refunded_amount.toFixed(2) : '')], ['Paid At', (r) => r.paid_at], SUPPLIER_COLS[17]]

function parseCsv(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let cell = ''; let q = false
  text = text.replace(/^﻿/, '')
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++ } else q = false } else cell += ch }
    else if (ch === '"') q = true
    else if (ch === ',') { row.push(cell); cell = '' }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = '' }
    else cell += ch
  }
  if (cell || row.length) { row.push(cell); rows.push(row) }
  return rows.filter((r) => r.some((c) => c.trim()))
}
// Accepts our CSV (Order / Payment ID + Tracking Number columns) or loose "REF TRACKING" lines.
function extractTracking(text: string, orders: Order[]) {
  const rows = parseCsv(text).map((r) => (r.length === 1 && /\s/.test(r[0].trim()) ? r[0].trim().split(/\s+/) : r))
  if (!rows.length) return [] as { id: string; tracking: string }[]
  const header = rows[0].map((h) => h.trim().toLowerCase())
  const trackIdx = header.findIndex((h) => /track/.test(h))
  const payIdx = header.findIndex((h) => /payment|pay id|pay_id/.test(h))
  const refIdx = header.findIndex((h) => h === 'order' || h === 'ref' || /order (no|number|id|ref)/.test(h))
  const body = trackIdx >= 0 ? rows.slice(1) : rows
  const byRef = new Map<string, string>([...orders.map((o) => [o.ref, o.id] as [string, string]), ...orders.map((o) => [String(o.seq), o.id] as [string, string])])
  const out: { id: string; tracking: string }[] = []
  for (const r of body) {
    const payCell = (payIdx >= 0 && r[payIdx]) || r.find((c) => /^pay_/.test(c.trim())) || ''
    const refCell = (refIdx >= 0 ? r[refIdx] : payCell ? '' : r[0]) || ''
    const id = payCell.trim() || byRef.get(refCell.trim().toUpperCase()) || ''
    const looksLikeTracking = (c: string) => /^[A-Z0-9-]{6,}$/i.test(c.trim()) && /\d/.test(c)
    const loose = () => r.filter((c) => looksLikeTracking(c) && !/^pay_/.test(c.trim()) && c.trim().toUpperCase() !== refCell.trim().toUpperCase()).pop() || ''
    let tracking = trackIdx < 0 ? loose() : r.length > trackIdx ? r[trackIdx] : r.length === 2 ? loose() : ''
    tracking = String(tracking).trim()
    if (!tracking || /track/i.test(tracking)) continue
    out.push({ id: id || refCell.trim() || '?', tracking })
  }
  return out
}

// ---------- auth ----------
const passes = (env: Env) => ({ owner: env.OWNER_PASS || PASSCODES.owner, supplier: env.SUPPLIER_PASS || PASSCODES.supplier })
async function token(role: Role, env: Env) {
  const p = passes(env)
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${role}:${p[role]}:orders`))
  return role + '.' + [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}
async function roleFrom(request: Request, env: Env): Promise<Role | null> {
  const m = /(?:^|;\s*)orders_auth=([^;]+)/.exec(request.headers.get('cookie') || '')
  if (!m) return null
  for (const role of ['owner', 'supplier'] as Role[]) if (m[1] === (await token(role, env))) return role
  return null
}
const json = (body: unknown, status = 200, headers: Record<string, string> = {}) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...headers } })

const LOGIN_PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${STORE.name} Orders</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f4f5f7;font:15px -apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Roboto,sans-serif;color:#14171f}
form{background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:28px;width:min(360px,90vw);box-shadow:0 10px 30px rgba(0,0,0,.06)}h1{font-size:20px;margin:0 0 4px}p{margin:0 0 18px;color:#6b7280}
input{width:100%;box-sizing:border-box;padding:11px 12px;border:1px solid #e5e7eb;border-radius:9px;font:inherit;margin-bottom:12px}button{width:100%;padding:11px;border:0;border-radius:9px;background:#4C9A2A;color:#fff;font:inherit;font-weight:700;cursor:pointer}.err{color:#C8102E;margin-bottom:10px;display:none}</style></head>
<body><form method="post" action="/api/login"><h1>${STORE.name} Orders</h1><p>Enter your passcode to see the orders.</p><div class="err" id="err">Wrong passcode, try again.</div><input name="pass" type="password" placeholder="Passcode" autofocus required><button>Open orders</button></form>
<script>if(location.search.includes('bad'))document.getElementById('err').style.display='block'</script></body></html>`

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    try {
      if (url.pathname === '/api/health') return json({ ok: true })
      // Supplier ERP (店小秘) talks WooCommerce; it has its own key pair, not the passcode cookie.
      const woo = await handleWoo(request, env, { loadOrders: () => loadOrders(env), saveTracking: (id, t, orders) => saveTracking(env, id, t, orders as any) })
      if (woo) return woo
      if (url.pathname === '/api/login' && request.method === 'POST') {
        const form = await request.formData()
        const pass = String(form.get('pass') || '').trim()
        const p = passes(env)
        const role: Role | null = pass && pass === p.owner ? 'owner' : pass && pass === p.supplier ? 'supplier' : null
        if (!role) return Response.redirect(new URL('/?bad=1', url).toString(), 303)
        return new Response(null, { status: 303, headers: { location: '/', 'set-cookie': `orders_auth=${await token(role, env)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 90}` } })
      }
      if (url.pathname === '/api/logout') return new Response(null, { status: 303, headers: { location: '/', 'set-cookie': 'orders_auth=; Path=/; Max-Age=0' } })

      // Product photo for the ERP's order lines (public, no login needed).
      if (url.pathname.startsWith('/images/')) return env.ASSETS.fetch(request)

      const role = await roleFrom(request, env)
      if (!role) {
        if (url.pathname.startsWith('/api/')) return json({ error: 'login required' }, 401)
        return new Response(LOGIN_PAGE, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } })
      }

      if (url.pathname === '/api/me') return json({ role, store: STORE })
      if (url.pathname === '/api/orders') {
        const data = await loadOrders(env, true)
        if (role === 'supplier') for (const o of data.orders) { o.email = ''; o.total = 0; o.refunded_amount = 0 }
        return json(data)
      }
      if (url.pathname === '/api/export.csv') {
        const { orders } = await loadOrders(env)
        const view = role === 'owner' && url.searchParams.get('view') === 'full' ? 'full' : 'supplier'
        const filter = url.searchParams.get('filter') || 'all'
        const ids = (url.searchParams.get('ids') || '').split(',').filter(Boolean)
        const country = url.searchParams.get('country') || ''
        let rows = orders
        if (ids.length) rows = rows.filter((o) => ids.includes(o.id))
        if (filter === 'unshipped') rows = rows.filter((o) => !o.shipped && !o.refunded)
        if (filter === 'shipped') rows = rows.filter((o) => o.shipped)
        if (country) rows = rows.filter((o) => o.country === country)
        rows = [...rows].sort((a, b) => a.created_at.localeCompare(b.created_at))
        const name = `${STORE.name}-orders-${view}-${filter}${country ? '-' + country : ''}-${fmtDate(new Date().toISOString())}.csv`
        return new Response(toCsv(rows, view === 'full' ? FULL_COLS : SUPPLIER_COLS), { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="${name}"` } })
      }
      if (url.pathname === '/api/tracking' && request.method === 'POST') {
        const { id, tracking } = (await request.json()) as { id: string; tracking: string }
        const { orders } = await loadOrders(env)
        const shipment = await saveTracking(env, id, tracking, orders)
        return json({ ok: true, shipment })
      }
      if (url.pathname === '/api/tracking/bulk' && request.method === 'POST') {
        const { text, dry } = (await request.json()) as { text: string; dry?: boolean }
        const { orders } = await loadOrders(env)
        const known = new Map(orders.map((o) => [o.id, o]))
        const items = extractTracking(text, orders)
        const results: any[] = []
        for (const it of items) {
          const o = known.get(it.id)
          if (!o) { results.push({ ...it, ok: false, error: 'unknown order' }); continue }
          if (dry) { results.push({ ...it, ok: true, ref: String(o.seq), name: o.name, replaces: o.tracking || '' }); continue }
          try { await saveTracking(env, it.id, it.tracking, orders); results.push({ ...it, ok: true, ref: String(o.seq), name: o.name }) } catch (e: any) { results.push({ ...it, ok: false, ref: String(o.seq), name: o.name, error: e.message }) }
        }
        return json({ results, parsed: items.length })
      }
      if (url.pathname.startsWith('/api/')) return json({ error: 'not found' }, 404)
      return env.ASSETS.fetch(request)
    } catch (e: any) {
      console.error(e)
      return json({ error: e.message || String(e) }, 500)
    }
  },
} satisfies ExportedHandler<Env>
