// @ts-nocheck
// BratzSnug product page (the shop's only page), laid out like the reference
// store: gallery, price, benefit bullets, Buy 1/2/3 selector, trust icons,
// review ticker, FAQ, marquee, two feature sections and testimonials.
import { CHECKOUT_PATH } from './checkout'

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const money = (n) => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const STARS = '<span class="stars" aria-label="5 stars">★★★★★</span>'
const ICON = {
  heart: '<svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z"/></svg>',
  returns: '<svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/></svg>',
  truck: '<svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/></svg>',
  cart: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 8h12l1 13H5L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
  check: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="m7 12 3 3 7-7"/></svg>',
}
const PAY = ['VISA|#1A4CD6|#fff', 'MC|#111|#fff', 'AMEX|#2E77BC|#fff', 'Pay|#000|#fff', 'G Pay|#fff|#3c4043', 'DISCOVER|#fff|#f68121'].map((x) => { const [l, bg, fg] = x.split('|'); return `<svg viewBox="0 0 38 24" width="38" height="24" aria-label="${l}"><rect x=".5" y=".5" width="37" height="23" rx="3" fill="${bg}" stroke="#000" stroke-opacity=".12"/>${l === 'MC' ? '<circle cx="15" cy="12" r="6.5" fill="#EB001B"/><circle cx="23" cy="12" r="6.5" fill="#F79E1B" fill-opacity=".9"/>' : `<text x="19" y="15.5" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="${l.length > 5 ? 6 : 8}" fill="${fg}">${l === 'Pay' ? ' Pay' : l}</text>`}</svg>` }).join('')

const CSS = `
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;font-family:Poppins,-apple-system,"Segoe UI",Roboto,sans-serif;color:#121212;background:#fff;-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:none}img{max-width:100%;display:block}
.hdr{display:flex;justify-content:space-between;align-items:center;padding:10px 24px;background:#fff;border-bottom:1px solid #eee}
.hdr nav{display:flex;gap:18px;font-size:.9rem;font-weight:600}
.hdr .logo img{height:58px;width:auto}@media(max-width:600px){.hdr .logo img{height:44px}}
.hdr .cart{display:grid;place-items:center;width:44px;height:44px;border-radius:10px;background:#121212;color:#fff}
.marq{background:#111111;color:#FF1C8D;font-weight:700;font-size:.95rem;letter-spacing:.04em;overflow:hidden;white-space:nowrap;padding:14px 0}
.marq div{display:inline-block;animation:marq 28s linear infinite}.marq span{margin:0 56px}
@keyframes marq{from{transform:translateX(0)}to{transform:translateX(-50%)}}
.wrap{max-width:1300px;margin:0 auto;padding:0 20px}
.prod{display:grid;grid-template-columns:1fr;gap:28px;padding:28px 0 20px}
@media(min-width:900px){.prod{grid-template-columns:1.25fr 1fr;gap:48px;padding:44px 0 30px}}
.prod>*{min-width:0}.gal .main{border-radius:12px;overflow:hidden;background:#f5f5f5}.gal .main img{width:100%;aspect-ratio:1/1;object-fit:cover}
.thumbs{display:flex;gap:10px;margin-top:12px;overflow-x:auto}.thumbs button{flex:none;width:92px;height:92px;padding:0;border:2px solid #e5e5e5;border-radius:8px;overflow:hidden;background:#fff;cursor:pointer}.thumbs button.on{border-color:#121212}.thumbs img{width:100%;height:100%;object-fit:cover}
h1{font-size:2.4rem;line-height:1.1;margin:0 0 8px;font-weight:700}
.rating{display:flex;align-items:center;gap:8px;font-size:.95rem;margin:0 0 10px}.stars{color:#ffc107;letter-spacing:1px;font-size:1.05rem}
.price{display:flex;align-items:center;gap:10px;margin:0 0 16px}.price .now{color:var(--red);font-weight:700;font-size:1.5rem}.price .was{color:#737373;text-decoration:line-through;font-size:1.1rem}
.badge{background:#FF6FB5;color:#111;font-size:.72rem;font-weight:700;letter-spacing:.06em;padding:5px 10px;border-radius:5px}
.bul{list-style:none;padding:0;margin:0 0 16px;display:grid;gap:10px;font-size:1rem}.bul li{display:flex;gap:10px;align-items:baseline}.bul li span{color:#555}.bul li b{color:#121212}
.pill{display:inline-block;background:#ffe6f1;border:1px solid #ffb3d4;color:#111111;font-weight:600;font-size:.9rem;border-radius:999px;padding:7px 14px;margin:0 0 16px}
.low{display:flex;align-items:center;gap:12px;font-weight:700;font-size:.9rem;margin:6px 0 14px}.low:before,.low:after{content:'';flex:1;height:1px;background:#ffb3d4}
.tiers{display:grid;gap:12px}
.tier{position:relative;display:grid;grid-template-columns:auto 1fr auto;gap:14px;align-items:center;padding:16px 18px;border:2px solid #ffb3d4;background:#fff5fa;border-radius:8px;cursor:pointer}
.tier.on{border-color:#FF1C8D;background:#ffe6f1}
.tier .rad{width:22px;height:22px;border-radius:50%;border:2px solid #d9d9d9;background:#fff;display:grid;place-items:center}.tier.on .rad{border-color:var(--red)}.tier.on .rad:after{content:'';width:12px;height:12px;border-radius:50%;background:var(--red)}
.tier .t{font-weight:700;font-size:1.15rem}.tier .fs{display:inline-block;margin-left:8px;vertical-align:2px;border:1.5px solid var(--red);color:var(--red);border-radius:6px;font-size:.72rem;font-weight:700;padding:2px 7px}.tier .s{font-size:.85rem;color:#444}
.tier .p{text-align:right}.tier .p b{font-size:1.25rem}.tier .p span{display:block;color:#737373;text-decoration:line-through;font-size:.85rem}
.tier .tag{position:absolute;right:-6px;top:-14px;font-size:.8rem !important;padding:5px 14px !important;transform:rotate(2deg);background:#FF6FB5;color:#111;font-size:.7rem;font-weight:700;letter-spacing:.05em;padding:4px 10px;border-radius:4px}
.saving{margin:14px 0 12px;border:1px solid #ffb3d4;background:#fff5fa;border-radius:6px;padding:12px 16px;font-size:.92rem;color:#111111}
.ups{margin:4px 0 16px}.up{display:flex;align-items:center;gap:12px;padding:10px 0;cursor:pointer}.up img{width:60px;height:60px;border-radius:10px;flex:none;object-fit:contain;background:#fff}.up .ut{flex:1;font-weight:700;font-size:.98rem}.up-p{text-align:right;font-size:.95rem}.up-p s{display:block;color:#737373;font-size:.82rem}.up input{display:none}.sw{flex:none;width:48px;height:28px;border-radius:14px;background:#d9d9d9;position:relative;transition:.2s}.sw:after{content:'';position:absolute;left:3px;top:3px;width:22px;height:22px;border-radius:50%;background:#fff;transition:.2s;box-shadow:0 1px 3px #0003}.up input:checked+.sw{background:var(--red)}.up input:checked+.sw:after{left:23px}.atc{display:block;width:100%;border:0;background:#FF1C8D;color:#fff;font:inherit;font-weight:700;font-size:1.15rem;letter-spacing:.06em;padding:17px;border-radius:6px;cursor:pointer}
.pay{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:14px 0 24px}
.trust{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;text-align:center;color:var(--red);margin:0 0 20px}.trust b{display:block;color:#121212;font-size:1rem;margin-top:6px}
.tick{display:flex;gap:14px;align-items:center;border-bottom:1px solid #eee;padding:8px 0 10px}.tick img{width:50px;height:50px;border-radius:50%;object-fit:cover}.tick p{margin:0;font-size:.95rem}.tick small{display:block;color:#737373;font-style:italic;margin-top:2px}
.dots{display:flex;gap:8px;justify-content:center;margin:10px 0}.dots i{width:8px;height:8px;border-radius:50%;background:#ccc}.dots i.on{background:#121212}
.faq{max-width:720px;margin:20px auto 50px}
.faq details{border-bottom:1px solid #e6e6e6;padding:14px 0}.faq summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:12px;font-weight:700;font-size:1.05rem}.faq summary::-webkit-details-marker{display:none}.faq summary:after{content:'⌃';margin-left:auto;transform:rotate(180deg);color:#555}.faq details[open] summary:after{transform:none}
.faq p{margin:12px 0 0;line-height:1.7;color:#333}
.feat{display:grid;grid-template-columns:1fr;gap:28px;align-items:center;padding:30px 0}
@media(min-width:900px){.feat{grid-template-columns:1fr 1fr;gap:60px;padding:46px 0}}
.feat img{border-radius:14px;width:100%;aspect-ratio:1/1;object-fit:cover}.feat h2{font-size:2.3rem;margin:0 0 14px;line-height:1.15}.feat p{color:#333;line-height:1.7;margin:0;font-size:1.05rem}
.testi h2{text-align:center;font-size:2.4rem;margin:30px 0 30px}
.cards{display:grid;grid-template-columns:1fr;gap:28px;align-items:start;padding-bottom:60px}
@media(min-width:900px){.cards{grid-template-columns:repeat(3,1fr)}}
@media(max-width:899px){.cards{display:flex;gap:14px;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;scrollbar-width:none;margin:0 -20px;padding:0 20px 24px;scroll-padding:0 20px}.cards::-webkit-scrollbar{display:none}.card{flex:0 0 84%;scroll-snap-align:start}}
.sdots{display:none;justify-content:center;gap:8px;margin:-10px 0 50px}.sdots i{width:8px;height:8px;border-radius:50%;background:#ccc;transition:background .2s}.sdots i.on{background:var(--red)}
@media(max-width:899px){.sdots{display:flex}}
.card{background:#f7f7f7;border-radius:16px;overflow:hidden;text-align:center;position:relative}
.card img{width:100%;aspect-ratio:1/1;object-fit:cover}
.card .b{padding:26px 24px 20px;position:relative}.card .q{position:absolute;right:16px;top:-24px;width:48px;height:48px;border-radius:50%;background:var(--red);color:#fff;font-size:1.8rem;font-weight:700;display:grid;place-items:center;font-family:Georgia,serif}
.card:not(.img) .q{top:12px}.card:not(.img) .b{padding-top:34px}
.card h3{font-size:1.2rem;margin:8px 0 10px}.card p{margin:0;line-height:1.7;color:#333}.card .n{margin-top:18px;padding-top:12px;border-top:1px solid #e6e6e6;font-weight:600;font-style:italic;font-size:.9rem}
.ft{position:relative;background:#111111;color:#fff;text-align:center;margin-top:30px}
.waves{position:absolute;left:0;right:0;top:-70px;height:72px;overflow:hidden}.waves svg{position:absolute;left:0;top:0;width:200%;height:100%}
.waves path{fill:#111111}.w1{opacity:.35;animation:wave 14s linear infinite}.w2{opacity:.55;animation:wave 10s linear infinite reverse}.w3{opacity:1;animation:wave 18s linear infinite}
@keyframes wave{from{transform:translateX(0)}to{transform:translateX(-50%)}}
.ftin{padding:60px 20px 40px;max-width:600px;margin:0 auto}.ftin h2{font-size:1.7rem;margin:0 0 12px}.ftin p{margin:0 0 24px;font-family:Georgia,serif}
.sub{display:flex;max-width:360px;margin:0 auto 60px;border:1px solid rgba(255,255,255,.8);border-radius:4px;padding:0 4px 0 18px}.sub input{flex:1;background:none;border:0;color:#fff;font:inherit;font-family:Georgia,serif;font-size:1rem;padding:14px 0;outline:none}.sub input::placeholder{color:rgba(255,255,255,.85)}.sub button{background:none;border:0;color:#fff;font-size:1.3rem;cursor:pointer;padding:0 10px}
.ftpay{margin:0 0 18px}.copy{font-family:Georgia,serif;font-size:.85rem;margin:0 0 14px}.ft nav{display:flex;flex-wrap:wrap;gap:18px;justify-content:center;font-size:.8rem;opacity:.9}
`

// Placeholder options until the real product details arrive.
const COLOURS = ['Pink', 'Hot Pink', 'Lilac']
const SIZES = ['Medium', 'Large']
const LARGE_EXTRA = 22

export function productPage({ origin, tiers, addons = [], images, reviewImages, logo, store }) {
  const t1 = tiers[0]
  const def = 0
  const tier = (t, i) => `<label class="tier${i === def ? ' on' : ''}" data-qty="${t.qty}" data-price="${t.price}" data-compare="${t.compare}">${t.tag ? `<span class="tag">${esc(t.tag)}</span>` : ''}<span class="rad"></span><span><span class="t">${esc(t.name)}</span>${t.badge ? `<span class="sv">${esc(t.badge)}</span>` : ''}<br><span class="s">${esc(t.sub || '')}</span></span><span class="p"><b class="tp">${money(t.price)}</b><span>${money(t.compare)}</span></span><span class="tsz">${Array.from({ length: t.qty }, (_, k) => `<span class="tszr"><img src="${esc(images[0])}" alt=""><span class="tszi"><small>${t.qty > 1 ? `Pillow ${k + 1} size` : 'Size'}</small><select data-f="s">${SIZES.map((z) => `<option value="${z}">${z}</option>`).join('')}</select></span></span>`).join('')}</span></label>`
  const body = `
<div class="cd"><b>SALE ENDS SOON!</b><span><i id="cdd">00</i><small>days</small></span>:<span><i id="cdh">00</i><small>hours</small></span>:<span><i id="cdm">00</i><small>mins</small></span>:<span><i id="cds">00</i><small>secs</small></span></div>
<header class="hdr"><a class="logo" href="/"><img src="${esc(logo)}" alt="BratzSnug"></a><a class="cart" href="${CHECKOUT_PATH}?key=1:" aria-label="Cart">${ICON.cart}</a></header>
<div class="marq"><div>${'<span>MADE TO ORDER</span><span>FREE SHIPPING</span><span>SOFT &amp; COZY</span><span>24/7 CUSTOMER SUPPORT</span><span>TRACKING ON EVERY ORDER</span>'.repeat(5)}</div></div>
<main class="wrap">
<section class="prod">
  <div class="gal"><div class="main"><img id="mainimg" src="${esc(images[0])}" alt="BratzSnug™ Passenger Pillow"></div>
    <div class="thumbs">${images.map((src, i) => `<button type="button" class="${i === 0 ? 'on' : ''}" data-src="${esc(src)}"><img src="${esc(src)}" alt=""></button>`).join('')}</div></div>
  <div class="info">
    <h1>BratzSnug™ Passenger Pillow</h1>
    <div class="rating">${STARS}<span>(860+ Reviews)</span></div>
    <div class="price"><span class="now" id="pnow">${money(tiers[def].price)}</span><span class="cur">USD</span><span class="was" id="pwas">${money(tiers[def].compare)}</span><span class="badge" id="psave">SAVE ${Math.round((1 - tiers[def].price / tiers[def].compare) * 100)}%</span></div>
    
    <div class="pill">💋 Made for comfort on every road trip</div>
    <div class="fg"><div>💋<span>Wraparound Support</span></div><div>☁️<span>Soft &amp; Cozy</span></div><div>🌙<span>Head-to-Toe Comfort</span></div><div>🚗<span>Road Trip Ready</span></div></div>
    <div class="low">BUNDLE &amp; SAVE</div>
    <div class="tiers" id="tiers">${tiers.map(tier).join('')}</div>
<div class="adb" id="adb"><label class="ad"><input type="checkbox" data-key="protection" data-price="8.99"><img class="adi" src="/images/ad-protection.png" alt=""><b>Add Shipping Protection (+$8.99)</b></label><label class="ad"><input type="checkbox" data-key="mystery" data-price="18.99"><img class="adi" src="/images/ad-mystery.png" alt=""><b>Add Mystery Gift (+$18.99)</b></label><label class="ad"><input type="checkbox" data-key="priority" data-price="9.99"><img class="adi" src="/images/ad-priority.png" alt=""><b>Add Priority Shipping (+$9.99)</b></label></div>
    <div class="saving" id="saving" hidden>→ You're saving ${money(tiers[def].compare - tiers[def].price)} on this order</div>
    <button class="atc" id="atc" type="button">ADD TO CART</button>
    <div class="pay">${PAY}</div>
    <div class="acc"><details><summary>Size Guide</summary><p>Sizes and measurements will be added here once the product details are confirmed.</p></details>
    <details><summary>Shipping &amp; Delivery</summary><p>Every BratzSnug is made to order, so it is produced after you buy. Delivery times vary with production and shipping, so we don't promise a fixed date. You'll get a tracking link by email as soon as your order ships.</p></details>
    <details><summary>30-Day Money-Back Guarantee</summary><p>Not in love with it? Contact us within 30 days of delivery and we'll make it right. See our <a href="/pages/refund-policy">Refund &amp; Return Policy</a> for the details.</p></details></div>
    <div class="trust"><div>${ICON.heart}<b>Satisfaction Guarantee</b></div><div>${ICON.returns}<b>Free Returns</b></div><div>${ICON.truck}<b>Free Shipping</b></div></div>
    <div class="tick" id="tick"><img src="${esc(images[1])}" alt=""><p id="tickp">Best road trip I have ever had 💋<small>Julia M.</small></p></div>
    <div class="dots" id="dots"><i class="on"></i><i></i><i></i></div>
  </div>
</section>
<section class="jr"><h2>Comfort for Every Journey</h2><div class="heart">💋</div><div class="jcards">${[['bz-j1', 'Relax &amp; Unwind'], ['bz-j2', 'Cozy Naps'], ['bz-j3', 'Mom &amp; Baby'], ['bz-j4', 'After Long Shifts']].map(([f, t]) => `<div class="jc"><img src="/images/${f}.webp" alt=""><b>${t}</b></div>`).join('')}</div></section>
<section class="faq2"><h2>Your Questions, Answered 💋</h2>
  <details><summary>What is the BratzSnug Passenger Pillow designed for?</summary><p>The BratzSnug is a full-body comfort pillow made for road trips and long car rides. Its wraparound shape gives you a cozy place to rest your head, neck and arms while you relax in the passenger seat.</p></details>
  <details><summary>Is the BratzSnug soft and comfortable?</summary><p>Yes! It has a soft, plush cover and generous cushioning, so it's perfect for relaxing, lounging and getting cozy on road trips.</p></details>
  <details><summary>Can I use the BratzSnug at home?</summary><p>Of course. It's great for lounging on the couch, reading in bed or relaxing at home whenever you want extra cushioning.</p></details>
  <details><summary>Is it suitable during pregnancy?</summary><p>Many people find the soft cushioning comfortable for resting at home. When travelling, always sit upright with your seat belt positioned correctly, and check with your healthcare professional if you have any pregnancy-related concerns.</p></details>
  <details><summary>How long does shipping take?</summary><p>Every BratzSnug is made to order, so it is produced after you buy. Delivery times vary with production and shipping, so we don't promise a fixed date. Once your order ships, you'll receive a tracking link by email so you can follow it every step of the way. 💋</p></details>
</section>
<section class="rv"><h2>Customer Reviews</h2><div class="rvc"><div class="rvi"><img src="/images/bz-r1.webp" alt=""><span class="rq">”</span><div class="rvb">${STARS}<p>"Between road trips and my daily commute, this pillow has been a total lifesaver 🚗✨ It supports my neck and arms so I don't wake up stiff. I don't leave for a trip without it!"</p><b>Sarah C.</b></div></div><div class="rvi"><img src="/images/bz-r2.webp" alt=""><span class="rq">”</span><div class="rvb">${STARS}<p>"I bought this for my sister before her big move and she hasn't stopped raving about it! 🎁 She said it made hours in the passenger seat so much more comfortable. Super soft and the leopard print is everything 💋"</p><b>Lisa M.</b></div></div><div class="rvi"><img src="/images/bz-r3.webp" alt=""><span class="rq">”</span><div class="rvb">${STARS}<p>"After long travel days, sitting in the car leaves me exhausted 😴 Cozying up with my BratzSnug makes the ride home so relaxing. It feels like a warm hug for your neck and shoulders! ☁️"</p><b>Monique S.</b></div></div></div><div class="rdots" id="rdots"><i class="on"></i><i></i><i></i></div></section>
</main>
<footer class="ft"><div class="waves" aria-hidden="true"><svg viewBox="0 0 1440 120" preserveAspectRatio="none"><path class="w1" d="M0 70 C240 20 480 20 720 70 S1200 120 1440 70 L1440 120 L0 120Z"/><path class="w2" d="M0 90 C300 40 600 40 900 90 S1300 130 1440 90 L1440 120 L0 120Z"/><path class="w3" d="M0 100 C360 60 720 60 1080 100 S1380 130 1440 100 L1440 120 L0 120Z"/></svg></div>
<div class="ftin"><div class="ftc"><div><h3>Quick links</h3><a href="/pages/contact">Contact</a><a href="/pages/refund-policy">Return &amp; Refund Policy</a><a href="/pages/privacy-policy">Privacy Policy</a><a href="/pages/shipping">Shipping Policy</a></div>
<div><h3>Subscribe to our emails</h3><p>Join our email list for exclusive offers and the latest news.</p><form method="post" action="/contact" class="sub2"><input type="hidden" name="form_type" value="customer"><input type="email" name="contact[email]" placeholder="Email" required autocomplete="email"><button type="submit">Sign up</button></form></div></div>
<div class="ftb"><div class="pay ftpay">${PAY}</div><p class="copy">© ${new Date().getFullYear()}, ${esc(store)}</p></div></div></footer>
<script>
  const $ = (s) => document.querySelector(s);
  const money = (n) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  let qty = ${tiers[def].qty};
  const addTotal = () => [...document.querySelectorAll('.ad input:checked')].reduce((n, x) => n + Number(x.dataset.price), 0);
  const largeTotal = () => [...document.querySelectorAll('.tier.on select[data-f="s"]')].filter((x) => x.value === 'Large').length * ${LARGE_EXTRA};
  const refresh = () => {
    const t = $('.tier.on'); const base = Number(t.dataset.price) + largeTotal(); const total = base + addTotal();
    document.querySelectorAll('.tier').forEach((x) => { x.querySelector('.tp').textContent = money(x === t ? total : Number(x.dataset.price)); });
    $('#pnow').textContent = money(total);
    t.after($('#adb'));
  };
  document.querySelectorAll('.ad input, .tsz select').forEach((x) => x.addEventListener('change', refresh));
    // Same starting time on every visit (2h 20m 26s); restarts when it reaches zero.
  const START = (2 * 3600 + 20 * 60 + 26) * 1000;
  let end = Date.now() + START;
  const pad = (n) => String(n).padStart(2, '0');
  const tick = () => { if (end - Date.now() <= 0) end = Date.now() + START; let d = Math.max(0, end - Date.now()) / 1000; $('#cdd').textContent = pad(Math.floor(d / 86400)); $('#cdh').textContent = pad(Math.floor(d / 3600) % 24); $('#cdm').textContent = pad(Math.floor(d / 60) % 60); $('#cds').textContent = pad(Math.floor(d) % 60); };
  tick(); setInterval(tick, 1000);
  refresh();
  const rv = document.querySelector('.rvc'), rd = document.querySelectorAll('#rdots i');
  if (rv) rv.addEventListener('scroll', () => { const c = rv.children[0]; const i = Math.round(rv.scrollLeft / (c.offsetWidth + 14)); rd.forEach((d, k) => d.classList.toggle('on', k === i)); });
  document.querySelectorAll('.tier').forEach((t) => t.addEventListener('click', () => {
    document.querySelectorAll('.tier').forEach((x) => x.classList.remove('on')); t.classList.add('on');
    qty = Number(t.dataset.qty); setTimeout(refresh);
    $('#pnow').textContent = money(t.dataset.price); $('#pwas').textContent = money(t.dataset.compare);
    $('#saving').textContent = "→ You're saving " + money(t.dataset.compare - t.dataset.price) + ' on this order';
    $('#psave').textContent = 'SAVE ' + Math.round((1 - t.dataset.price / t.dataset.compare) * 100) + '%';
  }));
  $('#atc').addEventListener('click', () => { const L = largeTotal() / ${LARGE_EXTRA}; const ad = (L ? ['L' + L] : []).concat([...document.querySelectorAll('.ad input:checked')].map((x) => x.dataset.key)).join(','); location.href = ${JSON.stringify(CHECKOUT_PATH)} + '?key=' + qty + ':' + ad; });
  document.querySelectorAll('.thumbs button').forEach((b) => b.addEventListener('click', () => { document.querySelectorAll('.thumbs button').forEach((x) => x.classList.remove('on')); b.classList.add('on'); $('#mainimg').src = b.dataset.src; }));
  const cardsEl = document.querySelector('.cards'), sd = document.querySelectorAll('#sdots i');
  if (cardsEl) cardsEl.addEventListener('scroll', () => { const c = cardsEl.children[0]; if (!c) return; const i = Math.round(cardsEl.scrollLeft / (c.offsetWidth + 14)); sd.forEach((d, k) => d.classList.toggle('on', k === i)); }, { passive: true });
  const ticks = [['Best road trip I have ever had 💋', 'Julia M.'], ['So soft and the leopard print is iconic.', 'Chris B.'], ['I nap the whole drive now. 10/10.', 'Amanda K.']];
  let ti = 0; setInterval(() => { ti = (ti + 1) % ticks.length; $('#tickp').innerHTML = ticks[ti][0] + '<small>' + ticks[ti][1] + '</small>'; document.querySelectorAll('#dots i').forEach((d, i) => d.classList.toggle('on', i === ti)); }, 4000);
</script>`
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BratzSnug™ Passenger Pillow – ${esc(store)}</title><meta name="description" content="The BratzSnug Passenger Pillow: a soft wraparound pillow for road trips, naps and lounging at home. Made to order."><link rel="icon" href="/images/favicon.png"><link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet"><style>:root{--red:#FF1C8D;--baby:#ffe6f1;--babyink:#111111}${CSS}.cd{background:#111111;color:#fff;display:flex;justify-content:center;align-items:center;gap:10px;padding:8px 12px;font-weight:800;flex-wrap:wrap}.cd b{font-size:1.15rem;margin-right:12px}.cd span{display:flex;flex-direction:column;align-items:center;min-width:38px}.cd i{font-style:normal;font-size:1.4rem;line-height:1}.cd small{font-size:.65rem;font-weight:500;opacity:.85}h1,.jr h2,.faq2 h2,.testi h2,.acc summary{font-family:'Playfair Display',Georgia,serif}h1{color:#111111}.fg{display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:18px;border-radius:12px;box-shadow:0 4px 16px #ff1c8d1f;margin:0 0 20px}.fg div{display:flex;gap:10px;align-items:center;font-weight:500}.tier .sv{display:inline-block;margin-left:8px;vertical-align:3px;background:#111111;color:#fff;border-radius:6px;font-size:.72rem;font-weight:700;padding:3px 8px}.tsz{display:none;grid-column:1/-1;flex-direction:column;gap:10px;padding-top:4px}.tier.on .tsz{display:flex}.tszr{display:flex;gap:12px;align-items:flex-end}.tszr img{width:44px;height:44px;border-radius:8px;object-fit:cover}.tszi{display:flex;flex-direction:column;gap:4px}.tszi small{font-size:.75rem;font-weight:600;color:#444}.tsz select{font:inherit;padding:7px 28px 7px 10px;border:1.5px solid #ffb3d4;border-radius:8px;background:#fff}.adb{background:#111111;border-radius:0 0 10px 10px;margin:-14px 0 14px;padding:10px 14px 4px}.tier.on{border-radius:10px 10px 0 0}.ad.fs{cursor:default}.ad.fs b{color:#ffd1e8}.ad{display:flex;align-items:center;gap:12px;color:#fff;padding:12px 0;border-bottom:1px solid #ffffff2a;cursor:pointer}.ad:last-child{border:0}.ad input{width:20px;height:20px;accent-color:#FF6FB5}.price .cur{font-size:.8rem;font-weight:700;color:#111111;margin-left:-4px}.adi{width:34px;height:34px;border-radius:8px;background:#fff}.up2{display:flex;gap:12px;align-items:center;border:1.5px solid #ffb3d4;background:#fff5fa;border-radius:10px;padding:12px;margin:0 0 18px;cursor:pointer}.up2 input{width:20px;height:20px;accent-color:#FF1C8D}.up2 img{width:56px;height:56px;border-radius:8px}.up2>span:nth-of-type(1){flex:1}.up2 small{display:block;color:#555}.acc{margin:18px 0}.acc details{border-bottom:1px solid #f3c6dc;padding:14px 4px}.acc summary{cursor:pointer;font-weight:700;color:#111111;font-size:1.05rem}.acc p{margin:10px 0 0;color:#444;line-height:1.6}.jr{text-align:center;margin:60px 0}.jr h2,.faq2 h2{color:#111111;font-size:2.2rem;margin:0 0 6px}.heart{margin-bottom:24px}.jcards{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}.jc{border-radius:14px;overflow:hidden;background:#fff5fa;box-shadow:0 4px 14px #0000000f}.jc img{width:100%;aspect-ratio:4/5;object-fit:cover;display:block}.jc b{display:block;padding:12px;color:#111111;font-family:'Playfair Display',Georgia,serif;font-size:1.1rem}.faq2{max-width:760px;margin:40px auto 60px;padding:0 16px}.faq2 h2{text-align:center;margin-bottom:24px}.faq2 details{border-bottom:1px solid #f3c6dc;padding:16px 4px}.faq2 summary{cursor:pointer;font-family:'Playfair Display',Georgia,serif;font-weight:700;color:#111111}.faq2 p{color:#444;line-height:1.7;margin:10px 0 0}.rv{margin:60px 0 40px;text-align:center}.rv h2{font-family:'Playfair Display',Georgia,serif;color:#111111;font-size:2.3rem;margin:0 0 26px}.rvc{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;align-items:start}.rvi{background:#fff5fa;border-radius:18px;overflow:hidden;position:relative}.rvi img{width:100%;aspect-ratio:1/1;object-fit:cover;display:block}.rq{position:absolute;right:20px;margin-top:-26px;width:52px;height:52px;border-radius:50%;background:#111111;color:#fff;font:700 2rem/52px Georgia,serif}.rvb{padding:18px 22px 20px}.rvb p{color:#4a2a3a;line-height:1.75;margin:12px 0 14px}.rvb b{display:block;border-top:1px solid #f3c6dc;padding-top:12px;color:#111111;font-size:.9rem}.ftin{text-align:left;max-width:1100px;margin:0 auto;padding:30px 20px 24px}.ftc{display:grid;grid-template-columns:1fr 1fr;gap:40px;padding-bottom:30px;border-bottom:1px solid #ffffff33}.ftc h3{font-family:'Playfair Display',Georgia,serif;font-size:1.5rem;margin:0 0 18px;color:#fff}.ftc a{display:block;color:#fff;text-decoration:none;margin:0 0 12px}.ftc p{color:#fff;margin:0 0 16px;line-height:1.6}.sub2 input{width:100%;box-sizing:border-box;padding:13px 16px;border:1px solid #fff;border-radius:6px;background:transparent;color:#fff;font:inherit;margin-bottom:10px}.sub2 input::placeholder{color:#ffe6f1}.sub2 button{width:100%;padding:13px;border:0;border-radius:6px;background:#fff;color:#111111;font:inherit;font-weight:700;cursor:pointer}.ftb{text-align:center;padding-top:26px}@media(max-width:800px){.ftc{grid-template-columns:1fr}.rvc{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;gap:14px;padding:0 4px 6px;scrollbar-width:none}.rvc::-webkit-scrollbar{display:none}.rvi{flex:0 0 86%;scroll-snap-align:center}.rdots{display:flex}}.rdots{display:none;justify-content:center;gap:8px;margin-top:14px}.rdots i{width:8px;height:8px;border-radius:50%;background:#f3c6dc}.rdots i.on{background:#FF1C8D}@media(max-width:800px){.jcards{grid-template-columns:1fr 1fr}.cd b{width:100%;text-align:center;margin:0}}</style></head><body>${body}</body></html>`
}
