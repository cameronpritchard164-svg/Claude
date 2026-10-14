// @ts-nocheck
// Shopify-style checkout page wrapped around Whop's embedded checkout element.
// The bundle box sends shoppers here with ?key=<qty>:<addons>; the matching
// Whop plan is mounted in the page, so prices, tax and payment methods stay
// exactly what the plans define.
import bundle from './bundle.json'
import plans from './bundle-plans.json'
import countries from './countries.json'

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

.field{position:relative;margin:0 0 12px}
.field input,.field select{width:100%;min-height:52px;padding:20px 12px 6px;border:1px solid #d9d9d9;border-radius:6px;background:#fff;font:inherit;font-size:16px;color:#121212;outline:none;appearance:none;-webkit-appearance:none}
.field select{padding-right:36px}
.field.sel:after{content:'';position:absolute;right:14px;top:22px;width:8px;height:8px;border-right:1.5px solid #555;border-bottom:1.5px solid #555;transform:rotate(45deg);pointer-events:none}
.field label{position:absolute;left:12px;top:16px;font-size:15px;color:#737373;pointer-events:none;transition:all .12s}
.field input:focus,.field select:focus{border-color:#1773b0;box-shadow:0 0 0 1px #1773b0}
.field input:focus+label,.field input:not(:placeholder-shown)+label,.field select+label{top:7px;font-size:11.5px}
.field.bad input,.field.bad select{border-color:#d72c0d;box-shadow:0 0 0 1px #d72c0d}
.ferr{display:none;margin:4px 0 0;font-size:.78rem;color:#d72c0d}.field.bad .ferr{display:block}
.row2{display:grid;grid-template-columns:1fr 1fr;gap:10px}.row3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
@media(max-width:420px){.row3{grid-template-columns:1fr 1fr}.row3 .field:first-child{grid-column:1/-1}}
h2{margin-bottom:14px}
.bill{margin:0 0 16px}.bill label{padding:13px 16px}.bill .t{font-size:.92rem}
.wait{border:1px solid #d9d9d9;border-radius:6px;padding:18px 16px;background:#fafafa}
.wait p{margin:0 0 14px;font-size:.88rem;color:#555}
.wait button{width:100%;min-height:52px;border:0;border-radius:6px;background:#1773b0;color:#fff;font:inherit;font-weight:600;font-size:16px;opacity:.45}
.hide{display:none!important}
`

const FORM_JS = String.raw`
  // ---- Shopify-style contact + delivery form -------------------------------
  const C = window.__countries;
  const $ = (id) => document.getElementById(id);
  const form = $('info');
  let names; try { names = new Intl.DisplayNames(['en'], { type: 'region' }); } catch (e) {}
  const cname = (cc) => { try { return (names && names.of(cc)) || cc; } catch (e) { return cc; } };
  const list = Object.keys(C).map((cc) => [cc, cname(cc)]).sort((a, b) => a[1].localeCompare(b[1]));
  const sel = $('country');
  sel.innerHTML = list.map(([cc, n]) => '<option value="' + cc + '">' + n.replace(/</g, '&lt;') + '</option>').join('');
  sel.value = DEFAULT_COUNTRY;
  const STATE_LABEL = { state: 'State', province: 'Province', county: 'County', area: 'Area', emirate: 'Emirate', island: 'Island', parish: 'Parish', prefecture: 'Prefecture', oblast: 'Oblast', department: 'Department', do_si: 'Province' };
  const rec = () => C[sel.value] || ['', 'A', '', '', '', ''];
  const fieldHtml = (id, label, extra) => '<div class="field" data-f="' + id + '"><input id="' + id + '" placeholder=" " ' + (extra || '') + '><label for="' + id + '">' + label + '</label><p class="ferr"></p></div>';
  function renderCSZ() {
    const r = rec(), cc = sel.value, keep = { city: $('city')?.value || '', state: $('state')?.value || '', postal: $('postal')?.value || '' };
    const parts = [];
    for (const ch of r[1]) {
      if (ch === 'C') parts.push(fieldHtml('city', cc === 'AU' || cc === 'NZ' ? 'Suburb' : 'City', 'autocomplete="shipping address-level2"'));
      if (ch === 'S') {
        const label = STATE_LABEL[r[4]] || 'Region';
        if (r[6]) parts.push('<div class="field sel" data-f="state"><select id="state" autocomplete="shipping address-level1"><option value=""></option>' + r[6].map((k, i) => '<option value="' + k.replace(/"/g, '&quot;') + '">' + String(r[7][i] || k).replace(/</g, '&lt;') + '</option>').join('') + '</select><label for="state">' + label + '</label><p class="ferr"></p></div>');
        else parts.push(fieldHtml('state', label, 'autocomplete="shipping address-level1"'));
      }
      if (ch === 'Z') parts.push(fieldHtml('postal', r[5] === 'zip' ? 'ZIP code' : r[5] === 'pin' ? 'PIN code' : r[5] === 'eircode' ? 'Eircode' : (cc === 'AU' || cc === 'GB' || cc === 'NZ') ? 'Postcode' : 'Postal code', 'autocomplete="shipping postal-code"'));
    }
    const box = $('csz');
    box.innerHTML = parts.join('');
    box.className = 'row' + Math.max(1, parts.length);
    if ($('city')) $('city').value = keep.city;
    if ($('state')) $('state').value = keep.state;
    if ($('postal')) $('postal').value = keep.postal;
  }
  renderCSZ();
  sel.addEventListener('change', () => { renderCSZ(); schedule(); });

  const v = (id) => ($(id)?.value || '').trim();
  const setErr = (id, msg) => { const f = form.querySelector('[data-f="' + id + '"]'); if (!f) return; f.classList.toggle('bad', !!msg); f.querySelector('.ferr').textContent = msg || ''; };
  function validate(show) {
    const r = rec(), req = r[0] || '', errs = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v('email'))) errs.email = 'Enter a valid email';
    if (!v('first')) errs.first = 'Enter a first name';
    if (!v('last')) errs.last = 'Enter a last name';
    if (!v('line1')) errs.line1 = 'Enter an address';
    if ($('city') && req.includes('C') && !v('city')) errs.city = 'Enter a ' + ($('city').labels[0].textContent.toLowerCase());
    if ($('state') && req.includes('S') && !v('state')) errs.state = 'Select a ' + ($('state').labels[0].textContent.toLowerCase());
    if ($('postal')) {
      const pl = $('postal').labels[0].textContent;
      if (req.includes('Z') && !v('postal')) errs.postal = 'Enter a ' + pl;
      else if (v('postal') && r[2]) { try { if (!new RegExp('^(?:' + r[2] + ')$', 'i').test(v('postal'))) errs.postal = 'Enter a valid ' + pl; } catch (e) {} }
    }
    if (v('phone') && v('phone').replace(/[^\d]/g, '').length < 6) errs.phone = 'Enter a valid phone number';
    for (const id of ['email', 'first', 'last', 'line1', 'city', 'state', 'postal', 'phone']) if (show === true || (show && show.has(id))) setErr(id, errs[id]);
    return Object.keys(errs).length === 0;
  }
  const touched = new Set();
  form.addEventListener('focusout', (e) => { if (e.target.id) { touched.add(e.target.id); validate(touched); } });
  form.addEventListener('input', (e) => { if (e.target.id && touched.has(e.target.id)) validate(touched); });
  form.addEventListener('change', () => schedule());
  form.addEventListener('submit', (e) => e.preventDefault());

  // ---- Whop embedded checkout, mounted once the form is complete -------------
  const values = () => {
    const r = rec(), cc = sel.value, up = (x) => x;
    const address = { country: cc, line1: v('line1') };
    if (v('line2')) address.line2 = v('line2');
    if ($('city') && v('city')) address.city = v('city');
    if ($('state') && v('state')) address.state = v('state');
    if ($('postal') && v('postal')) address.postal_code = v('postal');
    const name = (v('first') + ' ' + v('last')).trim();
    return { email: v('email').toLowerCase(), name, phone: v('phone'), address, billSame: form.ownerDocument.querySelector('input[name=bill]:checked').value === 'same' };
  };
  let mounted = null, timer = null;
  const schedule = () => { clearTimeout(timer); timer = setTimeout(mount, 400); };
  document.querySelectorAll('input[name=bill]').forEach((r) => r.addEventListener('change', () => { document.querySelectorAll('#bill label').forEach((l) => l.classList.toggle('on', l.querySelector('input').checked)); schedule(); }));
  function mount() {
    if (!validate(touched)) return;
    const d = values(), sig = JSON.stringify(d);
    if (mounted && mounted.sig === sig) return;
    if (mounted) { try { mounted.el.destroy(); } catch (e) {} try { mounted.co.destroy(); } catch (e) {} mounted = null; }
    const host = $('whop-checkout');
    host.innerHTML = '<div class="loading" id="loading">Loading secure checkout…</div>';
    $('pay-wait').classList.add('hide');
    try {
      const whop = window.WhopElements({ appearance: {
        theme: { appearance: 'light', accentColor: ACCENT, grayColor: 'slate' },
        variables: { '--radius': '6px' },
        classes: {
          'whop-CheckoutSeller': { display: 'none' },
          'whop-CheckoutSummaryHead': { display: 'none' },
          'whop-CheckoutItem': { display: 'none' },
          'whop-CheckoutPrice': { display: 'none' },
          'whop-CheckoutPriceContext': { display: 'none' },
          'whop-CheckoutDetailsToggle': { display: 'none' },
          'whop-CheckoutItemHeadline': { display: 'none' },
          'whop-CheckoutItemDescription': { display: 'none' },
          'whop-CheckoutCompanyPurchase': { display: 'none' },
          'whop-CheckoutCompanyPurchaseCheckbox': { display: 'none' },
          'whop-CheckoutRequirements': { display: 'none' },
          'whop-CheckoutDetails': { display: 'none' },
          'whop-CheckoutCollection': { padding: '0' },
          'whop-PaymentBillingBlock': d.billSame ? { display: 'none' } : { marginTop: '12px' },
          'whop-CheckoutPayButton': { background: '#1773b0', borderRadius: '6px', fontWeight: '600', fontSize: '16px', minHeight: '52px' },
          'whop-Label': { fontSize: '15px', fontWeight: '500', color: '#333' },
          'whop-CardLabel': { fontSize: '15px', fontWeight: '500', color: '#333' },
          'whop-Input': { borderRadius: '6px', minHeight: '48px' },
        },
      } });
      const co = whop.checkout.create({
        plan: PLAN,
        returnUrl: RETURN,
        attribution: { source: 'website' },
        metadata: { customer_name: d.name, phone: d.phone || '', ship_to: [d.address.line1, d.address.line2, d.address.city, d.address.state, d.address.postal_code, d.address.country].filter(Boolean).join(', ') },
        onComplete: (r) => { if (r && r.result === 'payment') location.href = RETURN + '&payment=' + encodeURIComponent(r.paymentId) + '&status=succeeded'; },
      });
      const billing = { name: d.name, email: d.email, address: d.address };
      if (d.phone) billing.phone = d.phone;
      const el = co.create('checkout', {
        buyerEmail: d.email,
        lockBuyerEmail: true,
        defaultValues: { shippingAddress: { name: d.name, ...d.address }, billingDetails: billing, phone: d.phone || undefined },
        onReady: () => $('loading')?.remove(),
      });
      el.mount('#whop-checkout');
      mounted = { sig, el, co };
      setTimeout(() => $('loading')?.remove(), 8000);
    } catch (e) {
      console.error(e);
      host.innerHTML = '<div class="err">The secure checkout could not load. <a href="' + FALLBACK + '">Continue to checkout here</a>.</div>';
    }
  }
  // Browser autofill can complete the whole form without a change event per field.
  setInterval(() => { if (!mounted && validate()) mount(); }, 1500);
`

export function checkoutPage({ key, store, product, origin, accent, logo, sale = '50% off', country = '', protectionKey = 'protection' }) {
  const sel = parseKey(key)
  if (!sel.plan) return null
  const { tier, addons, plan } = sel
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
  const defaultCountry = countries[String(country || '').toUpperCase()] ? String(country).toUpperCase() : 'US'

  const field = (id, label, extra = '') => `<div class="field" data-f="${id}"><input id="${id}" placeholder=" " ${extra}><label for="${id}">${esc(label)}</label><p class="ferr"></p></div>`

  const body = `<header class="hdr"><a href="/"><img src="${esc(logo)}" alt="${esc(store)}"></a></header>
<div class="wrap">
<div class="left">
  <p class="crumbs"><a href="/products/${esc(product.handle)}">Cart</a> › <b>Information</b> › <b>Shipping</b> › <b>Payment</b></p>
  <form id="info" novalidate autocomplete="on">
  <div class="sec"><h2>Contact</h2>${field('email', 'Email', 'type="email" autocomplete="email" inputmode="email"')}</div>
  <div class="sec"><h2>Delivery</h2>
    <div class="field sel" data-f="country"><select id="country" autocomplete="shipping country"></select><label for="country">Country/Region</label><p class="ferr"></p></div>
    <div class="row2">${field('first', 'First name', 'autocomplete="shipping given-name"')}${field('last', 'Last name', 'autocomplete="shipping family-name"')}</div>
    ${field('line1', 'Address', 'autocomplete="shipping address-line1"')}
    ${field('line2', 'Apartment, suite, etc. (optional)', 'autocomplete="shipping address-line2"')}
    <div class="row3" id="csz"></div>
    ${field('phone', 'Phone (optional)', 'type="tel" autocomplete="shipping tel" inputmode="tel"')}
  </div>
  </form>
  <div class="sec"><h2>Payment</h2><p class="note" style="margin:0 0 8px">All transactions are secure and encrypted.</p><div class="accept">${ICONS}</div>
    <div class="ship bill" id="bill"><label class="on"><input type="radio" name="bill" value="same" checked><span><span class="t">Billing address: same as shipping</span><span class="d">Your card is billed to the delivery address above.</span></span></label><label><input type="radio" name="bill" value="diff"><span><span class="t">Use a different billing address</span></span></label></div>
    <div id="pay-wait" class="wait"><p>Enter your contact and delivery details above to continue to payment.</p><button type="button" disabled>Order now</button></div>
    <div id="whop-checkout"></div>
  </div>
  <p class="links"><a href="/pages/refund-policy">Refund policy</a><a href="/pages/shipping">Shipping</a><a href="/pages/contact">Contact</a></p>
</div>
<div class="right"><details class="sum" open><summary class="msum"><span>Order summary</span><b>${money(total)}</b></summary>
  <div class="item"><div class="img"><img src="${esc(img)}" alt=""><b>${tier.qty}</b></div><div><div class="n">${esc(product.title)}</div><div class="v">${tier.qty > 1 ? `${tier.qty} costumes · ` : ''}One adult size · ${esc(sale)}</div></div><div class="pr">${money(tier.price)}<span class="was">${money(tier.compare)}</span></div></div>
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
<script>window.__countries = ${JSON.stringify(countries)};</script>
<script type="module">
  const PLAN = ${JSON.stringify(plan.id)};
  const RETURN = ${JSON.stringify(origin + CHECKOUT_PATH + '/return?key=' + encodeURIComponent(sel.key))};
  const ACCENT = ${JSON.stringify(accent)};
  const DEFAULT_COUNTRY = ${JSON.stringify(defaultCountry)};
  const FALLBACK = ${JSON.stringify(plan.url)};
  const go = (k) => { location.href = '${CHECKOUT_PATH}?key=' + encodeURIComponent(k); };
  if (matchMedia('(max-width:959px)').matches) document.querySelector('details.sum')?.removeAttribute('open');
  document.querySelectorAll('input[type=checkbox][data-on]').forEach((c) => c.addEventListener('change', () => go(c.checked ? c.dataset.on : c.dataset.off)));
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
