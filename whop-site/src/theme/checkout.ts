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

const CARD = (l, bg, fg) => `<svg viewBox="0 0 38 24" width="36" height="23" aria-label="${l}"><rect x=".5" y=".5" width="37" height="23" rx="3" fill="${bg}" stroke="#000" stroke-opacity=".12"/>${l === 'MC' ? '<circle cx="15" cy="12" r="6.5" fill="#EB001B"/><circle cx="23" cy="12" r="6.5" fill="#F79E1B" fill-opacity=".9"/>' : `<text x="19" y="15.5" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-style="italic" font-size="8" fill="${fg}">${l}</text>`}</svg>`
const ICONS = CARD('VISA', '#1A4CD6', '#fff') + CARD('MC', '#111', '') + CARD('AMEX', '#2E77BC', '#fff') + '<i>+1</i>'
const BAG = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 8h12l1 13H5L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>'
const CHEV = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>'
const SEARCH = '<svg class="ico" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>'
const HELP = '<svg class="ico" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .8-1 1.7"/><circle cx="12" cy="17" r=".6" fill="currentColor"/></svg>'

const CSS = `
*{box-sizing:border-box}html{font-size:16px}
body{margin:0;background:#fff;color:#121212;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
a{color:#1773b0}
.hdr{border-bottom:1px solid #e6e6e6;padding:16px 20px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;max-width:1100px;margin:0 auto}
.hdr .logo{grid-column:2}.hdr img{height:52px;width:auto;display:block}
.hdr .bag{grid-column:3;justify-self:end;color:#1773b0;display:flex}
.wrap{display:grid;grid-template-columns:1fr;max-width:1100px;margin:0 auto}
@media(min-width:960px){.wrap{grid-template-columns:7fr 5fr;min-height:calc(100vh - 86px)}.left{border-right:1px solid #e6e6e6}.right{background:#fafafa}}
.left{padding:22px 20px 48px}.right{padding:24px 20px 32px}
@media(min-width:960px){.left{padding:36px 44px 60px}.right{padding:36px 38px 60px}}
h2{font-weight:700;font-size:1.3rem;margin:0 0 14px;color:#121212}
.sec{margin:0 0 30px}
.note{font-size:.9rem;color:#737373;margin:-6px 0 14px}
.express{display:none}.express.on{display:block}
.exh{text-align:center;color:#737373;font-size:1rem;margin:0 0 14px}
.or{display:flex;align-items:center;gap:14px;margin:18px 0 26px;color:#737373;font-size:.85rem}.or:before,.or:after{content:'';flex:1;height:1px;background:#dedede}
.field{position:relative;margin:0 0 12px}
.field input,.field select{width:100%;min-height:56px;padding:22px 14px 8px;border:1px solid #dedede;border-radius:8px;background:#fff;font:inherit;font-size:17px;color:#121212;outline:none;appearance:none;-webkit-appearance:none}
.field select{padding-right:44px}
.field.sel:after{content:'';position:absolute;right:18px;top:22px;width:9px;height:9px;border-right:1.5px solid #555;border-bottom:1.5px solid #555;transform:rotate(45deg);pointer-events:none}
.field label{position:absolute;left:14px;top:18px;font-size:17px;color:#737373;pointer-events:none;transition:all .12s}
.field input:focus,.field select:focus{border-color:#1773b0;box-shadow:0 0 0 1px #1773b0}
.field input:focus+label,.field input:not(:placeholder-shown)+label,.field select+label{top:8px;font-size:12px}
.field.bad input,.field.bad select{border-color:#d72c0d;box-shadow:0 0 0 1px #d72c0d}
.ferr{display:none;margin:4px 0 0;font-size:.8rem;color:#d72c0d}.field.bad .ferr{display:block}
.sugg{position:absolute;left:0;right:0;top:100%;z-index:5;background:#fff;border:1px solid #dedede;border-radius:8px;box-shadow:0 6px 20px rgba(0,0,0,.12);margin-top:4px;overflow:hidden}
.sugg button{display:block;width:100%;text-align:left;background:none;border:0;border-top:1px solid #f0f0f0;padding:12px 14px;font:inherit;font-size:15px;color:#121212;cursor:pointer}.sugg button:first-child{border-top:0}.sugg button:hover,.sugg button.hi{background:#f0f5fd}
.sugg small{display:block;color:#737373;font-size:12.5px;margin-top:2px}
.field .ico{position:absolute;right:16px;top:17px;color:#555;pointer-events:none}
.field.ico-in input{padding-right:48px}
.row2{display:grid;grid-template-columns:1fr 1fr;gap:10px}.row3{display:grid;grid-template-columns:1fr 1fr;gap:10px}.row3 .field:first-child{grid-column:1/-1}
@media(min-width:600px){.row3{grid-template-columns:1fr 1fr 1fr}.row3 .field:first-child{grid-column:auto}}
.chk{display:flex;align-items:center;gap:12px;font-size:1rem;margin:6px 0 0;cursor:pointer}
.chk input{width:20px;height:20px;margin:0;accent-color:#1773b0;border-radius:4px}
.shipbox{background:#f5f5f5;border-radius:8px;padding:18px 18px;color:#737373;font-size:1rem}
.shipbox .shipopt{display:none;justify-content:space-between;color:#121212}
.shipbox.ready{background:#f0f5fd;border:1px solid #1773b0;color:#121212}.shipbox.ready .shipwait{display:none}.shipbox.ready .shipopt{display:flex}
.pm{border:1px solid #dedede;border-radius:8px;overflow:hidden}
.pmhead{display:flex;align-items:center;gap:12px;padding:16px 18px;background:#f0f5fd;border:1px solid #1773b0;border-radius:8px 8px 0 0;margin:-1px -1px 0}
.pmhead .rad{width:20px;height:20px;border-radius:50%;border:6px solid #1773b0;background:#fff;flex:none}
.pmhead b{font-size:1.05rem;flex:1}
.cards{display:flex;gap:4px;align-items:center}.cards svg{display:block}.cards i{font-style:normal;font-size:.75rem;color:#1773b0;border:1px solid #dedede;border-radius:3px;padding:3px 5px}
.pmbody{background:#f5f5f5;padding:14px 14px 18px}
.paybox{position:relative}
.overlay{display:none;position:absolute;left:0;right:0;bottom:78px;height:150px;z-index:2}
.paybox.ready .overlay{display:block}
.overlay .chk{margin:0 0 20px;font-size:1.05rem}
.totalrow{display:flex;align-items:center;gap:14px;padding:4px 2px}
.totalrow img{width:58px;height:58px;border-radius:8px;object-fit:cover;border:1px solid #e6e6e6}
.totalrow .t b{display:block;font-size:1.25rem}.totalrow .t span{color:#737373;font-size:.95rem}
.totalrow .amt{margin-left:auto;font-size:1.45rem;font-weight:700;display:flex;align-items:center;gap:8px}
.totalrow .cur{font-size:.75rem;font-weight:600;color:#737373;background:#eee;border-radius:12px;padding:3px 8px}
#whop-checkout{min-height:120px}
.loading{font-size:.9rem;color:#737373;padding:14px 0}
.cardnote{display:none;margin:10px 0 0;font-size:.85rem;color:#9a1b1b;background:#fff2f2;border:1px solid #f2c2c2;border-radius:8px;padding:10px 12px}.cardnote.show{display:block}
.legal{font-size:.8rem;color:#737373;margin:16px 0 0;line-height:1.5}
.links{display:flex;flex-wrap:wrap;gap:10px 22px;font-size:1rem;margin:30px 0 0;padding-top:22px;border-top:1px solid #e6e6e6}
.sum{position:sticky;top:20px}
.msum{list-style:none;cursor:pointer;display:flex;justify-content:space-between;align-items:center;font-size:1.2rem;padding:0 0 14px}.msum::-webkit-details-marker{display:none}
.msum .os{color:#1773b0;display:flex;align-items:center;gap:8px}.msum .os svg{transition:transform .2s}.sum[open] .msum .os svg{transform:rotate(180deg)}.msum b{font-weight:700;font-size:1.5rem}
@media(max-width:959px){.wrap{display:flex;flex-direction:column}.right{order:-1;background:#f5f5f5;border-bottom:1px solid #e6e6e6;padding:18px 20px}.sum{position:static}.sum:not([open]) .msum{padding-bottom:0}}
@media(min-width:960px){.msum{pointer-events:none}.msum .os svg{display:none}}
.item{display:grid;grid-template-columns:64px 1fr auto;gap:14px;align-items:center;padding:14px 0 18px;border-bottom:1px solid #dedede;margin-bottom:16px}
.item .img{position:relative;width:64px;height:64px;border:1px solid #dedede;border-radius:8px;background:#fff;overflow:hidden}
.item .img img{width:100%;height:100%;object-fit:cover}
.item .img b{position:absolute;top:-8px;right:-8px;background:#737373;color:#fff;font-size:.72rem;width:22px;height:22px;border-radius:50%;display:grid;place-items:center}
.item .n{font-size:.95rem;line-height:1.3}.item .v{font-size:.8rem;color:#737373;margin-top:2px}
.item .pr{font-size:.95rem;font-weight:500}
.item .was{display:block;color:#9a9a9a;text-decoration:line-through;font-size:.8rem;font-weight:400;text-align:right}
.tot{display:grid;gap:10px;font-size:.95rem}
.tot .r{display:flex;justify-content:space-between}.tot .r span:last-child{font-variant-numeric:tabular-nums}
.tot .muted{color:#737373}.tot .free{font-weight:600}
.tot .big{font-size:1.35rem;font-weight:700;align-items:baseline;margin-top:6px}
.tot .big small{font-size:.75rem;color:#737373;margin-right:8px;font-weight:600}
.err{background:#fff2f2;border:1px solid #f2c2c2;color:#9a1b1b;border-radius:8px;padding:12px 14px;font-size:.88rem;margin:0 0 16px}
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
  const NAMES2 = { city: 'city', state: 'province', postal: 'zip' };
  const fieldHtml = (id, label, extra) => '<div class="field" data-f="' + id + '"><input id="' + id + '" name="' + (NAMES2[id] || id) + '" placeholder=" " ' + (extra || '') + '><label for="' + id + '">' + label + '</label><p class="ferr"></p></div>';
  const STATE_LABEL_AU = 'State/territory';
  function renderCSZ() {
    const r = rec(), cc = sel.value, keep = { city: $('city')?.value || '', state: $('state')?.value || '', postal: $('postal')?.value || '' };
    const parts = [];
    for (const ch of r[1]) {
      if (ch === 'C') parts.push(fieldHtml('city', cc === 'AU' || cc === 'NZ' ? 'Suburb' : 'City', 'autocomplete="shipping address-level2"'));
      if (ch === 'S') {
        const label = cc === 'AU' ? STATE_LABEL_AU : (STATE_LABEL[r[4]] || 'Region');
        if (r[6]) parts.push('<div class="field sel" data-f="state"><select id="state" name="province" autocomplete="shipping address-level1"><option value=""></option>' + r[6].map((k, i) => '<option value="' + k.replace(/"/g, '&quot;') + '">' + String(r[7][i] || k).replace(/</g, '&lt;') + '</option>').join('') + '</select><label for="state">' + label + '</label><p class="ferr"></p></div>');
        else parts.push(fieldHtml('state', label, 'autocomplete="shipping address-level1"'));
      }
      if (ch === 'Z') parts.push(fieldHtml('postal', r[5] === 'zip' ? 'ZIP code' : r[5] === 'pin' ? 'PIN code' : r[5] === 'eircode' ? 'Eircode' : (cc === 'AU' || cc === 'GB' || cc === 'NZ') ? 'Postcode' : 'Postal code', 'autocomplete="shipping postal-code"'));
    }
    const box = $('csz');
    box.innerHTML = parts.join('');
    box.className = 'row3';
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

  // ---- Whop embedded checkout ------------------------------------------------
  // The card box mounts straight away so a shopper can start with their card.
  // Whop only reads prefilled details when its element is created, so once the
  // contact + delivery form is complete the element is recreated with those
  // details (its own email/address rows stay hidden). If the card was already
  // being typed, a note asks for it again.
  const values = () => {
    const cc = sel.value;
    const address = { country: cc, line1: v('line1') };
    if (v('line2')) address.line2 = v('line2');
    if ($('city') && v('city')) address.city = v('city');
    if ($('state') && v('state')) address.state = v('state');
    if ($('postal') && v('postal')) address.postal_code = v('postal');
    const name = (v('first') + ' ' + v('last')).trim();
    return { email: v('email').toLowerCase(), name, phone: v('phone'), address };
  };
  const billSame = () => $('billsame').checked;
  const BILL_H = 150, BILL_GAP = 14;
  let mounted = null, timer = null, cardTouched = false, ready = false;
  const schedule = () => { clearTimeout(timer); timer = setTimeout(mount, 400); };
  $('billsame').addEventListener('change', () => mount());
  window.addEventListener('blur', () => { if (ready && document.activeElement && document.activeElement.closest('#whop-checkout')) cardTouched = true; });
  function mount() {
    const ok = validate(touched);
    $('shipbox').classList.toggle('ready', ok);
    const d = ok ? values() : null;
    const same = billSame();
    const sig = JSON.stringify({ d, same });
    if (mounted && (mounted.sig === sig || (!ok && !mounted.ok && mounted.same === same))) return;
    if (mounted) { try { mounted.el.destroy(); } catch (e) {} try { mounted.co.destroy(); } catch (e) {} mounted = null; }
    const note = $('cardnote');
    note.classList.toggle('show', cardTouched);
    note.textContent = cardTouched ? 'Your details were updated — please enter your card details again.' : '';
    cardTouched = false; ready = false;
    $('paybox').classList.remove('ready');
    const host = $('whop-checkout');
    host.innerHTML = '<div class="loading" id="loading">Loading secure checkout…</div>';
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
          'whop-CheckoutTerms': { display: 'none' },
          'whop-CheckoutExpress': { display: 'none' },
          'whop-CheckoutExpressDivider': { display: 'none' },
          'whop-CheckoutTerms + div': { display: 'none' },
          'whop-CheckoutError': { marginTop: '10px' },
          'whop-PaymentBillingBlock': same ? { display: 'none' } : { marginTop: '12px' },
          'whop-PaymentMethodRow': { display: 'none' },
          'whop-CardLabel': { display: 'none' },
          'whop-Payment': { padding: '0' },
          'whop-PaymentMethods': { border: '0', background: 'transparent', borderRadius: '0' },
          'whop-PaymentMethod': { border: '0', margin: '0' },
          'whop-PaymentMethodDetail': { padding: '0' },
          'whop-PaymentMethodPanel': { background: 'transparent', padding: '0', border: '0' },
          'whop-PaymentDetailRegion': { padding: '0' },
          'whop-CheckoutPayButton': { background: '#1773b0', borderRadius: '8px', fontWeight: '600', fontSize: '17px', minHeight: '56px', marginTop: (BILL_H + BILL_GAP * 2) + 'px' },
          'whop-Label': { fontSize: '15px', fontWeight: '500', color: '#333' },
          'whop-Input': { borderRadius: '8px', minHeight: '54px', background: '#fff' },
        },
      } });
      const meta = d ? { customer_name: d.name, phone: d.phone || '', ship_to: [d.address.line1, d.address.line2, d.address.city, d.address.state, d.address.postal_code, d.address.country].filter(Boolean).join(', ') } : undefined;
      const co = whop.checkout.create({
        plan: PLAN,
        returnUrl: RETURN,
        attribution: { source: 'website' },
        metadata: meta,
        onComplete: (r) => { if (r && r.result === 'payment') location.href = RETURN + '&payment=' + encodeURIComponent(r.paymentId) + '&status=succeeded'; },
      });
      const opts = { onReady: () => { $('loading')?.remove(); $('paybox').classList.add('ready'); setTimeout(() => { ready = true; }, 800); } };
      if (d) {
        const billing = { name: d.name, email: d.email, address: d.address };
        if (d.phone) billing.phone = d.phone;
        opts.buyerEmail = d.email;
        opts.lockBuyerEmail = true;
        opts.defaultValues = { shippingAddress: { name: d.name, ...d.address }, billingDetails: billing, phone: d.phone || undefined };
      }
      const el = co.create('checkout', opts);
      el.mount('#whop-checkout');
      mounted = { sig, el, co, ok, same };
      setTimeout(() => { $('loading')?.remove(); $('paybox').classList.add('ready'); ready = true; }, 8000);
    } catch (e) {
      console.error(e);
      host.innerHTML = '<div class="err">The secure checkout could not load. <a href="' + FALLBACK + '">Continue to checkout here</a>.</div>';
    }
  }

  // ---- address suggestions (filtered to the chosen country) ------------------
  const line1 = $('line1'), sugg = $('sugg');
  let sTimer = null, sSeq = 0, sItems = [], sHi = -1;
  const closeSugg = () => { sugg.hidden = true; sugg.innerHTML = ''; sItems = []; sHi = -1; };
  const pick = (it) => {
    line1.value = it.line1;
    if ($('city') && it.city) $('city').value = it.city;
    if ($('postal') && it.postcode) $('postal').value = it.postcode;
    const st = $('state');
    if (st && it.state) {
      if (st.tagName === 'SELECT') { const r = rec(); const i = (r[7] || []).findIndex((n) => n.toLowerCase() === it.state.toLowerCase()); const j = (r[6] || []).findIndex((k) => k.toLowerCase() === it.state.toLowerCase()); st.value = i >= 0 ? r[6][i] : j >= 0 ? r[6][j] : st.value; }
      else st.value = it.state;
    }
    closeSugg();
    ['line1', 'city', 'state', 'postal'].forEach((id) => touched.add(id));
    validate(touched);
    schedule();
    ($('line2') || line1).focus();
  };
  const render = () => {
    if (!sItems.length) return closeSugg();
    sugg.innerHTML = sItems.map((it, i) => '<button type="button" class="' + (i === sHi ? 'hi' : '') + '" data-i="' + i + '">' + it.line1.replace(/</g, '&lt;') + '<small>' + [it.city, it.state, it.postcode].filter(Boolean).join(', ').replace(/</g, '&lt;') + '</small></button>').join('');
    sugg.hidden = false;
  };
  line1.addEventListener('input', () => {
    clearTimeout(sTimer);
    const q = line1.value.trim();
    if (q.length < 3) return closeSugg();
    sTimer = setTimeout(async () => {
      const seq = ++sSeq;
      try {
        const r = await fetch('/api/address?q=' + encodeURIComponent(q) + '&cc=' + encodeURIComponent(sel.value));
        const items = await r.json();
        if (seq !== sSeq || document.activeElement !== line1) return;
        sItems = Array.isArray(items) ? items : []; sHi = -1; render();
      } catch (e) { closeSugg(); }
    }, 250);
  });
  line1.addEventListener('keydown', (e) => {
    if (sugg.hidden) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); sHi = Math.min(sItems.length - 1, sHi + 1); render(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sHi = Math.max(0, sHi - 1); render(); }
    else if (e.key === 'Enter' && sHi >= 0) { e.preventDefault(); pick(sItems[sHi]); }
    else if (e.key === 'Escape') closeSugg();
  });
  sugg.addEventListener('mousedown', (e) => { const b = e.target.closest('button'); if (b) { e.preventDefault(); pick(sItems[Number(b.dataset.i)]); } });
  line1.addEventListener('blur', () => setTimeout(closeSugg, 150));
  mount();
  // Apple Pay / Google Pay live in their own row above the form, like Shopify's
  // express checkout. The wallet sheet collects the shipping address itself.
  try {
    const ex = window.WhopElements({ appearance: { theme: { appearance: 'light', accentColor: ACCENT, grayColor: 'slate' }, variables: { '--radius': '6px' }, classes: { 'whop-CheckoutExpressDivider': { display: 'none' }, 'whop-CheckoutExpress': { padding: '0' } } } });
    const exco = ex.checkout.create({ plan: PLAN, returnUrl: RETURN, attribution: { source: 'website' }, onComplete: (r) => { if (r && r.result === 'payment') location.href = RETURN + '&payment=' + encodeURIComponent(r.paymentId) + '&status=succeeded'; } });
    exco.create('expressCheckout', { layout: 'horizontal' }).mount('#express');
    new ResizeObserver(() => $('expressbox').classList.toggle('on', $('express').offsetHeight > 30)).observe($('express'));
  } catch (e) { console.error('express', e); }
`

export function checkoutPage({ key, store, product, origin, accent, logo, sale = '50% off', country = '' }) {
  const sel = parseKey(key)
  if (!sel.plan) return null
  const { tier, addons, plan } = sel
  const addonTotal = addons.reduce((s, a) => s + a.price, 0)
  const total = round(tier.price + addonTotal)
  const compare = round(tier.compare + addons.reduce((s, a) => s + a.compare, 0))
  const img = product.featured_image?.src || '/images/placeholder.svg'
  const defaultCountry = countries[String(country || '').toUpperCase()] ? String(country).toUpperCase() : 'US'

  const NAMES = { email: 'email', first: 'first_name', last: 'last_name', line1: 'address1', line2: 'address2', phone: 'phone', city: 'city', state: 'province', postal: 'zip' }
  const field = (id, label, extra = '') => `<div class="field" data-f="${id}"><input id="${id}" name="${NAMES[id] || id}" placeholder=" " ${extra}><label for="${id}">${esc(label)}</label><p class="ferr"></p></div>`

  const body = `<header class="hdr"><a class="logo" href="/"><img src="${esc(logo)}" alt="${esc(store)}"></a><a class="bag" href="/products/${esc(product.handle)}" aria-label="Cart">${BAG}</a></header>
<div class="wrap">
<div class="right"><details class="sum" open><summary class="msum"><span class="os">Order summary ${CHEV}</span><b>${money(total)}</b></summary>
  <div class="item"><div class="img"><img src="${esc(img)}" alt=""><b>${tier.qty}</b></div><div><div class="n">${esc(product.title)}</div><div class="v">${tier.qty > 1 ? `${tier.qty} units · ` : ''}Bubble solution included · ${esc(sale)}</div></div><div class="pr">${money(tier.price)}<span class="was">${money(tier.compare)}</span></div></div>
  <div class="tot">
    <div class="r"><span>Subtotal · ${tier.qty} item${tier.qty > 1 ? 's' : ''}</span><span>${money(tier.price)}</span></div>
    ${addons.map((a) => `<div class="r"><span>${esc(a.title)}</span><span>${money(a.price)}</span></div>`).join('')}
    <div class="r"><span>Shipping</span><span class="free">FREE</span></div>
    <div class="r big"><span>Total</span><span><small>USD</small>${money(total)}</span></div>
    <div class="r muted" style="font-size:.85rem"><span>Including taxes</span><span></span></div>
  </div>
</details></div>
<div class="left">
  <div class="express" id="expressbox"><p class="exh">Express checkout</p><div id="express"></div><div class="or"><span>OR</span></div></div>
  <form id="info" novalidate autocomplete="on">
  <div class="sec"><h2>Contact</h2>${field('email', 'Email', 'type="email" autocomplete="email" inputmode="email"')}<label class="chk"><input type="checkbox" id="news">Email me with news and offers</label></div>
  <div class="sec"><h2>Delivery</h2>
    <div class="field sel" data-f="country"><select id="country" name="country" autocomplete="shipping country"></select><label for="country">Country/Region</label><p class="ferr"></p></div>
    ${field('first', 'First name', 'autocomplete="shipping given-name"')}
    ${field('last', 'Last name', 'autocomplete="shipping family-name"')}
    <div class="field ico-in" data-f="line1"><input id="line1" name="address1" placeholder=" " autocomplete="shipping address-line1" aria-autocomplete="list"><label for="line1">Address</label>${SEARCH}<div class="sugg" id="sugg" hidden></div><p class="ferr"></p></div>
    ${field('line2', 'Apartment, suite, etc. (optional)', 'autocomplete="shipping address-line2"')}
    <div class="row3" id="csz"></div>
    <div class="field ico-in" data-f="phone"><input id="phone" name="phone" placeholder=" " type="tel" autocomplete="shipping tel" inputmode="tel"><label for="phone">Phone (optional)</label>${HELP}<p class="ferr"></p></div>
  </div>
  </form>
  <div class="sec"><h2>Shipping method</h2><div class="shipbox" id="shipbox"><p class="shipwait" style="margin:0">Enter your shipping address to view available shipping methods.</p><div class="shipopt"><span>Free shipping</span><b>FREE</b></div></div></div>
  <div class="sec"><h2>Payment</h2><p class="note">All transactions are secure and encrypted.</p>
    <div class="pm"><div class="pmhead"><span class="rad"></span><b>Credit card</b><span class="cards">${ICONS}</span></div>
      <div class="pmbody"><div class="paybox" id="paybox"><div id="whop-checkout"></div>
        <div class="overlay" id="bill"><label class="chk"><input type="checkbox" id="billsame" checked>Use shipping address as billing address</label>
          <div class="totalrow"><img src="${esc(img)}" alt=""><div class="t"><b>Total</b><span>${tier.qty} item${tier.qty > 1 ? 's' : ''}</span></div><div class="amt"><span class="cur">USD</span>${money(total)}</div></div>
        </div>
      </div></div>
    </div>
    <p class="cardnote" id="cardnote"></p>
    <p class="legal">By paying, you agree to Whop's <a href="https://whop.com/legal/buyer-terms" target="_blank" rel="noopener">Buyer Terms of Service</a> and <a href="https://whop.com/legal/privacy" target="_blank" rel="noopener">Privacy Policy</a>. Payments are processed securely by Whop.</p>
  </div>
  <p class="links"><a href="/pages/refund-policy">Refund policy</a><a href="/pages/shipping">Shipping</a><a href="/pages/contact">Contact</a></p>
</div>
</div>
<script src="https://cdn.whop.com/elements/amber/elements.js" data-whop-elements></script>
<script>window.__countries = ${JSON.stringify(countries)};</script>
<script type="module">
  const PLAN = ${JSON.stringify(plan.id)};
  const RETURN = ${JSON.stringify(origin + CHECKOUT_PATH + '/return?key=' + encodeURIComponent(sel.key))};
  const ACCENT = ${JSON.stringify(accent)};
  const DEFAULT_COUNTRY = ${JSON.stringify(defaultCountry)};
  const FALLBACK = ${JSON.stringify(plan.url)};
  if (matchMedia('(max-width:959px)').matches) document.querySelector('details.sum')?.removeAttribute('open');
  ${FORM_JS}
</script>`
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Checkout – ${esc(store)}</title><meta name="robots" content="noindex"><style>:root{--accent:${esc(accentHex(accent))}}${CSS}</style></head><body>${body}</body></html>`
}

const accentHex = (a) => ({ pink: '#F06A9F', red: '#C8102E', crimson: '#C8102E' })[a] || '#F06A9F'

export function returnPage({ store, logo, status, paymentId, key, accent = 'pink' }) {
  const ok = status === 'succeeded'
  const sel = parseKey(key)
  const body = `<header class="hdr"><a href="/"><img src="${esc(logo)}" alt="${esc(store)}"></a></header>
<div class="wrap" style="grid-template-columns:1fr;max-width:720px"><div class="left" style="border:0;text-align:center;padding-top:60px">
  ${ok
    ? `<h2 style="font-size:1.8rem">Thank you! Your order is confirmed.</h2><p class="note" style="font-size:.95rem">We've emailed your receipt${paymentId ? ` (order ${esc(paymentId)})` : ''}. Your ${esc(store)} order ships in 1–3 business days and you'll get a tracking number the moment it leaves.</p><p><a href="/products/${esc(sel.tier ? '' : '')}" style="display:none"></a><a class="btn" href="/">Back to ${esc(store)}</a></p>`
    : `<h2 style="font-size:1.6rem">Payment not completed</h2><p class="note" style="font-size:.95rem">Your payment ${status === 'failed' ? 'was declined' : 'was cancelled'} and nothing was charged. You can try again with a different payment method.</p><p><a class="btn" href="${CHECKOUT_PATH}?key=${encodeURIComponent(sel.key)}">Return to checkout</a></p>`}
</div></div>`
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${ok ? 'Order confirmed' : 'Payment not completed'} – ${esc(store)}</title><meta name="robots" content="noindex"><style>${CSS}.btn{display:inline-block;margin-top:18px;padding:12px 22px;background:var(--accent);color:#fff;text-decoration:none;border-radius:6px;font-weight:600}:root{--accent:${esc(accentHex(accent))}}</style></head><body>${body}</body></html>`
}
