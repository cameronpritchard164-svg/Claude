/* Master theme behaviours: real-deadline countdown + mini review slider */
(function () {
  if (!customElements.get('mt-countdown')) {
    customElements.define('mt-countdown', class extends HTMLElement {
      connectedCallback() {
        this.end = Date.parse(this.dataset.end);
        if (isNaN(this.end)) return;
        this.units = {};
        this.querySelectorAll('[data-u]').forEach((el) => (this.units[el.dataset.u] = el));
        this.tick = this.tick.bind(this);
        if (this.tick()) this.timer = setInterval(this.tick, 1000);
      }
      disconnectedCallback() { clearInterval(this.timer); }
      tick() {
        const diff = this.end - Date.now();
        if (diff <= 0) { this.hidden = true; clearInterval(this.timer); return false; }
        const p = (n) => String(n).padStart(2, '0');
        this.units.d.textContent = p(Math.floor(diff / 864e5));
        this.units.h.textContent = p(Math.floor(diff / 36e5) % 24);
        this.units.m.textContent = p(Math.floor(diff / 6e4) % 60);
        this.units.s.textContent = p(Math.floor(diff / 1e3) % 60);
        this.hidden = false;
        return true;
      }
    });
  }

  if (!customElements.get('mt-review-slider')) {
    customElements.define('mt-review-slider', class extends HTMLElement {
      connectedCallback() {
        this.track = this.querySelector('.mt-rslider__track');
        this.slides = [...this.querySelectorAll('.mt-rslider__slide')];
        const nav = this.querySelector('.mt-rslider__nav');
        if (this.slides.length < 2) { if (nav) nav.hidden = true; if (!this.slides.length) this.hidden = true; return; }
        const dots = this.querySelector('.mt-rslider__dots');
        this.dots = this.slides.map((_, i) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.setAttribute('aria-label', 'Go to review ' + (i + 1));
          b.addEventListener('click', () => this.go(i));
          dots.appendChild(b);
          return b;
        });
        this.querySelectorAll('.mt-rslider__arrow').forEach((a) =>
          a.addEventListener('click', () => this.go(this.index + Number(a.dataset.dir)))
        );
        this.track.addEventListener('scroll', () => {
          clearTimeout(this.t);
          this.t = setTimeout(() => this.mark(Math.round(this.track.scrollLeft / this.track.clientWidth)), 80);
        });
        this.mark(0);
      }
      go(i) {
        const n = this.slides.length;
        i = (i + n) % n;
        this.track.scrollTo({ left: i * this.track.clientWidth, behavior: 'smooth' });
        this.mark(i);
      }
      mark(i) {
        this.index = i;
        this.dots.forEach((d, k) => d.setAttribute('aria-current', k === i ? 'true' : 'false'));
      }
    });
  }
})();
