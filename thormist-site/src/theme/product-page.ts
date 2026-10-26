// @ts-nocheck
// ThorMist product page (the shop's only page), laid out like the reference
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
.marq{background:#0b1633;color:#fff;font-weight:700;font-size:.95rem;letter-spacing:.04em;overflow:hidden;white-space:nowrap;padding:14px 0}
.marq div{display:inline-block;animation:marq 28s linear infinite}.marq span{margin:0 56px}
@keyframes marq{from{transform:translateX(0)}to{transform:translateX(-50%)}}
.wrap{max-width:1300px;margin:0 auto;padding:0 20px}
.prod{display:grid;grid-template-columns:1fr;gap:28px;padding:28px 0 20px}
@media(min-width:900px){.prod{grid-template-columns:1.25fr 1fr;gap:48px;padding:44px 0 30px}}
.prod>*{min-width:0}.gal .main{border-radius:12px;overflow:hidden;background:#f5f5f5}.gal .main img{width:100%;aspect-ratio:3/4;object-fit:cover}
.thumbs{display:flex;gap:10px;margin-top:12px;overflow-x:auto}.thumbs button{flex:none;width:92px;height:92px;padding:0;border:2px solid #e5e5e5;border-radius:8px;overflow:hidden;background:#fff;cursor:pointer}.thumbs button.on{border-color:#121212}.thumbs img{width:100%;height:100%;object-fit:cover}
h1{font-size:2.4rem;line-height:1.1;margin:0 0 8px;font-weight:700}
.rating{display:flex;align-items:center;gap:8px;font-size:.95rem;margin:0 0 10px}.stars{color:#ffc107;letter-spacing:1px;font-size:1.05rem}
.price{display:flex;align-items:center;gap:10px;margin:0 0 16px}.price .now{color:var(--red);font-weight:700;font-size:1.5rem}.price .was{color:#737373;text-decoration:line-through;font-size:1.1rem}
.badge{background:var(--red);color:#fff;font-size:.72rem;font-weight:700;letter-spacing:.06em;padding:5px 10px;border-radius:5px}
.bul{list-style:none;padding:0;margin:0 0 16px;display:grid;gap:10px;font-size:1rem}.bul li{display:flex;gap:10px;align-items:baseline}.bul li span{color:#555}.bul li b{color:#121212}
.pill{display:inline-block;background:#e3ecff;border:1px solid #b9cdfa;color:#0b1633;font-weight:600;font-size:.9rem;border-radius:999px;padding:7px 14px;margin:0 0 16px}
.low{display:flex;align-items:center;gap:12px;font-weight:700;font-size:.9rem;margin:6px 0 14px}.low:before,.low:after{content:'';flex:1;height:1px;background:#b9cdfa}
.tiers{display:grid;gap:12px}
.tier{position:relative;display:grid;grid-template-columns:auto 1fr auto;gap:14px;align-items:center;padding:16px 18px;border:2px solid #c9d8fb;background:#f1f5ff;border-radius:8px;cursor:pointer}
.tier.on{border-color:var(--red);background:#e3ecff}
.tier .rad{width:22px;height:22px;border-radius:50%;border:2px solid #d9d9d9;background:#fff;display:grid;place-items:center}.tier.on .rad{border-color:var(--red)}.tier.on .rad:after{content:'';width:12px;height:12px;border-radius:50%;background:var(--red)}
.tier .t{font-weight:700;font-size:1.15rem}.tier .fs{display:inline-block;margin-left:8px;vertical-align:2px;border:1.5px solid var(--red);color:var(--red);border-radius:6px;font-size:.72rem;font-weight:700;padding:2px 7px}.tier .s{font-size:.85rem;color:#444}
.tier .p{text-align:right}.tier .p b{font-size:1.25rem}.tier .p span{display:block;color:#737373;text-decoration:line-through;font-size:.85rem}
.tier .tag{position:absolute;right:-6px;top:-14px;font-size:.8rem !important;padding:5px 14px !important;transform:rotate(2deg);background:var(--red);color:#fff;font-size:.7rem;font-weight:700;letter-spacing:.05em;padding:4px 10px;border-radius:4px}
.saving{margin:14px 0 12px;border:1px solid #9db8f7;background:#f1f5ff;border-radius:6px;padding:12px 16px;font-size:.92rem;color:#0b1633}
.atc{display:block;width:100%;border:0;background:var(--red);color:#fff;font:inherit;font-weight:700;font-size:1.15rem;letter-spacing:.06em;padding:17px;border-radius:6px;cursor:pointer}
.pay{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:14px 0 24px}
.trust{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;text-align:center;color:var(--red);margin:0 0 20px}.trust b{display:block;color:#121212;font-size:1rem;margin-top:6px}
.tick{display:flex;gap:14px;align-items:center;border-bottom:1px solid #eee;padding:8px 0 10px}.tick img{width:50px;height:50px;border-radius:50%;object-fit:cover}.tick p{margin:0;font-size:.95rem}.tick small{display:block;color:#737373;font-style:italic;margin-top:2px}
.dots{display:flex;gap:8px;justify-content:center;margin:10px 0}.dots i{width:8px;height:8px;border-radius:50%;background:#ccc}.dots i.on{background:#121212}
.faq{max-width:720px;margin:20px auto 50px}
.faq details{border-bottom:1px solid #e6e6e6;padding:14px 0}.faq summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:12px;font-weight:700;font-size:1.05rem}.faq summary::-webkit-details-marker{display:none}.faq summary:after{content:'⌃';margin-left:auto;transform:rotate(180deg);color:#555}.faq details[open] summary:after{transform:none}
.faq p{margin:12px 0 0;line-height:1.7;color:#333}
.feat{display:grid;grid-template-columns:1fr;gap:28px;align-items:center;padding:30px 0}
@media(min-width:900px){.feat{grid-template-columns:1fr 1fr;gap:60px;padding:46px 0}}
.feat img{border-radius:14px;width:100%;aspect-ratio:3/4;object-fit:cover}.feat h2{font-size:2.3rem;margin:0 0 14px;line-height:1.15}.feat p{color:#333;line-height:1.7;margin:0;font-size:1.05rem}
.testi h2{text-align:center;font-size:2.4rem;margin:30px 0 30px}
.cards{display:grid;grid-template-columns:1fr;gap:28px;align-items:start;padding-bottom:60px}
@media(min-width:900px){.cards{grid-template-columns:repeat(3,1fr)}}
@media(max-width:899px){.cards{display:flex;gap:14px;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;scrollbar-width:none;margin:0 -20px;padding:0 20px 24px;scroll-padding:0 20px}.cards::-webkit-scrollbar{display:none}.card{flex:0 0 84%;scroll-snap-align:start}}
.sdots{display:none;justify-content:center;gap:8px;margin:-10px 0 50px}.sdots i{width:8px;height:8px;border-radius:50%;background:#ccc;transition:background .2s}.sdots i.on{background:var(--red)}
@media(max-width:899px){.sdots{display:flex}}
.card{background:#f7f7f7;border-radius:16px;overflow:hidden;text-align:center;position:relative}
.card img{width:100%;aspect-ratio:3/4;object-fit:cover}
.card .b{padding:26px 24px 20px;position:relative}.card .q{position:absolute;right:16px;top:-24px;width:48px;height:48px;border-radius:50%;background:var(--red);color:#fff;font-size:1.8rem;font-weight:700;display:grid;place-items:center;font-family:Georgia,serif}
.card:not(.img) .q{top:12px}.card:not(.img) .b{padding-top:34px}
.card h3{font-size:1.2rem;margin:8px 0 10px}.card p{margin:0;line-height:1.7;color:#333}.card .n{margin-top:18px;padding-top:12px;border-top:1px solid #e6e6e6;font-weight:600;font-style:italic;font-size:.9rem}
.ft{position:relative;background:var(--red);color:#fff;text-align:center;margin-top:30px}
.waves{position:absolute;left:0;right:0;top:-70px;height:72px;overflow:hidden}.waves svg{position:absolute;left:0;top:0;width:200%;height:100%}
.waves path{fill:var(--red)}.w1{opacity:.35;animation:wave 14s linear infinite}.w2{opacity:.55;animation:wave 10s linear infinite reverse}.w3{opacity:1;animation:wave 18s linear infinite}
@keyframes wave{from{transform:translateX(0)}to{transform:translateX(-50%)}}
.ftin{padding:60px 20px 40px;max-width:600px;margin:0 auto}.ftin h2{font-size:1.7rem;margin:0 0 12px}.ftin p{margin:0 0 24px;font-family:Georgia,serif}
.sub{display:flex;max-width:360px;margin:0 auto 60px;border:1px solid rgba(255,255,255,.8);border-radius:4px;padding:0 4px 0 18px}.sub input{flex:1;background:none;border:0;color:#fff;font:inherit;font-family:Georgia,serif;font-size:1rem;padding:14px 0;outline:none}.sub input::placeholder{color:rgba(255,255,255,.85)}.sub button{background:none;border:0;color:#fff;font-size:1.3rem;cursor:pointer;padding:0 10px}
.ftpay{margin:0 0 18px}.copy{font-family:Georgia,serif;font-size:.85rem;margin:0 0 14px}.ft nav{display:flex;flex-wrap:wrap;gap:18px;justify-content:center;font-size:.8rem;opacity:.9}
`

export function productPage({ origin, tiers, images, reviewImages, logo, store }) {
  const t1 = tiers[0]
  const def = 0
  const tier = (t, i) => `<label class="tier${i === def ? ' on' : ''}" data-qty="${t.qty}" data-price="${t.price}" data-compare="${t.compare}">${t.tag ? `<span class="tag">${esc(t.tag)}</span>` : ''}<span class="rad"></span><span><span class="t">${esc(t.name || `Buy ${t.qty}`)}</span>${t.ship ? '<span class="fs">Free Shipping</span>' : ''}<br><span class="s">${esc(t.sub || '')}</span></span><span class="p"><b>${money(t.price)}</b><span>${money(t.compare)}</span></span></label>`
  const body = `
<header class="hdr"><a class="logo" href="/"><img src="${esc(logo)}" alt="ThorMist"></a><a class="cart" href="${CHECKOUT_PATH}?key=1:" aria-label="Cart">${ICON.cart}</a></header>
<div class="marq"><div>${'<span>MADE TO ORDER</span><span>FREE SHIPPING ON BUNDLES</span><span>24/7 CUSTOMER SUPPORT</span><span>TRACKING ON EVERY ORDER</span>'.repeat(5)}</div></div>
<main class="wrap">
<section class="prod">
  <div class="gal"><div class="main"><img id="mainimg" src="${esc(images[0])}" alt="ThorMist Hammer Humidifier"></div>
    <div class="thumbs">${images.map((src, i) => `<button type="button" class="${i === 0 ? 'on' : ''}" data-src="${esc(src)}"><img src="${esc(src)}" alt=""></button>`).join('')}</div></div>
  <div class="info">
    <h1>ThorMist Hammer Humidifier</h1>
    <div class="rating">${STARS}<span>4.85/5 | 1,450+ Reviews</span></div>
    <div class="price"><span class="now" id="pnow">${money(tiers[def].price)}</span><span class="was" id="pwas">${money(tiers[def].compare)}</span><span class="badge" id="psave">SAVE ${Math.round((1 - tiers[def].price / tiers[def].compare) * 100)}%</span></div>
    <div class="pill">⚡ The desk upgrade every hero fan wants</div>
    <ul class="bul"><li>⚡ <span><b>Worthy of the gods</b> — a hammer-shaped humidifier that looks epic on any desk</span></li><li>💧 <span><b>Cool mist</b> — fill it with water and it breathes a soft mist into the room</span></li><li>🌙 <span><b>Glowing lightning</b> — blue LED cracks light up your desk or bedroom</span></li></ul>
    <div class="low">BUNDLE &amp; SAVE</div>
    <div class="tiers" id="tiers">${tiers.map(tier).join('')}</div>
    <div class="saving" id="saving">→ You're saving ${money(tiers[def].compare - tiers[def].price)} on this order</div>
    <button class="atc" id="atc" type="button">ADD TO CART</button>
    <div class="pay">${PAY}</div>
    <div class="trust"><div>${ICON.heart}<b>Satisfaction Guarantee</b></div><div>${ICON.returns}<b>Free Returns</b></div><div>${ICON.truck}<b>Free Shipping</b></div></div>
    <div class="tick" id="tick"><img src="${esc(images[3])}" alt=""><p id="tickp">The funniest gift ever 😂 Everyone was dying laughing!<small>Julia M.</small></p></div>
    <div class="dots" id="dots"><i class="on"></i><i></i><i></i></div>
  </div>
</section>
<section class="faq">
  <details><summary>${ICON.check} How does it work?</summary><p>Fill the tank with water, switch it on and it releases a soft cool mist while the lightning cracks glow. Full setup steps come in the box.</p></details>
  <details><summary>${ICON.check} Where can I use it?</summary><p>On your desk, nightstand, gaming setup or shelf. It adds moisture to the air and makes a great night light.</p></details>
  <details><summary>${ICON.check} Is it a good gift?</summary><p>It's the gift every superhero fan gets excited about. Perfect for birthdays, Christmas and anyone with an epic gaming or desk setup.</p></details>
  <details><summary>${ICON.check} When will my order arrive?</summary><p>Every ThorMist is made to order, so it is produced after you buy. Delivery times vary with production and shipping, so we don't promise a fixed date. We'll email you tracking details as soon as your order ships.</p></details>
</section>
<section class="feat"><img src="${esc(images[1])}" alt="ThorMist glowing on a desk"><div><h2>Summon The Storm</h2><p>Switch it on and watch the lightning cracks glow electric blue as mist rolls out of the hammer. Your desk will never look the same.</p></div></section>
<section class="feat"><img src="${esc(images[2])}" alt="ThorMist in a bedroom"><div><h2>Fill It. Switch It On.</h2><p>Pour water into the tank, press the button and it gets to work. A soft, cool mist and a calming glow for long gaming nights or a good night's sleep. ⚡</p></div></section>
<section class="testi"><h2>Testimonials</h2>
<div class="cards">
  <div class="card img"><img src="${esc(reviewImages[0])}" alt=""><div class="b"><span class="q">”</span>${STARS}<h3>Looks insane on my desk!</h3><p>The glow at night is unreal and the mist coming out of the hammer looks like a storm is brewing. Everyone who sees my setup asks where I got it.</p><div class="n">Jessica F.</div></div></div>
  <div class="card img"><img src="${esc(reviewImages[1])}" alt=""><div class="b"><span class="q">”</span>${STARS}<h3>Best gift I've given</h3><p>Bought it for my boyfriend who loves Marvel and he hasn't stopped showing it off. Great detail and it actually works as a humidifier too.</p><div class="n">Michael C.</div></div></div>
  <div class="card img"><img src="${esc(reviewImages[2])}" alt=""><div class="b"><span class="q">”</span>${STARS}<h3>My son is obsessed</h3><p>He leaves it on as a night light every night. The blue lightning is so cool and the room feels way less dry now.</p><div class="n">Daniel A.</div></div></div>
</div><div class="sdots" id="sdots"><i class="on"></i><i></i><i></i></div></section>
</main>
<footer class="ft"><div class="waves" aria-hidden="true"><svg viewBox="0 0 1440 120" preserveAspectRatio="none"><path class="w1" d="M0 70 C240 20 480 20 720 70 S1200 120 1440 70 L1440 120 L0 120Z"/><path class="w2" d="M0 90 C300 40 600 40 900 90 S1300 130 1440 90 L1440 120 L0 120Z"/><path class="w3" d="M0 100 C360 60 720 60 1080 100 S1380 130 1440 100 L1440 120 L0 120Z"/></svg></div>
<div class="ftin"><h2>Subscribe to our emails</h2><p>Join our list for exclusive offers and first look at new drops.</p>
<form method="post" action="/contact" class="sub"><input type="hidden" name="form_type" value="customer"><input type="email" name="contact[email]" placeholder="Email" required autocomplete="email"><button type="submit" aria-label="Subscribe">→</button></form>
<div class="pay ftpay">${PAY}</div><p class="copy">© ${new Date().getFullYear()}, ${esc(store)}</p><nav><a href="/pages/refund-policy">Refund &amp; Return Policy</a><a href="/pages/shipping">Shipping Policy</a><a href="/pages/contact">Contact</a></nav></div></footer>
<script>
  const $ = (s) => document.querySelector(s);
  const money = (n) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  let qty = ${tiers[def].qty};
  document.querySelectorAll('.tier').forEach((t) => t.addEventListener('click', () => {
    document.querySelectorAll('.tier').forEach((x) => x.classList.remove('on')); t.classList.add('on');
    qty = Number(t.dataset.qty);
    $('#pnow').textContent = money(t.dataset.price); $('#pwas').textContent = money(t.dataset.compare);
    $('#saving').textContent = "→ You're saving " + money(t.dataset.compare - t.dataset.price) + ' on this order';
    $('#psave').textContent = 'SAVE ' + Math.round((1 - t.dataset.price / t.dataset.compare) * 100) + '%';
  }));
  $('#atc').addEventListener('click', () => { location.href = ${JSON.stringify(CHECKOUT_PATH)} + '?key=' + qty + ':'; });
  document.querySelectorAll('.thumbs button').forEach((b) => b.addEventListener('click', () => { document.querySelectorAll('.thumbs button').forEach((x) => x.classList.remove('on')); b.classList.add('on'); $('#mainimg').src = b.dataset.src; }));
  const cardsEl = document.querySelector('.cards'), sd = document.querySelectorAll('#sdots i');
  if (cardsEl) cardsEl.addEventListener('scroll', () => { const c = cardsEl.children[0]; if (!c) return; const i = Math.round(cardsEl.scrollLeft / (c.offsetWidth + 14)); sd.forEach((d, k) => d.classList.toggle('on', k === i)); }, { passive: true });
  const ticks = [['The funniest gift ever 😂 Everyone was dying laughing!', 'Julia M.'], ['My dad laughed so hard he cried. Worth every cent.', 'Chris B.'], ['The lightning glow is unreal. 10/10.', 'Amanda K.']];
  let ti = 0; setInterval(() => { ti = (ti + 1) % ticks.length; $('#tickp').innerHTML = ticks[ti][0] + '<small>' + ticks[ti][1] + '</small>'; document.querySelectorAll('#dots i').forEach((d, i) => d.classList.toggle('on', i === ti)); }, 4000);
</script>`
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ThorMist Hammer Humidifier – ${esc(store)}</title><meta name="description" content="The ThorMist hammer humidifier: a cool mist humidifier with glowing blue lightning cracks. The ultimate desk upgrade for hero fans. Made to order."><link rel="icon" href="/images/favicon.png"><link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet"><style>:root{--red:#1e5eff;--baby:#e3ecff;--babyink:#0b1633}${CSS}</style></head><body>${body}</body></html>`
}
