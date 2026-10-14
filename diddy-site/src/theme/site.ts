// @ts-nocheck
// Serves the rendered theme pages. Every page is plain HTML from the theme;
// the buy buttons send shoppers to the Whop checkout.
import { createEngine } from './engine'
import { buildStore, loadWhopData, PRODUCT_HANDLE } from './store'
import bundleConfig from './bundle.json'
import bundlePlans from './bundle-plans.json'
import { checkoutPage, returnPage, CHECKOUT_PATH } from './checkout'

const PRODUCT_PATH = `/products/${PRODUCT_HANDLE}`

const HEAD_INJECT = `
<script>
  window.Shopify = { designMode: false, routes: { root: '/' } };
  // Stand-in for Shopify's storefront analytics module the theme scripts expect.
  window.StandardEvents = { createViewEventElement: function (Base) { return class extends (Base || HTMLElement) { connectedCallback() {} disconnectedCallback() {} }; } };
  customElements.define('collection-component', class extends HTMLElement {});
  customElements.define('product-component', class extends HTMLElement {});
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet">`

// Replaces the theme's add-to-cart (product-form.js) with a Whop checkout redirect.
const checkoutScript = (url) => `
<script>
  (function () {
    var CHECKOUT_URL = ${JSON.stringify(url)};
    if (!customElements.get('product-form')) {
      customElements.define('product-form', class extends HTMLElement {
        connectedCallback() {
          var form = this.querySelector('form');
          if (form) form.addEventListener('submit', function (e) {
            e.preventDefault();
            var bundleUrl = window.clausegrabCheckoutUrl && window.clausegrabCheckoutUrl();
            window.location.href = bundleUrl || CHECKOUT_URL;
          });
        }
      });
    }
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href="/cart"], a[href="/checkout"]');
      if (a) { e.preventDefault(); window.location.href = CHECKOUT_URL; }
    });
  })();
</script>`

function finalize(html, store, title) {
  return html
    .replace(/<script type="module">\s*import \* as StandardEvents[\s\S]*?<\/script>/, '')
    .replace(/<link rel="preload" as="font" href="" type="font\/woff2" crossorigin>/g, '')
    .replace(/<script src="\/assets\/product-form\.js" defer="defer"><\/script>/g, '')
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`)
    .replace('<head>', '<head>' + HEAD_INJECT)
    .replace('</body>', checkoutScript(CHECKOUT_PATH + '?key=1:') + '</body>')
}

const htmlResponse = (html, status = 200) =>
  new Response(html, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=60' },
  })

const CONTACT_PATH = '/pages/contact'
const POLICY_PAGES = {
  '/pages/refund-policy': { title: 'Refund policy', handle: 'refund-policy', url: '/pages/refund-policy', content: '<p>Every order is covered by our 30-day money-back guarantee. If you are not happy with your costume, contact us within 30 days of delivery and we will arrange a return for a refund.</p><p>If your costume or fan arrives damaged or develops a fault, send us a photo and we will replace it or refund you, whichever you prefer.</p><p>To start a return or claim, use the <a href="/pages/contact">contact page</a> with your order number.</p>' },
  '/pages/shipping': { title: 'Shipping', handle: 'shipping', url: '/pages/shipping', content: '<p>Shipping is free worldwide. Orders are dispatched in 1 to 3 business days and delivery takes 2 to 3 weeks from dispatch (please allow up to 30 days). A tracking number is emailed the moment your order ships.</p><p>Every costume is checked before it leaves our warehouse. Questions about an order? Use the <a href="/pages/contact">contact page</a>.</p>' },
}
const SHOP_PATHS = ['/', '/collections/all', '/collections', '/products', '/shop']

// Contact and newsletter submissions are written to the site's server logs
// (`whop apps logs app_elbneaoGJF7lAt --query contact_form`).
async function handleForm(request, url) {
  const form = await request.formData()
  const type = String(form.get('form_type') || 'contact')
  const fields = {}
  for (const [k, v] of form.entries()) if (k !== 'form_type' && typeof v === 'string') fields[k.replace(/^contact\[(.*)\]$/, '$1')] = v.slice(0, 5000)
  console.log(JSON.stringify({ event: type === 'customer' ? 'newsletter_signup' : 'contact_form', at: new Date().toISOString(), ...fields }))
  const back = type === 'customer' ? new URL(request.headers.get('referer') || PRODUCT_PATH, url.origin) : new URL(CONTACT_PATH, url.origin)
  back.searchParams.set(type === 'customer' ? 'customer_posted' : 'contact_posted', 'true')
  back.hash = type === 'customer' ? 'newsletter' : 'ContactForm'
  return Response.redirect(back.toString(), 303)
}

export async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const path = url.pathname.replace(/\/+$/, '') || '/'
  if (request.method === 'POST' && path === '/contact') return handleForm(request, url)
  if (path === '/api/address') return addressSuggest(url)

  const data = await loadWhopData()
  const store = buildStore(data, url.origin)
  for (const link of store.linklists['main-menu'].links) link.current = link.url === path

  if (path === '/cart') return Response.redirect(new URL(CHECKOUT_PATH + '?key=1:', url.origin).toString(), 302)
  if (path === CHECKOUT_PATH) {
    const html = checkoutPage({ key: url.searchParams.get('key') || '1:', store: 'DiddyGrab', product: store.product, origin: url.origin, accent: 'pink', logo: '/images/logo.webp', sale: 'Halloween Sale 50% off', country: request.headers.get('cf-ipcountry') || '' })
    if (!html) return Response.redirect(new URL(CHECKOUT_PATH + '?key=1:', url.origin).toString(), 302)
    return htmlResponse(html)
  }
  if (path === CHECKOUT_PATH + '/return')
    return htmlResponse(returnPage({ store: 'DiddyGrab', accent: 'pink', logo: '/images/logo.webp', status: url.searchParams.get('status') || '', paymentId: url.searchParams.get('payment') || '', key: url.searchParams.get('key') || '1:' }))
  // No separate home page: the shop is the product page.
  if (SHOP_PATHS.includes(path)) return Response.redirect(new URL(PRODUCT_PATH, url.origin).toString(), 302)

  const engine = createEngine(store)
  const pages = {
    [PRODUCT_PATH]: ['product', `${store.product.title} – DiddyGrab`],
    [CONTACT_PATH]: ['page.contact', 'Contact – DiddyGrab'],
    '/pages/refund-policy': ['page', 'Refund policy – DiddyGrab'],
    '/pages/shipping': ['page', 'Shipping – DiddyGrab'],
    '/contact': ['page.contact', 'Contact – DiddyGrab'],
  }
  const page = pages[path]
  if (!page) {
    const html = await engine.renderPage('404', { path, page_title: 'Page not found' })
    return htmlResponse(finalize(html, store, 'Page not found – DiddyGrab'), 404)
  }
  const [template, title] = page
  const posted_forms = []
  if (url.searchParams.get('contact_posted')) posted_forms.push('contact')
  if (url.searchParams.get('customer_posted')) posted_forms.push('customer')
  const html = await engine.renderPage(template, {
    path,
    posted_forms,
    product: template === 'product' ? store.product : null,
    page: template === 'page.contact' ? { title: 'Contact', content: '', handle: 'contact', url: CONTACT_PATH } : template === 'page' ? POLICY_PAGES[path] : null,
    bundle: { ...bundleConfig, plans: bundlePlans },
    page_title: title,
    page_description: store.product.title,
  })
  const res = htmlResponse(finalize(html, store, title))
  if (posted_forms.length) res.headers.set('cache-control', 'no-store')
  return res
}

// Address suggestions for the checkout, from the OpenStreetMap-based Photon
// geocoder, limited to the country the shopper picked.
async function addressSuggest(url: URL): Promise<Response> {
  const q = (url.searchParams.get('q') || '').trim().slice(0, 120)
  const cc = (url.searchParams.get('cc') || '').toUpperCase().slice(0, 2)
  const json = (body: unknown, age = 86400) => new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json', 'cache-control': `public, max-age=${age}` } })
  if (q.length < 3) return json([])
  try {
    const r = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=12&lang=en`, { headers: { 'user-agent': 'GrabCo checkout (contact@grabco.store)' } })
    if (!r.ok) return json([], 60)
    const data: any = await r.json()
    const out: any[] = []
    const seen = new Set<string>()
    for (const f of data.features || []) {
      const p = f.properties || {}
      if (cc && String(p.countrycode || '').toUpperCase() !== cc) continue
      if (!p.street && !p.name) continue
      const street = p.street || (p.type === 'street' || p.type === 'house' ? p.name : '')
      if (!street) continue
      const line1 = [p.housenumber, street].filter(Boolean).join(' ')
      const suburbFirst = cc === 'AU' || cc === 'NZ'
      const city = (suburbFirst ? p.district || p.locality || p.suburb : '') || p.city || p.town || p.village || p.district || p.county || ''
      const item = { line1, city, state: p.state || '', postcode: p.postcode || '', label: [line1, city, p.state, p.postcode].filter(Boolean).join(', ') }
      if (seen.has(item.label)) continue
      seen.add(item.label)
      out.push(item)
      if (out.length >= 6) break
    }
    return json(out)
  } catch (e) {
    console.error('address suggest failed', e)
    return json([], 60)
  }
}
