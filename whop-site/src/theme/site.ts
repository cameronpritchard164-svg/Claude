// @ts-nocheck
// Serves the rendered theme pages. Every page is plain HTML from the theme;
// the buy buttons send shoppers to the Whop checkout.
import { createEngine } from './engine'
import { buildStore, loadWhopData, PRODUCT_HANDLE } from './store'

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
          if (form) form.addEventListener('submit', function (e) { e.preventDefault(); window.location.href = CHECKOUT_URL; });
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
    .replace('</body>', checkoutScript(store.checkoutUrl) + '</body>')
}

const htmlResponse = (html, status = 200) =>
  new Response(html, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=60' },
  })

export async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const path = url.pathname.replace(/\/+$/, '') || '/'
  const data = await loadWhopData()
  const store = buildStore(data, url.origin)

  if (path === '/cart' || path === '/checkout') return Response.redirect(store.checkoutUrl, 302)
  if (path === '/collections/all' || path === '/collections' || path === '/products')
    return Response.redirect(new URL(PRODUCT_PATH, url.origin).toString(), 302)

  const engine = createEngine(store)
  const pages = {
    '/': ['index', 'ClauseGrab'],
    [PRODUCT_PATH]: ['product', `${store.product.title} – ClauseGrab`],
  }
  const page = pages[path]
  if (!page) {
    const html = await engine.renderPage('404', { path, page_title: 'Page not found' })
    return htmlResponse(finalize(html, store, 'Page not found – ClauseGrab'), 404)
  }
  const [template, title] = page
  const html = await engine.renderPage(template, {
    path,
    product: template === 'product' ? store.product : null,
    page_title: title,
    page_description: store.product.title,
  })
  return htmlResponse(finalize(html, store, title))
}
