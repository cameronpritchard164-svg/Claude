// @ts-nocheck
// Serves the rendered theme pages. Every page is plain HTML from the theme;
// the buy buttons send shoppers to the Whop checkout.
import { createEngine } from './engine'
import { buildStore, loadWhopData, PRODUCT_HANDLE } from './store'
import bundleConfig from './bundle.json'
import bundlePlans from './bundle-plans.json'
import { checkoutPage, returnPage, CHECKOUT_PATH } from './checkout'
import { policyPages } from './policies'
import { env } from 'cloudflare:workers'

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
const POLICY_PAGES = policyPages({ store: 'ClauseGrab', product: 'ClauseGrab inflatable costume', season: 'Christmas' })
const SHOP_PATHS = ['/', '/collections/all', '/collections', '/products', '/shop']

// Contact and newsletter submissions are written to the site's server logs
// (`whop apps logs app_gwec5GNyJmGmsm --query contact_form`).
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
    const html = checkoutPage({ key: url.searchParams.get('key') || '1:', store: 'ClauseGrab', product: store.product, origin: url.origin, accent: 'red', logo: '/images/logo.webp', sale: 'Christmas Sale 50% off', country: request.headers.get('cf-ipcountry') || '' })
    if (!html) return Response.redirect(new URL(CHECKOUT_PATH + '?key=1:', url.origin).toString(), 302)
    return htmlResponse(html)
  }
  if (path === CHECKOUT_PATH + '/return')
    return htmlResponse(returnPage({ store: 'ClauseGrab', accent: 'red', logo: '/images/logo.webp', status: url.searchParams.get('status') || '', paymentId: url.searchParams.get('payment') || '', key: url.searchParams.get('key') || '1:' }))
  // No separate home page: the shop is the product page.
  if (SHOP_PATHS.includes(path)) return Response.redirect(new URL(PRODUCT_PATH, url.origin).toString(), 302)

  const engine = createEngine(store)
  const pages = {
    [PRODUCT_PATH]: ['product', `${store.product.title} – ClauseGrab`],
    [CONTACT_PATH]: ['page.contact', 'Contact – ClauseGrab'],
    '/pages/refund-policy': ['page', 'Refund policy – ClauseGrab'],
    '/pages/shipping': ['page', 'Shipping – ClauseGrab'],
    '/contact': ['page.contact', 'Contact – ClauseGrab'],
  }
  const page = pages[path]
  if (!page) {
    const html = await engine.renderPage('404', { path, page_title: 'Page not found' })
    return htmlResponse(finalize(html, store, 'Page not found – ClauseGrab'), 404)
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
// Rough country bounding boxes (minLon,minLat,maxLon,maxLat) so the geocoder
// only searches the shopper's country, which makes it answer fast.
const BBOX: Record<string, string> = {
  AU: '112.9,-43.8,153.7,-9.1', NZ: '166.4,-47.4,178.6,-34.3', US: '-125.0,24.4,-66.9,49.4', CA: '-141.0,41.7,-52.6,83.1',
  GB: '-8.7,49.8,1.8,60.9', IE: '-10.6,51.4,-5.4,55.4', DE: '5.9,47.3,15.0,55.1', FR: '-5.2,41.3,9.6,51.1', ES: '-9.4,36.0,3.4,43.8',
  IT: '6.6,36.6,18.5,47.1', NL: '3.3,50.7,7.2,53.6', BE: '2.5,49.5,6.4,51.5', SE: '11.0,55.3,24.2,69.1', NO: '4.5,57.9,31.1,71.2',
  DK: '8.0,54.5,12.7,57.8', FI: '20.5,59.7,31.6,70.1', CH: '5.9,45.8,10.5,47.8', AT: '9.5,46.4,17.2,49.0', PT: '-9.5,36.9,-6.2,42.2',
  PL: '14.1,49.0,24.2,55.0', SG: '103.6,1.2,104.1,1.5', JP: '122.9,24.0,146.0,45.6', KR: '124.6,33.1,131.0,38.6', MX: '-118.4,14.5,-86.7,32.7',
  BR: '-74.0,-33.8,-34.7,5.3', AR: '-73.6,-55.1,-53.6,-21.8', ZA: '16.4,-34.9,32.9,-22.1', IN: '68.1,6.7,97.4,35.5', AE: '51.5,22.6,56.4,26.1',
}
async function addressSuggest(url: URL): Promise<Response> {
  const q = (url.searchParams.get('q') || '').trim().slice(0, 120)
  const cc = (url.searchParams.get('cc') || '').toUpperCase().slice(0, 2)
  const json = (body: unknown, age = 86400) => new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json', 'cache-control': `public, max-age=${age}` } })
  if (q.length < 3) return json([])
  const suburbFirst = cc === 'AU' || cc === 'NZ'
  const out: any[] = []
  const seen = new Set<string>()
  const push = (item: any) => { if (item.line1 && !seen.has(item.label)) { seen.add(item.label); out.push(item) } }
  const withTimeout = (ms: number) => { const c = new AbortController(); setTimeout(() => c.abort(), ms); return c.signal }
  try {
    const key = (env as any).ADDRESS_KEY || ''
    if (key) {
      // Geoapify autocomplete: fast, filtered to the country.
      const r = await fetch(`https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(q)}&limit=6&lang=en&type=amenity,street,building${cc ? `&filter=countrycode:${cc.toLowerCase()}` : ''}&format=json&apiKey=${encodeURIComponent(key)}`, { signal: withTimeout(6000) })
      if (r.ok) {
        const data: any = await r.json()
        for (const p of data.results || []) {
          if (!p.street) continue
          const line1 = [p.housenumber, p.street].filter(Boolean).join(' ')
          const city = (suburbFirst ? p.suburb || p.district : '') || p.city || p.town || p.village || p.suburb || p.district || p.county || ''
          push({ line1, city, state: p.state || '', postcode: p.postcode || '', label: [line1, city, p.state, p.postcode].filter(Boolean).join(', ') })
        }
        return json(out)
      }
    }
    // Fallback: Photon (OpenStreetMap). Public instance, can be slow.
    const bbox = BBOX[cc] ? `&bbox=${BBOX[cc]}` : ''
    const r = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=10&lang=en${bbox}`, { headers: { 'user-agent': 'GrabCo checkout (contact@grabco.store)' }, signal: withTimeout(8000) })
    if (!r.ok) return json([], 60)
    const data: any = await r.json()
    for (const f of data.features || []) {
      const p = f.properties || {}
      if (cc && String(p.countrycode || '').toUpperCase() !== cc) continue
      const street = p.street || (p.type === 'street' || p.type === 'house' ? p.name : '')
      if (!street) continue
      const line1 = [p.housenumber, street].filter(Boolean).join(' ')
      const city = (suburbFirst ? p.district || p.locality || p.suburb : '') || p.city || p.town || p.village || p.district || p.county || ''
      push({ line1, city, state: p.state || '', postcode: p.postcode || '', label: [line1, city, p.state, p.postcode].filter(Boolean).join(', ') })
      if (out.length >= 6) break
    }
    return json(out)
  } catch (e) {
    console.error('address suggest failed', e)
    return json(out, 60)
  }
}
