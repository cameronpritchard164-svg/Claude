// @ts-nocheck
// Read-only Whop data layer for the dashboard. Everything comes from Whop's
// own API (the hosted sites are tracked by Whop automatically), authenticated
// with the API key stored as the app secret GRABCO_WHOP_KEY (WHOP_API_KEY is
// a name reserved by Whop's runtime).
import { env } from 'cloudflare:workers'

export const ACCOUNT_ID = env.WHOP_ACCOUNT_ID || 'biz_eBI3bCf0mqzUIk'
const ORIGIN = env.WHOP_API_ORIGIN || 'https://api.whop.com'

export const STORES = {
  clausegrab: { key: 'clausegrab', name: 'ClauseGrab', host: 'clausegrab.whop.site', color: '#e66767', products: ['prod_63epfH2IUlzYn'] },
  diddygrab: { key: 'diddygrab', name: 'DiddyGrab', host: 'diddygrab.whop.site', color: '#9085e9', products: ['prod_Ek1iCKY3X54ue', 'prod_aUltblm4k46SE'] },
}
export const storeOfHost = (h) => Object.values(STORES).find((s) => s.host === h) || null
export const storeOfProduct = (id) => Object.values(STORES).find((s) => s.products.includes(id)) || null

// Secrets set through /setup live here until Whop injects them on the next deploy.
const runtime = (globalThis.__grabco ||= {})
export const apiKey = () => runtime.GRABCO_WHOP_KEY || env.GRABCO_WHOP_KEY || ''
export const dashboardPassword = () => runtime.DASHBOARD_PASSWORD || env.DASHBOARD_PASSWORD || ''
export const setRuntimeSecrets = (s) => Object.assign(runtime, s)

export class WhopError extends Error {
  constructor(status, body, path) {
    super(`Whop ${status} on ${path}: ${String(body).slice(0, 300)}`)
    this.status = status
  }
}

export async function whop(path, { method = 'GET', body, key = apiKey() } = {}) {
  const res = await fetch(ORIGIN + path, {
    method,
    headers: { authorization: `Bearer ${key}`, accept: 'application/json', ...(body ? { 'content-type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  if (!res.ok) throw new WhopError(res.status, text, path)
  return text ? JSON.parse(text) : null
}

const qs = (o) =>
  Object.entries(o)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&')

// ---- stats ----------------------------------------------------------------

export async function series(metric, { from, to, interval = 'day', breakdown_by, time_zone } = {}) {
  const r = await whop(`/api/v1/stats/time_series/${metric}?${qs({ account_id: ACCOUNT_ID, from, to, interval, breakdown_by, time_zone })}`)
  const points = (r?.data?.points || []).map((p) => ({
    t: p.timestamp * 1000,
    value: Number(p.value || 0),
    breakdown: (p.breakdown || []).map((b) => ({ name: b.name || '', value: Number(b.value || 0) })),
  }))
  return { points, currency: r?.data?.currency, totals: r?.data?.totals }
}

// Sums each breakdown name across all points.
export const sumBreakdown = (s) => {
  const m = new Map()
  for (const p of s.points) for (const b of p.breakdown) m.set(b.name, (m.get(b.name) || 0) + b.value)
  return [...m.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
}

// ---- events ---------------------------------------------------------------

export async function listEvents({ from, to, event, first = 500, pages = 4 }) {
  const out = []
  let after
  for (let i = 0; i < pages; i++) {
    const r = await whop(`/api/v1/events?${qs({ account_id: ACCOUNT_ID, from, to, event, first, after, direction: 'desc' })}`)
    out.push(...(r?.data || []))
    if (!r?.page_info?.has_next_page) break
    after = r.page_info.end_cursor
  }
  return out
}

// ---- payments -------------------------------------------------------------

export async function listPayments({ from, to, first = 100, pages = 5 }) {
  const out = []
  let after
  for (let i = 0; i < pages; i++) {
    const r = await whop(`/api/v1/payments?${qs({ account_id: ACCOUNT_ID, created_after: from, created_before: to, first, after, order: 'created_at' })}`)
    out.push(...(r?.data || []))
    if (!r?.page_info?.has_next_page) break
    after = r.page_info.end_cursor
  }
  return out
}

// Pulls a dollar amount out of whichever field a payment carries it in.
export const paymentAmount = (p) => {
  for (const k of ['total', 'final_amount', 'amount', 'subtotal', 'amount_paid', 'total_usd_amount']) {
    const v = p?.[k]
    if (v == null) continue
    if (typeof v === 'number') return v
    if (typeof v === 'string' && !isNaN(Number(v))) return Number(v)
    if (typeof v === 'object' && v.amount != null) return Number(v.amount)
  }
  return 0
}
export const paymentIsPaid = (p) => ['paid', 'succeeded', 'completed'].includes(String(p?.status || '').toLowerCase())
export const paymentProductId = (p) => p?.product?.id || p?.access_pass?.id || p?.plan?.product?.id || p?.product_id || ''
export const paymentWhen = (p) => p?.paid_at || p?.created_at || p?.updated_at || ''

// ---- account / setup ------------------------------------------------------

export const account = (key) => whop(`/api/v1/accounts/${ACCOUNT_ID}`, { key })
export const saveAppSecrets = (key, secrets) => whop(`/api/v1/apps/${env.APP_ID}`, { method: 'PATCH', body: { secrets }, key })
