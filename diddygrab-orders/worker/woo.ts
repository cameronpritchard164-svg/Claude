// WooCommerce-compatible REST API, so an ERP that can connect to a WooCommerce store
// (Dianxiaomi / 店小秘 "WooCommerce REST API 授权") can pull our paid Whop orders and push
// tracking numbers back. Only the parts of the WooCommerce v3 API an ERP touches are
// implemented; anything else under /wp-json/ is logged (see `whop apps logs`) and answered
// with an empty 200 so the ERP keeps going.
//
// Auth: WooCommerce consumer key + secret, as HTTP Basic auth or ?consumer_key=&consumer_secret=.
import { STORE, WOOCOMMERCE } from './config'

export type WooOrder = {
  id: string; ref: string; seq?: number; created_at: string; modified_at?: string; paid_at: string; refunded: boolean; disputed: boolean
  name: string; email: string; phone: string; product: string; plan_title: string; qty: number; addons: string[]
  line1: string; line2: string; city: string; state: string; postal_code: string; country: string; country_name: string
  total: number; currency: string; tracking: string; shipment_id: string | null; shipped: boolean
}
type Deps = {
  loadOrders: () => Promise<{ orders: WooOrder[] }>
  saveTracking: (paymentId: string, tracking: string, orders: WooOrder[]) => Promise<unknown>
}

const WC_VERSION = '9.4.2'
const WP_VERSION = '6.7.1'

// Stable positive integer id for a pay_ id (WooCommerce ids are integers).
export function wooId(paymentId: string): number {
  let h = 2166136261
  for (let i = 0; i < paymentId.length; i++) { h ^= paymentId.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0 }
  return (h % 2000000000) + 1000
}
const splitName = (name: string) => { const parts = name.trim().split(/\s+/); return { first_name: parts[0] || '', last_name: parts.slice(1).join(' ') } }
const money = (n: number) => n.toFixed(2)
const SKU = (STORE as any).sku || STORE.name.toUpperCase().replace(/[^A-Z0-9]+/g, '-') + '-1'

const STATUS_RESET_AT = '2026-10-30T07:41:00.000Z'
const maxIso = (a: string, b: string) => (Date.parse(a) > Date.parse(b) ? a : b)

function toWoo(o: WooOrder, siteUrl: string) {
  const id = wooId(o.id)
  // Never report 'completed' to the ERP: 店小秘 treats an order the platform already completed as
  // shipped elsewhere and drops it out of its review / tracking / print workflow.
  const status = o.refunded ? 'refunded' : o.disputed ? 'on-hold' : 'processing'
  const addr = { ...splitName(o.name), company: '', address_1: o.line1, address_2: o.line2, city: o.city, state: o.state, postcode: o.postal_code, country: o.country }
  const unit = o.qty ? o.total / o.qty : o.total
  const addonNote = o.addons.length ? ` (+ ${o.addons.join(', ')})` : ''
  return {
    id,
    parent_id: 0,
    number: o.seq ? String(o.seq) : o.ref,
    order_key: `wc_order_${o.id}`,
    created_via: 'checkout',
    version: WC_VERSION,
    status,
    currency: o.currency,
    date_created: o.created_at,
    date_created_gmt: o.created_at,
    // Bumped once so 店小秘's next incremental sync (modified_after) re-reads every order as 'processing'.
    date_modified: maxIso(o.modified_at || o.created_at, STATUS_RESET_AT),
    date_modified_gmt: maxIso(o.modified_at || o.created_at, STATUS_RESET_AT),
    discount_total: '0.00', discount_tax: '0.00', shipping_total: '0.00', shipping_tax: '0.00', cart_tax: '0.00',
    total: money(o.total), total_tax: '0.00',
    prices_include_tax: false,
    customer_id: 0,
    customer_ip_address: '',
    customer_user_agent: '',
    customer_note: o.addons.length ? `Add-ons: ${o.addons.join(', ')}` : '',
    billing: { ...addr, email: o.email, phone: o.phone },
    shipping: { ...addr, phone: o.phone },
    payment_method: 'whop',
    payment_method_title: 'Whop',
    transaction_id: o.id,
    date_paid: o.paid_at || o.created_at,
    date_paid_gmt: o.paid_at || o.created_at,
    date_completed: null,
    date_completed_gmt: null,
    cart_hash: '',
    meta_data: [
      { id: 1, key: '_whop_payment_id', value: o.id },
      { id: 4, key: '_whop_ref', value: o.ref },
      { id: 2, key: '_whop_plan', value: o.plan_title },
      ...(o.tracking ? [{ id: 3, key: '_tracking_number', value: o.tracking }] : []),
    ],
    line_items: [{
      id: id * 10 + 1,
      name: `${o.product}${addonNote}`,
      product_id: 1001,
      variation_id: 0,
      quantity: o.qty,
      tax_class: '',
      subtotal: money(o.total),
      subtotal_tax: '0.00',
      total: money(o.total),
      total_tax: '0.00',
      taxes: [],
      meta_data: [],
      sku: SKU,
      price: Number(unit.toFixed(2)),
      image: { id: '', src: `${siteUrl}/images/product.jpg` },
      parent_name: null,
    }],
    tax_lines: [], shipping_lines: [], fee_lines: [], coupon_lines: [], refunds: [],
    payment_url: '',
    is_editable: false,
    needs_payment: false,
    needs_processing: !o.shipped,
    _links: { self: [{ href: `${siteUrl}/wp-json/wc/v3/orders/${id}` }], collection: [{ href: `${siteUrl}/wp-json/wc/v3/orders` }] },
  }
}

function authed(request: Request, url: URL) {
  const { consumer_key, consumer_secret } = WOOCOMMERCE
  const qk = url.searchParams.get('consumer_key'), qs = url.searchParams.get('consumer_secret')
  if (qk && qs) {
    // Keys copied from a chat app often pick up spaces or invisible characters; ignore them.
    const clean = (v: string) => v.replace(/[\s\u200b-\u200d\ufeff]/g, '')
    const ok = clean(qk) === consumer_key && clean(qs) === consumer_secret
    if (!ok) console.log(`[woo] bad keys: key len ${qk.length} ${qk.slice(0, 5)}..${qk.slice(-3)} match=${clean(qk) === consumer_key}; secret len ${qs.length} ${qs.slice(0, 5)}..${qs.slice(-3)} match=${clean(qs) === consumer_secret}`)
    return ok
  }
  const h = request.headers.get('authorization') || ''
  if (!/^basic /i.test(h)) console.log(`[woo] auth: no query keys, authorization scheme=${h.split(' ')[0] || 'none'} len=${h.length} headers=${[...request.headers.keys()].join(',')}`)
  if (/^basic /i.test(h)) {
    try {
      const [u, p] = atob(h.slice(6).trim()).split(':')
      const clean = (v: string) => (v || '').replace(/[\s\u200b-\u200d\ufeff]/g, '')
      const ok = clean(u) === consumer_key && clean(p) === consumer_secret
      if (!ok) console.log(`[woo] bad basic auth: user ${String(u).slice(0, 5)}..${String(u).slice(-3)} len ${String(u).length}, pass len ${String(p).length}`)
      return ok
    } catch { return false }
  }
  return false
}

const wcError = (code: string, message: string, status: number) => Response.json({ code, message, data: { status } }, { status })
const withHeaders = (body: unknown, extra: Record<string, string> = {}, status = 200) =>
  Response.json(body, { status, headers: { 'cache-control': 'no-store', 'X-WP-Nonce': '', ...extra } })

export async function handleWoo(request: Request, env: unknown, deps: Deps): Promise<Response | null> {
  const url = new URL(request.url)
  if (!url.pathname.startsWith('/wp-json')) return null
  const siteUrl = url.origin
  // 店小秘 sends some paths in upper case (/orders/123/NOTES); match case-insensitively.
  const path = url.pathname.replace(/\/+$/, '').toLowerCase()
  console.log(`[woo] ${request.method} ${path}${url.search ? ' ' + url.search.replace(/consumer_(key|secret)=[^&]+/g, 'consumer_$1=***') : ''}`)

  // Public discovery endpoints (WooCommerce exposes these without auth).
  if (path === '/wp-json') {
    return withHeaders({ name: `${STORE.name}`, description: '', url: siteUrl, home: siteUrl, gmt_offset: 0, timezone_string: 'UTC', namespaces: ['wc/v3', 'wc/v2', 'wc-shipment-tracking/v3', 'wp/v2'], authentication: [], routes: {} })
  }
  if (path === '/wp-json/wc/v3' || path === '/wp-json/wc/v2') {
    return withHeaders({ namespace: 'wc/v3', routes: { '/wc/v3/orders': {}, '/wc/v3/orders/(?P<id>[\\d]+)': {}, '/wc/v3/system_status': {}, '/wc/v3/products': {} } })
  }

  if (!authed(request, url)) return wcError('woocommerce_rest_cannot_view', 'Sorry, you cannot list resources.', 401)

  if (path === '/wp-json/wc/v3/system_status' || path === '/wp-json/wc/v2/system_status') {
    return withHeaders({
      environment: { home_url: siteUrl, site_url: siteUrl, version: WC_VERSION, wp_version: WP_VERSION, wp_multisite: false, wp_memory_limit: 268435456, wp_debug_mode: false, wp_cron: true, language: 'en_US', external_object_cache: null, server_info: 'cloudflare', php_version: '8.2.0', php_post_max_size: 67108864, php_max_execution_time: 30, php_max_input_vars: 1000, curl_version: '8.0.0', suhosin_installed: false, max_upload_size: 67108864, mysql_version: '8.0', mysql_version_string: '8.0', default_timezone: 'UTC', fsockopen_or_curl_enabled: true, soapclient_enabled: false, domdocument_enabled: true, gzip_enabled: true, mbstring_enabled: true, remote_post_successful: true, remote_post_response: '200', remote_get_successful: true, remote_get_response: '200' },
      database: { wc_database_version: WC_VERSION, database_prefix: 'wp_', maxmind_geoip_database: '', database_tables: {}, database_size: {} },
      active_plugins: [{ plugin: 'woocommerce-shipment-tracking/woocommerce-shipment-tracking.php', name: 'WooCommerce Shipment Tracking', version: '2.5.4', version_latest: '2.5.4', url: '', author_name: 'WooCommerce', author_url: '', network_activated: false }],
      inactive_plugins: [], dropins_mu_plugins: { dropins: [], mu_plugins: [] },
      theme: { name: 'Storefront', version: '4.6.0', version_latest: '4.6.0', author_url: '', is_child_theme: false, has_woocommerce_support: true, has_woocommerce_file: false, has_outdated_templates: false, overrides: [], parent_name: '', parent_version: '', parent_version_latest: '', parent_author_url: '' },
      settings: { api_enabled: true, force_ssl: true, currency: 'USD', currency_symbol: '$', currency_position: 'left', thousand_separator: ',', decimal_separator: '.', number_of_decimals: 2, geolocation_enabled: false, taxonomies: {}, product_visibility_terms: {}, woocommerce_com_connected: 'no' },
      security: { secure_connection: true, hide_errors: true },
      pages: [], post_type_counts: [],
    })
  }

  const productJson = () => ({ id: 1001, name: STORE.product, slug: STORE.product.toLowerCase().replace(/\s+/g, '-'), type: 'simple', status: 'publish', sku: SKU, price: '0', regular_price: '0', manage_stock: false, stock_status: 'instock', images: [{ id: 1, src: `${siteUrl}/images/product.jpg`, name: STORE.product, alt: STORE.product }], categories: [], attributes: [], variations: [] })
  if (/^\/wp-json\/wc\/v[23]\/products$/.test(path)) return withHeaders([productJson()], { 'X-WP-Total': '1', 'X-WP-TotalPages': '1' })
  if (/^\/wp-json\/wc\/v[23]\/products\/\d+$/.test(path)) return withHeaders(productJson())

  const { orders } = await deps.loadOrders()
  const byWooId = new Map(orders.map((o) => [wooId(o.id), o]))

  // GET /wc/v3/orders?status=&after=&before=&modified_after=&per_page=&page=&include=
  const list = /^\/wp-json\/wc\/v[23]\/orders$/.exec(path)
  if (list && request.method === 'GET') {
    const status = (url.searchParams.get('status') || 'any').split(',').map((s) => s.trim()).filter(Boolean)
    const after = url.searchParams.get('after')
    const before = url.searchParams.get('before')
    const modAfter = url.searchParams.get('modified_after')
    const modBefore = url.searchParams.get('modified_before')
    const include = (url.searchParams.get('include') || '').split(',').filter(Boolean).map(Number)
    const perPage = Math.min(100, Math.max(1, Number(url.searchParams.get('per_page')) || 10))
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1)
    let rows = orders.map((o) => toWoo(o, siteUrl))
    if (!status.includes('any')) rows = rows.filter((r) => status.includes(r.status))
    if (after) rows = rows.filter((r) => Date.parse(r.date_created) >= Date.parse(after))
    if (before) rows = rows.filter((r) => Date.parse(r.date_created) <= Date.parse(before))
    if (modAfter) rows = rows.filter((r) => Date.parse(r.date_modified) >= Date.parse(modAfter))
    if (modBefore) rows = rows.filter((r) => Date.parse(r.date_modified) <= Date.parse(modBefore))
    if (include.length) rows = rows.filter((r) => include.includes(r.id))
    const asc = (url.searchParams.get('order') || 'desc') === 'asc'
    rows.sort((a, b) => (asc ? 1 : -1) * a.date_created.localeCompare(b.date_created))
    const total = rows.length
    const pageRows = rows.slice((page - 1) * perPage, page * perPage)
    return withHeaders(pageRows, { 'X-WP-Total': String(total), 'X-WP-TotalPages': String(Math.max(1, Math.ceil(total / perPage))) })
  }

  // GET / PUT /wc/v3/orders/{id}
  const one = /^\/wp-json\/wc\/v[23]\/orders\/(\d+)$/.exec(path)
  if (one) {
    const o = byWooId.get(Number(one[1]))
    if (!o) return wcError('woocommerce_rest_shop_order_invalid_id', 'Invalid ID.', 404)
    if (request.method === 'GET') return withHeaders(toWoo(o, siteUrl))
    if (request.method === 'PUT' || request.method === 'POST' || request.method === 'PATCH') {
      const body = (await request.json().catch(() => ({}))) as any
      // Tracking may arrive as meta_data (_tracking_number / tracking_number) on a status update.
      const meta: any[] = Array.isArray(body.meta_data) ? body.meta_data : []
      const tn = meta.find((m) => /tracking.?(number|no|code)/i.test(String(m?.key || '')))?.value
      if (tn) await deps.saveTracking(o.id, String(tn), orders)
      const fresh = (await deps.loadOrders()).orders.find((x) => x.id === o.id) || o
      return withHeaders(toWoo(fresh, siteUrl))
    }
  }

  // POST /wc/v3/orders/{id}/notes  { note: "Tracking: XYZ ..." }  (plain WooCommerce shipping writes tracking here)
  const notes = /^\/wp-json\/wc\/v[23]\/orders\/(\d+)\/notes$/.exec(path)
  if (notes) {
    const o = byWooId.get(Number(notes[1]))
    if (!o) return wcError('woocommerce_rest_shop_order_invalid_id', 'Invalid ID.', 404)
    if (request.method === 'GET') return withHeaders(o.tracking ? [{ id: 1, author: 'system', date_created: o.created_at, note: `Tracking number: ${o.tracking}`, customer_note: false }] : [])
    const body = (await request.json().catch(() => ({}))) as any
    const note = String(body.note || '')
    // Pull the first thing that looks like a carrier number out of the note text.
    // It must contain digits: notes also hold words like "wanbexpress" or "decoration".
    const m = (note.match(/\b[A-Z0-9-]{8,}\b/gi) || []).filter((w) => /\d{4,}/.test(w)).sort((a, b) => b.length - a.length)[0]
    if (m) await deps.saveTracking(o.id, m, orders)
    else console.log(`[woo] note without tracking for ${o.id}: ${note.slice(0, 120)}`)
    return withHeaders({ id: Date.now(), author: 'erp', date_created: new Date().toISOString(), date_created_gmt: new Date().toISOString(), note, customer_note: Boolean(body.customer_note), added_by_user: false }, {}, 201)
  }

  // Shipment Tracking plugin: POST /wc-shipment-tracking/v3/orders/{id}/shipment-trackings
  const st = /^\/wp-json\/wc-shipment-tracking\/v[23]\/orders\/(\d+)\/shipment-trackings(?:\/(\w+))?$/.exec(path)
  if (st) {
    const o = byWooId.get(Number(st[1]))
    if (!o) return wcError('woocommerce_rest_shop_order_invalid_id', 'Invalid ID.', 404)
    const item = (tracking: string, provider = '') => ({ tracking_id: 'whop-' + o.ref, tracking_provider: provider, custom_tracking_provider: provider, custom_tracking_link: '', tracking_number: tracking, date_shipped: new Date().toISOString().slice(0, 10), tracking_link: '' })
    if (request.method === 'GET') return withHeaders(o.tracking ? [item(o.tracking)] : [])
    if (request.method === 'DELETE') return withHeaders(item(o.tracking))
    const body = (await request.json().catch(() => ({}))) as any
    const tracking = String(body.tracking_number || '').trim()
    if (!tracking) return wcError('woocommerce_rest_missing_tracking_number', 'tracking_number is required.', 400)
    await deps.saveTracking(o.id, tracking, orders)
    return withHeaders({ ...item(tracking, String(body.tracking_provider || body.custom_tracking_provider || '')), _links: { self: [{ href: `${siteUrl}${url.pathname}` }] } }, {}, 201)
  }

  // Anything else: answer empty so the ERP doesn't choke, and leave a log line to add it.
  console.log(`[woo] unhandled ${request.method} ${path}`)
  return withHeaders([], { 'X-WP-Total': '0', 'X-WP-TotalPages': '1' })
}
