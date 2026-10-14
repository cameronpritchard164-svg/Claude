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

const CSS = `
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
@media(max-width:959px){.wrap{display:flex;flex-direction:column}.right{order:-1;border-bottom:1px solid #e6e6e6;padding:14px 20px}.sum{position:static}.msum{display:flex}.sum:not([open]) .msum{padding-bottom:0}}
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
.tot{border-top:1px solid #e6e6e6;padding-top:16px;display:grid;gap:10px;font-size:.92rem}
.tot .r{display:flex;justify-content:space-between}.tot .r span:last-child{font-variant-numeric:tabular-nums}
.tot .muted{color:#737373}.tot .free{color:#1a7f37;font-weight:600}
.tot .big{font-family:Georgia,serif;font-size:1.5rem;align-items:baseline;margin-top:4px}
.tot .big small{font-size:.72rem;color:#737373;margin-right:8px;font-family:Poppins,sans-serif}
.save{font-size:.82rem;color:#1a7f37;margin-top:6px;text-align:right}
.trust{display:flex;gap:16px;flex-wrap:wrap;font-size:.78rem;color:#555;margin-top:18px}
.trust span:before{content:"✓ ";color:#1a7f37}
.foot{font-size:.72rem;color:#9a9a9a;margin-top:28px;border-top:1px solid #e6e6e6;padding-top:14px}
.err{background:#fff2f2;border:1px solid #f2c2c2;color:#9a1b1b;border-radius:6px;padding:12px 14px;font-size:.88rem;margin:0 0 16px}
`

export function checkoutPage({ key, store, product, origin, accent, logo, protectionKey = 'protection' }) {
  const sel = parseKey(key)
  if (!sel.plan) return null
  const { tier, addons, plan } = sel
  const unit = tier.price / tier.qty
  const compareUnit = tier.compare / tier.qty
  const addonTotal = addons.reduce((s, a) => s + a.price, 0)
  const total = round(tier.price + addonTotal)
  const compare = round(tier.compare + addons.reduce((s, a) => s + a.compare, 0))
  const protection = bundle.addons.find((a) => a.key === protectionKey)
  const hasProt = addons.some((a) => a.key === protectionKey)
  const otherAddons = bundle.addons.filter((a) => a.key !== protectionKey)
  const img = product.featured_image?.src || '/images/placeholder.svg'
  const keyWith = (toggleKey, on) => {
    const keys = new Set(addons.map((a) => a.key))
    on ? keys.add(toggleKey) : keys.delete(toggleKey)
    return `${tier.qty}:${bundle.addons.filter((a) => keys.has(a.key)).map((a) => a.key).join(',')}`
  }
  const shipping = bundle.shipping || [{ key: 'free', label: 'Free Shipping', eta: 'Delivers in 2–3 weeks', price: 0 }]

  const body = `<header class="hdr"><a href="/"><img src="${esc(logo)}" alt="${esc(store)}"></a></header>
<div class="wrap">
<div class="left">
  <p class="crumbs"><a href="/products/${esc(product.handle)}">Cart</a> › <b>Information</b> › <b>Shipping</b> › <b>Payment</b></p>
  <div class="sec"><h2>Shipping method</h2><div class="ship">${shipping
    .map(
      (s, i) => `<label class="${i === 0 ? 'on' : ''}${s.price == null ? ' off' : ''}"><input type="radio" name="ship" value="${esc(s.key)}" ${i === 0 ? 'checked' : ''} ${s.price == null ? 'disabled' : ''}><span><span class="t">${esc(s.label)}</span><span class="d">${esc(s.eta)}</span></span><span class="p">${s.price ? money(s.price) : 'FREE'}</span></label>`,
    )
    .join('')}</div><p class="note">Tracking number emailed the moment it ships.</p></div>
  <div class="sec"><h2>Contact &amp; payment</h2><p class="note" style="margin:0 0 12px">All transactions are secure and encrypted. Shipping address is collected below.</p><div class="loading" id="loading">Loading secure checkout…</div><div id="whop-checkout"></div></div>
</div>
<div class="right"><details class="sum" open><summary class="msum"><span>Show order summary</span><b>${money(total)}</b></summary>
  <div class="item"><div class="img"><img src="${esc(img)}" alt=""><b>${tier.qty}</b></div><div><div class="n">${esc(product.title)}</div><div class="v">${tier.qty > 1 ? `${tier.qty} costumes · ` : ''}One adult size · Halloween Sale 50% off</div></div><div class="pr">${money(tier.price)}<span class="was">${money(tier.compare)}</span></div></div>
  ${protection ? `<div class="prot"><label class="top"><input type="checkbox" id="prot" ${hasProt ? 'checked' : ''} data-on="${esc(keyWith(protectionKey, true))}" data-off="${esc(keyWith(protectionKey, false))}">Yes, add package protection</label><div class="body"><img src="${esc(protection.image)}" alt=""><div><div class="k">${esc(store)} package protection</div><div class="pp">${money(protection.price)} <span class="was" style="display:inline;color:#9a9a9a;text-decoration:line-through;font-size:.8rem;font-weight:400">${money(protection.compare)}</span></div><div class="pd">Full coverage if your order is lost, stolen or damaged in transit.</div></div></div></div>` : ''}
  ${otherAddons.length ? `<div class="addons">${otherAddons.map((a) => { const on = addons.some((x) => x.key === a.key); return `<label><input type="checkbox" ${on ? 'checked' : ''} data-on="${esc(keyWith(a.key, true))}" data-off="${esc(keyWith(a.key, false))}">${esc(a.title)}<span class="ap">${money(a.price)}</span></label>` }).join('')}</div>` : ''}
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
  const go = (k) => { location.href = '${CHECKOUT_PATH}?key=' + encodeURIComponent(k); };
  if (matchMedia('(max-width:959px)').matches) document.querySelector('details.sum')?.removeAttribute('open');
  document.querySelectorAll('input[type=checkbox][data-on]').forEach((c) => c.addEventListener('change', () => go(c.checked ? c.dataset.on : c.dataset.off)));
  document.querySelectorAll('.ship input').forEach((r) => r.addEventListener('change', () => { document.querySelectorAll('.ship label').forEach((l) => l.classList.toggle('on', l.querySelector('input').checked)); }));
  try {
    const whop = window.WhopElements({ appearance: { theme: { appearance: 'light', accentColor: ${JSON.stringify(accent)} }, variables: { '--radius': '6px' } } });
    const checkout = whop.checkout.create({
      plan: PLAN,
      returnUrl: RETURN,
      attribution: { source: 'website' },
      onComplete: (r) => { if (r && r.result === 'payment') location.href = RETURN + '&payment=' + encodeURIComponent(r.paymentId) + '&status=succeeded'; },
    });
    const el = checkout.create('checkout', { onReady: () => document.getElementById('loading')?.remove() });
    el.mount('#whop-checkout');
    setTimeout(() => document.getElementById('loading')?.remove(), 8000);
  } catch (e) {
    console.error(e);
    document.getElementById('whop-checkout').innerHTML = '<div class="err">The secure checkout could not load. <a href="' + ${JSON.stringify(plan.url)} + '">Continue to checkout here</a>.</div>';
  }
</script>`
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Checkout – ${esc(store)}</title><meta name="robots" content="noindex"><link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap" rel="stylesheet"><style>:root{--accent:${esc(accentHex(accent))}}${CSS}</style></head><body>${body}</body></html>`
}

const accentHex = (a) => ({ pink: '#F06A9F', red: '#C8102E', crimson: '#C8102E' })[a] || '#F06A9F'

export function returnPage({ store, logo, status, paymentId, key }) {
  const ok = status === 'succeeded'
  const sel = parseKey(key)
  const body = `<header class="hdr"><a href="/"><img src="${esc(logo)}" alt="${esc(store)}"></a></header>
<div class="wrap" style="grid-template-columns:1fr;max-width:720px"><div class="left" style="border:0;text-align:center;padding-top:60px">
  ${ok
    ? `<h2 style="font-size:1.8rem">Thank you! Your order is confirmed.</h2><p class="note" style="font-size:.95rem">We've emailed your receipt${paymentId ? ` (order ${esc(paymentId)})` : ''}. Your ${esc(store)} costume ships in 1–3 business days and you'll get a tracking number the moment it leaves.</p><p><a href="/products/${esc(sel.tier ? '' : '')}" style="display:none"></a><a class="btn" href="/">Back to ${esc(store)}</a></p>`
    : `<h2 style="font-size:1.6rem">Payment not completed</h2><p class="note" style="font-size:.95rem">Your payment ${status === 'failed' ? 'was declined' : 'was cancelled'} and nothing was charged. You can try again with a different payment method.</p><p><a class="btn" href="${CHECKOUT_PATH}?key=${encodeURIComponent(sel.key)}">Return to checkout</a></p>`}
</div></div>`
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${ok ? 'Order confirmed' : 'Payment not completed'} – ${esc(store)}</title><meta name="robots" content="noindex"><style>${CSS}.btn{display:inline-block;margin-top:18px;padding:12px 22px;background:var(--accent);color:#fff;text-decoration:none;border-radius:6px;font-weight:600}:root{--accent:#F06A9F}</style></head><body>${body}</body></html>`
}
