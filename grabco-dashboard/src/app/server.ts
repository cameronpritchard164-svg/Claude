// @ts-nocheck
// GrabCo Dashboard: routing, login and the one-time setup page.
import { env } from 'cloudflare:workers'
import {
  ACCOUNT_ID, STORES, storeOfHost, storeOfProduct, apiKey, dashboardPassword, setRuntimeSecrets, WhopError,
  series, sumBreakdown, listEvents, listPayments, paymentAmount, paymentIsPaid, paymentProductId, paymentWhen, account, saveAppSecrets,
} from './whop'
import { page, esc, tile, lineChart, columnChart, barList, funnel, storeDot, money, num, pct, day, when } from './render'

const html = (body, status = 200, headers = {}) => new Response(body, { status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', ...headers } })
const redirect = (to) => new Response(null, { status: 303, headers: { location: to } })

// ---- auth (cookie = hash of the dashboard password) -----------------------

async function sha(s) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('')
}
const token = (pw) => sha(`grabco:${env.APP_ID}:${pw}`)
const cookie = (req, name) => (req.headers.get('cookie') || '').split(/;\s*/).find((c) => c.startsWith(name + '='))?.slice(name.length + 1) || ''
async function authed(req) {
  const pw = dashboardPassword()
  return !!pw && cookie(req, 'gc') === (await token(pw))
}

// ---- pages ----------------------------------------------------------------

const loginPage = (err = '') =>
  page('GrabCo Dashboard · Sign in', `${brandHeader(false)}<form class="setup" method="post" action="/login"><h2 style="margin:0">Sign in</h2><p>Enter the dashboard password.</p>${err ? `<p class="err">${esc(err)}</p>` : ''}<label>Password</label><input type="password" name="password" autofocus required><button type="submit">Open dashboard</button></form>`)

const setupPage = (err = '', ok = '') =>
  page(
    'GrabCo Dashboard · Setup',
    `${brandHeader(false)}<form class="setup" method="post" action="/setup"><h2 style="margin:0">One-time setup</h2>
<p>Create an API key in your Whop dashboard (<b>Developer → API keys</b>) with these permissions: <code>stats:read</code>, <code>payment:basic:read</code>, <code>access_pass:basic:read</code>, <code>plan:basic:read</code>, <code>company:basic:read</code>, <code>developer:update_app</code>. Paste it below. It is sent straight to this app over HTTPS and stored as an encrypted app secret on Whop.</p>
${err ? `<p class="err">${esc(err)}</p>` : ''}${ok ? `<p style="color:#9be29b">${esc(ok)}</p>` : ''}
<label>Whop API key</label><input type="password" name="key" required placeholder="whop_…">
<label>Choose a dashboard password</label><input type="password" name="password" required minlength="6">
<button type="submit">Save and open dashboard</button></form>`,
  )

const brandHeader = (filters = true, q = {}) => `<header class="top"><div class="brand"><div class="mark">G</div><div><h1>GrabCo</h1><small>Store dashboard</small></div></div>${
  filters
    ? `<div class="filters"><span class="seg">${[['7', '7 days'], ['14', '14 days'], ['30', '30 days'], ['90', '90 days']]
        .map(([d, l]) => `<a class="${q.days === d ? 'on' : ''}" href="?days=${d}&store=${q.store}">${l}</a>`)
        .join('')}</span><span class="seg">${[['all', 'All stores'], ['clausegrab', 'ClauseGrab'], ['diddygrab', 'DiddyGrab']]
        .map(([s, l]) => `<a class="${q.store === s ? 'on' : ''}" href="?days=${q.days}&store=${s}">${l}</a>`)
        .join('')}</span><a class="meta" href="/logout">Sign out</a></div>`
    : ''
}</header>`

// ---- dashboard data -------------------------------------------------------

const iso = (d) => d.toISOString().slice(0, 10)

async function dashboard(q) {
  const days = Math.min(365, Math.max(1, Number(q.days) || 7))
  const now = new Date()
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const from = new Date(to.getTime() - (days - 1) * 864e5)
  const range = { from: iso(from), to: iso(to) }
  const fromISO = from.toISOString(), toISO = new Date(to.getTime() + 864e5).toISOString()
  const stores = q.store === 'all' ? Object.values(STORES) : [STORES[q.store] || STORES.clausegrab]
  const inScope = (store) => stores.includes(store)

  const [people, views, checkoutsRaw, paymentsRaw, countries, devices, sources, referrersRaw] = await Promise.all([
    series('traffic_people', { ...range, breakdown_by: 'hostname' }),
    series('traffic_events', { ...range, breakdown_by: 'hostname' }),
    listEvents({ from: fromISO, to: toISO, event: 'checkout_session.created' }),
    listPayments({ from: fromISO, to: toISO }),
    series('traffic_events', { ...range, breakdown_by: 'country_code' }),
    series('traffic_events', { ...range, breakdown_by: 'device_type' }),
    series('traffic_events', { ...range, breakdown_by: 'source' }),
    listEvents({ from: fromISO, to: toISO, event: 'pixel.page', pages: 2 }),
  ])

  // Day labels across the range
  const dayKeys = [...Array(days)].map((_, i) => from.getTime() + i * 864e5)
  const labels = dayKeys.map(day)
  const byDay = (s, store) => dayKeys.map((t) => {
    const p = s.points.find((x) => x.t === t)
    if (!p) return 0
    return p.breakdown.filter((b) => storeOfHost(b.name) === store).reduce((a, b) => a + b.value, 0)
  })

  const checkouts = checkoutsRaw.map((e) => ({ ...e, store: storeOfProduct(e.related?.product?.id) })).filter((e) => inScope(e.store))
  const paid = paymentsRaw.filter(paymentIsPaid).map((p) => ({ ...p, store: storeOfProduct(paymentProductId(p)) })).filter((p) => inScope(p.store))

  const perStore = stores.map((store) => {
    const visitors = sumBreakdown(people).filter((b) => storeOfHost(b.name) === store).reduce((a, b) => a + b.value, 0)
    const pageViews = sumBreakdown(views).filter((b) => storeOfHost(b.name) === store).reduce((a, b) => a + b.value, 0)
    const co = checkouts.filter((e) => e.store === store)
    const orders = paid.filter((p) => p.store === store)
    const revenue = orders.reduce((a, p) => a + paymentAmount(p), 0)
    return { store, visitors, pageViews, checkouts: co.length, orders: orders.length, revenue }
  })
  const tot = perStore.reduce((a, s) => ({ visitors: a.visitors + s.visitors, pageViews: a.pageViews + s.pageViews, checkouts: a.checkouts + s.checkouts, orders: a.orders + s.orders, revenue: a.revenue + s.revenue }), { visitors: 0, pageViews: 0, checkouts: 0, orders: 0, revenue: 0 })

  const referrers = new Map()
  for (const e of referrersRaw) {
    if (!inScope(storeOfHost(new URL(e.url || 'https://x/').hostname))) continue
    let r = e.referrer_url || ''
    try { r = r ? new URL(r).hostname.replace(/^(www|m|l|lm)\./, '') : 'direct / none' } catch { r = 'other' }
    referrers.set(r, (referrers.get(r) || 0) + 1)
  }
  const refRows = [...referrers.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)

  const filtHost = (s) => sumBreakdown(s).filter((b) => b.name !== '')
  const kpis = `<div class="kpis">
${tile('Revenue', money(tot.revenue), `${num(tot.orders)} paid order${tot.orders === 1 ? '' : 's'}`, 'var(--brand)', true)}
${tile('Visitors', num(tot.visitors), `${num(tot.pageViews)} page views`, 'var(--seq)')}
${tile('Checkouts started', num(tot.checkouts), tot.visitors ? `${pct(tot.checkouts / tot.visitors)} of visitors` : '', 'var(--seq)')}
${tile('Conversion rate', pct(tot.visitors ? tot.orders / tot.visitors : NaN), 'paid orders ÷ visitors', 'var(--good)')}
${tile('Avg order value', tot.orders ? money(tot.revenue / tot.orders) : '–', '', 'var(--brand-2)')}
</div>`

  const chartSeries = (metricSeries) => stores.map((store) => ({ name: store.name, color: store.color, values: byDay(metricSeries, store) }))
  const ordersSeries = stores.map((store) => ({ name: store.name, color: store.color, values: dayKeys.map((t) => paid.filter((p) => p.store === store && sameDay(paymentWhen(p), t)).length) }))
  const revenueSeries = [{ name: 'Revenue', color: '#3987e5', values: dayKeys.map((t) => paid.filter((p) => sameDay(paymentWhen(p), t)).reduce((a, p) => a + paymentAmount(p), 0)) }]

  const storeCards = perStore
    .map(
      (s) => `<div class="card c6"><h2>${storeDot(s.store)}</h2><p class="sub">${esc(s.store.host)} · last ${days} days</p>${funnel(
        [{ name: 'Visitors', value: s.visitors }, { name: 'Checkout started', value: s.checkouts }, { name: 'Paid', value: s.orders }],
        s.store.color,
      )}<div class="kpis" style="margin-top:14px">${tile('Revenue', money(s.revenue), '', s.store.color)}${tile('Conversion', pct(s.visitors ? s.orders / s.visitors : NaN), '', s.store.color)}${tile('Page views', num(s.pageViews), '', s.store.color)}</div></div>`,
    )
    .join('')

  const ordersTable = paid.length
    ? `<table><thead><tr><th>When (Perth)</th><th>Store</th><th>Plan</th><th class="r">Amount</th><th>Status</th></tr></thead><tbody>${paid
        .slice(0, 25)
        .map((p) => `<tr><td>${when(paymentWhen(p))}</td><td>${storeDot(p.store)}</td><td>${esc(p.plan?.title || p.product?.title || '')}</td><td class="r">${money(paymentAmount(p), (p.currency || 'usd').toUpperCase())}</td><td><span class="pill good">${esc(p.status)}</span></td></tr>`)
        .join('')}</tbody></table>`
    : `<div class="empty">No paid orders in this range yet</div>`

  const checkoutTable = checkouts.length
    ? `<table><thead><tr><th>When (Perth)</th><th>Store</th><th>Option</th><th class="r">Value</th></tr></thead><tbody>${checkouts
        .slice(0, 25)
        .map((e) => `<tr><td>${when(e.event_time)}</td><td>${storeDot(e.store)}</td><td>${esc(e.related?.plan?.title || '')}</td><td class="r">${money(e.value || e.related?.plan?.initial_price || 0)}</td></tr>`)
        .join('')}</tbody></table>`
    : `<div class="empty">No checkouts started in this range yet</div>`

  const body = `${brandHeader(true, q)}${kpis}
<div class="grid">
<div class="card c8"><h2>Visitors per day</h2><p class="sub">Unique people on each store, from Whop's traffic tracking</p>${lineChart('v', labels, chartSeries(people))}</div>
<div class="card c4"><h2>Where visitors come from</h2><p class="sub">Referring site, page views</p>${barList(refRows, { max: 6 })}</div>
<div class="card c6"><h2>Paid orders per day</h2><p class="sub">Successful payments</p>${columnChart('o', labels, ordersSeries)}</div>
<div class="card c6"><h2>Revenue per day</h2><p class="sub">USD, paid orders</p>${columnChart('r', labels, revenueSeries, { fmt: money })}</div>
${storeCards}
<div class="card c4"><h2>Countries</h2><p class="sub">Page views</p>${barList(filtHost(countries), { max: 7 })}</div>
<div class="card c4"><h2>Devices</h2><p class="sub">Page views</p>${barList(sumBreakdown(devices), { max: 5 })}</div>
<div class="card c4"><h2>Traffic source</h2><p class="sub">As classified by Whop</p>${barList(sumBreakdown(sources), { max: 5 })}</div>
<div class="card c6"><h2>Recent paid orders</h2><p class="sub">Latest 25 in range</p>${ordersTable}</div>
<div class="card c6"><h2>Recent checkouts started</h2><p class="sub">Shoppers who reached the Whop checkout</p>${checkoutTable}</div>
</div>
<footer>Data from Whop · account ${esc(ACCOUNT_ID)} · times shown in Australia/Perth · refreshed on every load</footer>`
  return page('GrabCo Dashboard', body)
}

const sameDay = (isoStr, t) => isoStr && Math.floor(new Date(isoStr).getTime() / 864e5) === Math.floor(t / 864e5)

// ---- routing --------------------------------------------------------------

export async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const path = url.pathname.replace(/\/+$/, '') || '/'
  const q = { days: url.searchParams.get('days') || '7', store: url.searchParams.get('store') || 'all' }

  if (path === '/favicon.svg')
    return new Response(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#e66767"/><stop offset="1" stop-color="#9085e9"/></linearGradient></defs><rect width="64" height="64" rx="16" fill="url(#g)"/><text x="32" y="43" text-anchor="middle" font-family="Poppins,Arial,sans-serif" font-weight="800" font-size="34" fill="#fff">G</text></svg>`, { headers: { 'content-type': 'image/svg+xml', 'cache-control': 'public, max-age=86400' } })

  if (path === '/setup') {
    // Re-usable until the secrets are stored on Whop (env), even if this
    // isolate still holds them in memory.
    if (env.WHOP_API_KEY && env.DASHBOARD_PASSWORD) return redirect('/')
    if (request.method !== 'POST') return html(setupPage())
    const form = await request.formData()
    const key = String(form.get('key') || '').trim(), password = String(form.get('password') || '')
    if (!key.startsWith('whop_') && key.length < 20) return html(setupPage('That does not look like a Whop API key.'))
    try {
      await account(key)
    } catch (e) {
      return html(setupPage(`Whop rejected that key (${e.status || 'error'}). Check it was created for the GrabCo business with the listed permissions.`))
    }
    let saved = true
    try {
      await saveAppSecrets(key, { WHOP_API_KEY: key, DASHBOARD_PASSWORD: password })
    } catch (e) {
      saved = false
      console.log('secret save failed', e.message)
    }
    setRuntimeSecrets({ WHOP_API_KEY: key, DASHBOARD_PASSWORD: password })
    const t = await token(password)
    return html(
      page('GrabCo Dashboard · Setup', `${brandHeader(false)}<form class="setup"><h2 style="margin:0">Connected</h2><p>The key works${saved ? ' and has been stored as an app secret on Whop.' : ', but it could not be stored as an app secret (the key lacks <code>developer:update_app</code>). It will work until the app next restarts; ask Claude to store it permanently.'}</p><a class="btn" style="display:inline-block;text-decoration:none" href="/">Open dashboard</a></form>`),
      200,
      { 'set-cookie': `gc=${t}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000` },
    )
  }

  if (path === '/login') {
    if (request.method !== 'POST') return html(loginPage())
    const form = await request.formData()
    const pw = String(form.get('password') || '')
    if (!dashboardPassword() || pw !== dashboardPassword()) return html(loginPage('Wrong password.'), 401)
    return new Response(null, { status: 303, headers: { location: '/', 'set-cookie': `gc=${await token(pw)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000` } })
  }
  if (path === '/logout') return new Response(null, { status: 303, headers: { location: '/login', 'set-cookie': 'gc=; Path=/; Max-Age=0' } })

  if (!apiKey() || !dashboardPassword()) return redirect('/setup')
  if (!(await authed(request))) return redirect('/login')
  if (path !== '/') return redirect('/')

  try {
    let out = await dashboard(q)
    if (!env.WHOP_API_KEY)
      out = out.replace('<div class="kpis">', '<div class="note">The API key is only held in memory and will be lost when the app restarts. In Whop, give the key the <code>developer:update_app</code> permission (or create a new key with all six), then paste it again at <a href="/setup">/setup</a> to store it permanently.</div><div class="kpis">')
    return html(out)
  } catch (e) {
    console.log('dashboard error', e.message)
    const msg = e instanceof WhopError ? `Whop returned ${e.status}. ${e.status === 401 || e.status === 403 ? 'The API key may be missing a permission.' : ''}` : e.message
    return html(page('GrabCo Dashboard', `${brandHeader(true, q)}<div class="note">Could not load data: ${esc(msg)}</div>`), 502)
  }
}
