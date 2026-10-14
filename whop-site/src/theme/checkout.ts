// @ts-nocheck
// Shopify-style checkout page wrapped around Whop's embedded checkout element.
// The bundle box sends shoppers here with ?key=<qty>:<addons>; the matching
// Whop plan is mounted in the page, so prices, tax and payment methods stay
// exactly what the plans define.
import bundle from './bundle.json'
import plans from './bundle-plans.json'

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const money = (n) => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const round = (n) => Math.round(n * 100) / 100

export const CHECKOUT_PATH = '/checkout'

// Parses "2:guarantee,protection" into the tier and add-ons it names.
export function parseKey(key) {
  const [q, a] = String(key || '1:').split(':')
  const qty = Math.max(1, Math.min(4, Number(q) || 1))
  const tier = bundle.tiers.find((t) => t.qty === qty) || bundle.tiers[0]
  const wanted = (a || '').split(',').filter(Boolean)
  const addons = bundle.addons.filter((x) => wanted.includes(x.key))
  const k = `${tier.qty}:${addons.map((x) => x.key).join(',')}`
  return { tier, addons, key: k, plan: plans[k] }
}

const ICONS = ['VISA|#1A1F71|#fff','mastercard|#fff|#EB001B','AMEX|#2E77BC|#fff','Pay|#000|#fff','G Pay|#fff|#3C4043'].map((x) => { const [l, bg, fg] = x.split('|'); return `<svg viewBox="0 0 38 24" width="38" height="24" aria-label="${l}"><rect x=".5" y=".5" width="37" height="23" rx="3" fill="${bg}" stroke="#000" stroke-opacity=".12"/><text x="19" y="15.5" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="${l.length > 5 ? 6.5 : 8}" fill="${fg}">${l === 'Pay' ? ' Pay' : l}</text></svg>` }).join('')

const CSS = `
.accept{display:flex;gap:6px;margin:0 0 14px}.accept svg{display:block}
.links{display:flex;gap:18px;font-size:.8rem;margin:26px 0 0;padding-top:18px;border-top:1px solid #e6e6e6}.links a{color:#1773b0}

*{box-sizing:border-box}html{font-size:16px}
body{margin:0;background:#fff;color:#121212;font-family:Poppins,-apple-system,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased}
a{color:inherit}
.hdr{border-bottom:1px solid #e6e6e6;padding:14px 20px;display:flex;justify-content:center}
.hdr img{height:48px;width:auto}
.wrap{display:grid;grid-template-columns:1fr;max-width:1100px;margin:0 auto}
@media(min-width:960px){.wrap{grid-template-columns:7fr 5fr;min-height:calc(100vh - 77px)}.left{border-right:1px solid #e6e6e6}.right{background:#fafafa}}
.left{padding:28px 24px 48px}.right{padding:28px 24px 48px}
@media(min-width:960px){.left{padding:36px 44px 60px}.right{padding:36px 38px 60px}}
.crumbs{font-size:.78rem;color:#737373;margin:0 0 22px}.crumbs b{color:#121212;font-weight:500}
h2{font-family:Georgia,"Times New Roman",serif;font-weight:700;font-size:1.25rem;letter-spacing:.02em;margin:0 0 12px}
.sec{margin:0 0 28px}
.ship{border:1px solid #d9d9d9;border-radius:6px;overflow:hidden}
.ship label{display:grid;grid-template-columns:auto 1fr auto;gap:14px;align-items:center;padding:16px 18px;cursor:pointer;border-top:1px solid #e6e6e6}
.ship label:first-child{border-top:0}
.ship label.on{background:#fbf0f4;box-shadow:inset 0 0 0 1px var(--accent)}
.ship input{width:18px;height:18px;accent-color:var(--accent);margin:0}
.ship .t{display:block;font-size:.95rem}.ship .d{display:block;font-size:.82rem;color:#737373;margin-top:2px}
.ship .p{font-weight:600;font-size:.95rem}
.ship label.off{opacity:.45;cursor:not-allowed}
.note{font-size:.82rem;color:#737373;margin:8px 0 0}
#whop-checkout{min-height:420px}
.loading{font-size:.85rem;color:#737373;padding:18px 0}
.sum{position:sticky;top:20px}.msum{display:none;list-style:none;cursor:pointer;justify-content:space-between;align-items:center;font-size:.92rem;padding:4px 0 14px}.msum::-webkit-details-marker{display:none}.msum span:after{content:' ▾';color:#737373}
@media(max-width:959px){.wrap{display:flex;flex-direction:column}.right{order:-1;border-bottom:1px solid #e6e6e6;padding:14px 20px}.sum{position:static}.msum{display:flex;pointer-events:none}.msum span:after{content:''}}
.item{display:grid;grid-template-columns:72px 1fr auto;gap:14px;align-items:center;padding:0 0 18px;border-bottom:1px solid #e6e6e6;margin-bottom:18px}
.item .img{position:relative;width:72px;height:72px;border:1px solid #e6e6e6;border-radius:8px;background:#fff;overflow:hidden}
.item .img img{width:100%;height:100%;object-fit:contain}
.item .img b{position:absolute;top:-8px;right:-8px;background:#121212;color:#fff;font-size:.72rem;width:22px;height:22px;border-radius:50%;display:grid;place-items:center}
.item .n{font-size:.92rem;line-height:1.3}.item .v{font-size:.8rem;color:#737373;margin-top:2px}
.item .pr{font-size:.92rem;font-weight:500}
.item .was{display:block;color:#9a9a9a;text-decoration:line-through;font-size:.8rem;font-weight:400;text-align:right}
.prot{border:1px solid #d9d9d9;border-radius:6px;padding:14px 16px;margin:0 0 18px;background:#fff}
.prot label.top{display:flex;align-items:center;gap:12px;background:#f2f2f2;padding:12px 14px;border-radius:4px;cursor:pointer;font-size:.95rem}
.prot input{width:18px;height:18px;accent-color:var(--accent);margin:0}
.prot .body{display:grid;grid-template-columns:56px 1fr;gap:14px;align-items:center;padding:14px 4px 2px}
.prot .body img{width:56px;height:56px;object-fit:contain}
.prot .k{font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;color:#555}
.prot .pp{font-size:1.05rem;font-weight:600;margin:2px 0}.prot .pd{font-size:.82rem;color:#555}
.addons{margin:0 0 18px;display:grid;gap:8px}
.addons label{display:flex;align-items:center;gap:10px;font-size:.88rem;cursor:pointer}
.addons input{width:16px;height:16px;accent-color:var(--accent);margin:0}
.addons .ap{margin-left:auto;font-weight:500}
.tot{padding-top:4px;display:grid;gap:10px;font-size:.92rem}
.tot .r{display:flex;justify-content:space-between}.tot .r span:last-child{font-variant-numeric:tabular-nums}
.tot .muted{color:#737373}.tot .free{color:#1a7f37;font-weight:600}
.tot .big{font-family:Georgia,serif;font-size:1.5rem;align-items:baseline;margin-top:4px}
.tot .big small{font-size:.72rem;color:#737373;margin-right:8px;font-family:Poppins,sans-serif}
.save{font-size:.82rem;color:#1a7f37;margin-top:6px;text-align:right}
.trust{display:flex;gap:16px;flex-wrap:wrap;font-size:.78rem;color:#555;margin-top:18px}
.trust span:before{content:"✓ ";color:#1a7f37}
.foot{font-size:.72rem;color:#9a9a9a;margin-top:28px;border-top:1px solid #e6e6e6;padding-top:14px}
.err{background:#fff2f2;border:1px solid #f2c2c2;color:#9a1b1b;border-radius:6px;padding:12px 14px;font-size:.88rem;margin:0 0 16px}

.express{display:none}.express.on{display:block}.express h2{text-align:center;font-family:Poppins,sans-serif;font-weight:400;font-size:.95rem;color:#555;margin-bottom:12px}
.or{display:flex;align-items:center;gap:12px;margin:18px 0 4px;color:#737373;font-size:.78rem}.or:before,.or:after{content:'';flex:1;height:1px;background:#e6e6e6}
.legal{font-size:.74rem;color:#737373;text-align:center;margin:14px 0 0;line-height:1.5}.legal a{color:#737373}
.hide{display:none!important}
`

const FORM_JS = String.raw`
  const appearance = (extra) => ({ appearance: {
    theme: { appearance: 'light', accentColor: ACCENT, grayColor: 'slate' },
    variables: { '--radius': '6px' },
    classes: Object.assign({
      'whop-CheckoutSeller': { display: 'none' },
      'whop-CheckoutDetails': { display: 'none' },
      'whop-CheckoutCollection': { padding: '0' },
      'whop-CheckoutCompanyPurchase': { display: 'none' },
      'whop-CheckoutCompanyPurchaseCheckbox': { display: 'none' },
      'whop-CheckoutExpressDivider': { display: 'none' },
      'whop-CheckoutTerms': { display: 'none' },
      'whop-CheckoutTerms + div': { display: 'none' },
      'whop-CheckoutPayButton': { background: '#1773b0', borderRadius: '6px', fontWeight: '600', fontSize: '16px', minHeight: '52px' },
      'whop-Label': { fontSize: '19px', fontWeight: '600', color: '#111', marginTop: '6px' },
      'whop-EmailLabel': { fontSize: '19px', fontWeight: '600', color: '#111' },
      'whop-CheckoutRequirementLabel': { fontSize: '19px', fontWeight: '600', color: '#111', marginTop: '6px' },
      'whop-CardLabel': { fontSize: '15px', fontWeight: '500', color: '#333' },
      'whop-Input': { borderRadius: '6px', minHeight: '48px' },
    }, extra || {}),
  } });
  const onComplete = (r) => { if (r && r.result === 'payment') location.href = RETURN + '&payment=' + encodeURIComponent(r.paymentId) + '&status=succeeded'; };
  try {
    // Main checkout: Whop's own email + shipping address (with address
    // suggestions) + card + Order now. Wallet buttons are hidden here and shown
    // in the express row above instead.
    const whop = window.WhopElements(appearance({ 'whop-CheckoutExpress': { display: 'none' } }));
    const co = whop.checkout.create({ plan: PLAN, returnUrl: RETURN, attribution: { source: 'website' }, onComplete });
    co.create('checkout', { onReady: () => document.getElementById('loading')?.remove() }).mount('#whop-checkout');
    setTimeout(() => document.getElementById('loading')?.remove(), 8000);
  } catch (e) {
    console.error(e);
    document.getElementById('whop-checkout').innerHTML = '<div class="err">The secure checkout could not load. <a href="' + FALLBACK + '">Continue to checkout here</a>.</div>';
  }
  try {
    const ex = window.WhopElements(appearance({ 'whop-CheckoutExpress': { padding: '0' } }));
    const exco = ex.checkout.create({ plan: PLAN, returnUrl: RETURN, attribution: { source: 'website' }, onComplete });
    exco.create('expressCheckout', { layout: 'auto' }).mount('#express');
    const box = document.getElementById('expressbox'), el = document.getElementById('express');
    new ResizeObserver(() => box.classList.toggle('on', el.offsetHeight > 30)).observe(el);
  } catch (e) { console.error('express', e); }
`

export function checkoutPage({ key, store, product, origin, accent, logo, sale = '50% off' }) {
  const sel = parseKey(key)
  if (!sel.plan) return null
  const { tier, addons, plan } = sel
  const addonTotal = addons.reduce((s, a) => s + a.price, 0)
  const total = round(tier.price + addonTotal)
  const compare = round(tier.compare + addons.reduce((s, a) => s + a.compare, 0))
  const img = product.featured_image?.src || '/images/placeholder.svg'

  const body = `<header class="hdr"><a href="/"><img src="${esc(logo)}" alt="${esc(store)}"></a></header>
<div class="wrap">
<div class="left">
  <p class="crumbs"><a href="/products/${esc(product.handle)}">Cart</a> › <b>Information</b> › <b>Shipping</b> › <b>Payment</b></p>
  <div class="sec express" id="expressbox"><h2>Express checkout</h2><div id="express"></div><div class="or"><span>OR</span></div></div>
  <div class="sec"><p class="note" style="margin:0 0 8px">All transactions are secure and encrypted.</p><div class="accept">${ICONS}</div>
    <div class="loading" id="loading">Loading secure checkout…</div><div id="whop-checkout"></div>
    <p class="legal">By continuing, you agree to Whop's <a href="https://whop.com/legal/buyer-terms" target="_blank" rel="noopener">Buyer Terms of Service</a> and <a href="https://whop.com/legal/privacy" target="_blank" rel="noopener">Privacy Policy</a>. Payments are processed securely by Whop.</p>
  </div>
  <p class="links"><a href="/pages/refund-policy">Refund policy</a><a href="/pages/shipping">Shipping</a><a href="/pages/contact">Contact</a></p>
</div>
<div class="right"><details class="sum" open><summary class="msum"><span>Order summary</span><b>${money(total)}</b></summary>
  <div class="item"><div class="img"><img src="${esc(img)}" alt=""><b>${tier.qty}</b></div><div><div class="n">${esc(product.title)}</div><div class="v">${tier.qty > 1 ? `${tier.qty} costumes · ` : ''}One adult size · ${esc(sale)}</div></div><div class="pr">${money(tier.price)}<span class="was">${money(tier.compare)}</span></div></div>
  <div class="tot">
    <div class="r"><span>Subtotal</span><span>${money(tier.price)}</span></div>
    ${addons.map((a) => `<div class="r"><span>${esc(a.title)}</span><span>${money(a.price)}</span></div>`).join('')}
    <div class="r"><span>Shipping</span><span class="free" id="shipline">FREE</span></div>
    <div class="r muted"><span>Taxes</span><span>Included</span></div>
    <div class="r big"><span>Total</span><span><small>USD</small>${money(total)}</span></div>
    <div class="save">You save ${money(compare - total)} (${Math.round(((compare - total) / compare) * 100)}% off)</div>
  </div>
  <div class="trust"><span>30-day money-back guarantee</span><span>Secure checkout by Whop</span><span>Ships in 1–3 business days</span></div>
  <p class="foot">Prices in USD. Questions? <a href="/pages/contact">Contact us</a>.</p>
</details></div>
</div>
<script src="https://cdn.whop.com/elements/amber/elements.js" data-whop-elements></script>
<script type="module">
  const PLAN = ${JSON.stringify(plan.id)};
  const RETURN = ${JSON.stringify(origin + CHECKOUT_PATH + '/return?key=' + encodeURIComponent(sel.key))};
  const ACCENT = ${JSON.stringify(accent)};
  const FALLBACK = ${JSON.stringify(plan.url)};
  ${FORM_JS}
</script>`
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Checkout – ${esc(store)}</title><meta name="robots" content="noindex"><link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap" rel="stylesheet"><style>:root{--accent:${esc(accentHex(accent))}}${CSS}</style></head><body>${body}</body></html>`
}

const accentHex = (a) => ({ pink: '#F06A9F', red: '#C8102E', crimson: '#C8102E' })[a] || '#F06A9F'

export function returnPage({ store, logo, status, paymentId, key, accent = 'pink' }) {
  const ok = status === 'succeeded'
  const sel = parseKey(key)
  const body = `<header class="hdr"><a href="/"><img src="${esc(logo)}" alt="${esc(store)}"></a></header>
<div class="wrap" style="grid-template-columns:1fr;max-width:720px"><div class="left" style="border:0;text-align:center;padding-top:60px">
  ${ok
    ? `<h2 style="font-size:1.8rem">Thank you! Your order is confirmed.</h2><p class="note" style="font-size:.95rem">We've emailed your receipt${paymentId ? ` (order ${esc(paymentId)})` : ''}. Your ${esc(store)} costume ships in 1–3 business days and you'll get a tracking number the moment it leaves.</p><p><a href="/products/${esc(sel.tier ? '' : '')}" style="display:none"></a><a class="btn" href="/">Back to ${esc(store)}</a></p>`
    : `<h2 style="font-size:1.6rem">Payment not completed</h2><p class="note" style="font-size:.95rem">Your payment ${status === 'failed' ? 'was declined' : 'was cancelled'} and nothing was charged. You can try again with a different payment method.</p><p><a class="btn" href="${CHECKOUT_PATH}?key=${encodeURIComponent(sel.key)}">Return to checkout</a></p>`}
</div></div>`
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${ok ? 'Order confirmed' : 'Payment not completed'} – ${esc(store)}</title><meta name="robots" content="noindex"><style>${CSS}.btn{display:inline-block;margin-top:18px;padding:12px 22px;background:var(--accent);color:#fff;text-decoration:none;border-radius:6px;font-weight:600}:root{--accent:${esc(accentHex(accent))}}</style></head><body>${body}</body></html>`
}
