// @ts-nocheck
// Renders the original Shopify theme (../../theme) with liquidjs so the site
// keeps the theme's exact markup and CSS. Shopify-only tags and filters are
// shimmed here; store data (product, settings, menus) comes from ./store.ts.
import { Liquid, Tag, Hash } from 'liquidjs'

const themeFiles: Record<string, string> = import.meta.glob(
  ['../../theme/**/*.liquid', '../../theme/**/*.json'],
  { query: '?raw', import: 'default', eager: true },
)
const svgAssets: Record<string, string> = import.meta.glob('../../public/assets/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
})

const file = (p: string) => themeFiles[`../../theme/${p}`]
const locale = JSON.parse(file('locales/en.default.json'))

// ---------- Colours ----------

export class Color {
  constructor(hex) {
    this.hex = hex
    const h = hex.replace('#', '')
    this.red = parseInt(h.slice(0, 2), 16)
    this.green = parseInt(h.slice(2, 4), 16)
    this.blue = parseInt(h.slice(4, 6), 16)
    this.alpha = 1
    this.rgb = `${this.red} ${this.green} ${this.blue}`
  }
  valueOf() {
    return this.hex
  }
  toString() {
    return this.hex
  }
}
const toColor = (v) => (v instanceof Color ? v : typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v) ? new Color(v) : v)
const brightness = (c) => {
  c = toColor(c)
  if (!c) return 0
  return Math.round((c.red * 299 + c.green * 587 + c.blue * 114) / 1000)
}
const shift = (c, pct) => {
  c = toColor(c)
  const f = (v) => Math.max(0, Math.min(255, Math.round(v + (pct / 100) * 255)))
  const hx = (v) => f(v).toString(16).padStart(2, '0')
  return new Color(`#${hx(c.red)}${hx(c.green)}${hx(c.blue)}`)
}

// ---------- Fonts ----------

const FONTS = {
  poppins: { family: 'Poppins', fallback_families: 'sans-serif' },
}
const font = (id) => {
  const [name, sw] = String(id).split('_')
  const base = FONTS[name] || { family: name, fallback_families: 'sans-serif' }
  return {
    ...base,
    style: sw?.[0] === 'i' ? 'italic' : 'normal',
    weight: Number(sw?.slice(1) || 4) * 100,
    'system?': false,
  }
}

// ---------- Helpers ----------

const kwargs = (args) => {
  const o = {}
  for (const a of args) if (Array.isArray(a) && a.length === 2 && typeof a[0] === 'string') o[a[0]] = a[1]
  return o
}
const escapeAttr = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
const lookup = (key) => key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), locale)
const shopifyUrl = (v) =>
  typeof v === 'string' && v.startsWith('shopify://') ? '/' + v.slice('shopify://'.length) : v

function parseSchema(src) {
  const m = src && src.match(/\{%-?\s*schema\s*-?%\}([\s\S]*?)\{%-?\s*endschema\s*-?%\}/)
  return m ? JSON.parse(m[1]) : {}
}

// ---------- Engine ----------

export function createEngine(store) {
  let posted = new Set()
  const money = (cents) => {
    const n = Number(cents || 0) / 100
    return store.currency_symbol + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const liquid = new Liquid({
    root: ['snippets'],
    partials: ['snippets'],
    extname: '.liquid',
    strictFilters: false,
    strictVariables: false,
    fs: {
      resolve: (dir, f, ext) => `${dir}/${f}${f.endsWith(ext) ? '' : ext}`,
      exists: async (p) => file(p) !== undefined,
      existsSync: (p) => file(p) !== undefined,
      readFile: async (p) => file(p),
      readFileSync: (p) => file(p),
      contains: () => true,
      sep: '/',
      dirname: (p) => p.split('/').slice(0, -1).join('/'),
    },
  })

  // Tags whose body is ignored.
  for (const name of ['schema', 'doc', 'javascript', 'stylesheet']) {
    liquid.registerTag(
      name,
      class extends Tag {
        constructor(token, remain, l) {
          super(token, remain, l)
          while (remain.length) if (remain.shift().name === 'end' + name) return
          throw new Error(`${name} not closed`)
        }
        *render() {}
      },
    )
  }

  // Tags that render their body, optionally wrapped.
  const wrapping = (name, open, close, setup) =>
    liquid.registerTag(
      name,
      class extends Tag {
        constructor(token, remain, l, parser) {
          super(token, remain, l)
          this.args = token.args
          this.tpls = []
          const stream = parser
            .parseStream(remain)
            .on('tag:end' + name, () => stream.stop())
            .on('template', (t) => this.tpls.push(t))
            .on('end', () => {
              throw new Error(`${name} not closed`)
            })
          stream.start()
          const i = this.args.search(/[a-z_]+\s*:/)
          this.hash = new Hash(i >= 0 ? this.args.slice(i) : '')
        }
        *render(ctx, emitter) {
          const hash = yield this.hash.render(ctx)
          if (setup) ctx.push(setup(this.args, hash))
          const html = yield this.liquid.renderer.renderTemplates(this.tpls, ctx)
          if (setup) ctx.pop()
          emitter.write(open(this.args, hash) + html + close)
        }
      },
    )
  wrapping('style', () => '<style>', '</style>')
  wrapping('paginate', () => '', '', () => ({ paginate: { pages: 1, current_page: 1, parts: [] } }))
  // Forms post back to the site (see site.ts); `posted` marks which form
  // types were just submitted so the theme shows its success message.
  const formType = (args) => (args.match(/'([^']+)'/) || [])[1]
  const FORM_ACTIONS = { product: '/cart/add', customer: '/contact', contact: '/contact' }
  wrapping(
    'form',
    (args, h) => {
      const type = formType(args)
      const action = FORM_ACTIONS[type] || '/'
      return `<form method="post" action="${action}"${h.id ? ` id="${escapeAttr(h.id)}"` : ''}${h.class ? ` class="${escapeAttr(h.class)}"` : ''} accept-charset="UTF-8" enctype="multipart/form-data"${h.novalidate ? ' novalidate="novalidate"' : ''}><input type="hidden" name="form_type" value="${escapeAttr(type)}">`
    },
    '</form>',
    (args) => ({ form: { errors: null, 'posted_successfully?': posted.has(formType(args)) } }),
  )

  // {% section 'name' %} and {% sections 'group' %}
  liquid.registerTag(
    'section',
    class extends Tag {
      constructor(token, remain, l) {
        super(token, remain, l)
        this.name = token.args.replace(/['"]/g, '').trim()
      }
      *render(ctx, emitter) {
        emitter.write(yield renderSection(this.name, this.name, {}, ctx))
      }
    },
  )
  liquid.registerTag(
    'sections',
    class extends Tag {
      constructor(token, remain, l) {
        super(token, remain, l)
        this.name = token.args.replace(/['"]/g, '').trim()
      }
      *render(ctx, emitter) {
        const group = store.applyOverrides(`sections/${this.name}.json`, JSON.parse(file(`sections/${this.name}.json`)))
        let out = ''
        for (const key of group.order) {
          const s = group.sections[key]
          if (s.disabled) continue
          out += yield renderSection(s.type, `sections--${this.name}__${key}`, s, ctx, `shopify-section-group-${this.name}`)
        }
        emitter.write(out)
      }
    },
  )

  // ---------- Filters ----------

  const f = (name, fn) => liquid.registerFilter(name, fn)
  f('t', function (key, ...args) {
    const vars = kwargs(args)
    let v = lookup(key)
    if (v && typeof v === 'object') v = vars.count === 1 ? v.one : v.other
    if (v == null) return key
    return String(v).replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => vars[k] ?? '')
  })
  f('asset_url', (n) => `/assets/${n}`)
  f('stylesheet_tag', (u) => `<link href="${u}" rel="stylesheet" type="text/css" media="all" />`)
  f('script_tag', (u) => `<script src="${u}" type="text/javascript"></script>`)
  f('inline_asset_content', (n) => svgAssets[`../../public/assets/${n}`] || '')
  f('image_url', (img, ...args) => {
    if (!img) return ''
    const src = typeof img === 'string' ? img : img.src || img.preview_image?.src || ''
    return src
  })
  f('img_url', (img) => (img ? (typeof img === 'string' ? img : img.src || '') : ''))
  f('image_tag', function (src, ...args) {
    const o = kwargs(args)
    const attrs = []
    attrs.push(`src="${escapeAttr(src)}"`)
    if (o.alt !== undefined) attrs.push(`alt="${escapeAttr(o.alt)}"`)
    else attrs.push('alt=""')
    for (const k of ['width', 'height', 'loading', 'class', 'sizes', 'id', 'fetchpriority']) {
      if (o[k] !== undefined && o[k] !== null && o[k] !== '') attrs.push(`${k}="${escapeAttr(o[k])}"`)
    }
    return `<img ${attrs.join(' ')}>`
  })
  f('placeholder_svg_tag', (_n, cls) => {
    return `<svg class="${escapeAttr(cls || '')}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 525.5 525.5"><rect width="525.5" height="525.5" fill="#f3f3f3"/><path d="M200 330l50-60 40 45 30-30 50 45H200z" fill="#c9c9c9"/><circle cx="310" cy="220" r="22" fill="#c9c9c9"/></svg>`
  })
  f('money', money)
  f('money_with_currency', (c) => `${money(c)} ${store.currency}`)
  f('money_without_currency', (c) => (Number(c || 0) / 100).toFixed(2))
  f('money_amount', (c) => (Number(c || 0) / 100).toFixed(2))
  f('color_brightness', brightness)
  f('color_lighten', (c, p) => shift(c, Number(p)))
  f('color_darken', (c, p) => shift(c, -Number(p)))
  f('color_to_rgb', (c) => {
    c = toColor(c)
    return `rgb(${c.red}, ${c.green}, ${c.blue})`
  })
  f('font_face', () => '')
  f('font_url', () => '')
  f('font_modify', (fnt, prop, val) => {
    if (!fnt) return fnt
    const out = { ...fnt }
    if (prop === 'weight') out.weight = val === 'bold' ? 700 : Number(val) || out.weight
    if (prop === 'style') out.style = val
    return out
  })
  f('payment_type_svg_tag', (type, ...args) => {
    const o = kwargs(args)
    return paymentSvg(type, o.class)
  })
  for (const n of [
    'payment_terms',
    'standard_event_data',
    'structured_data',
    'metafield_tag',
    'payment_button',
    'login_button',
    'external_video_url',
    'external_video_tag',
    'media_tag',
    'unit_price_with_measurement',
    'line_items_for',
  ])
    f(n, () => '')
  f('item_count_for_variant', () => 0)
  f('link_to', (text, url) => `<a href="${escapeAttr(url)}">${text}</a>`)
  f('time_tag', (d) => `<time>${d}</time>`)
  f('within', (url) => url)
  f('handleize', (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))

  // ---------- Settings ----------

  const settingsSchema = JSON.parse(file('config/settings_schema.json'))
  const settingsData = JSON.parse(file('config/settings_data.json'))
  const preset = settingsData.presets[settingsData.current]

  function resolveSetting(def, value) {
    if (value === undefined) value = def.default
    switch (def.type) {
      case 'color':
        return toColor(value) ?? null
      case 'link_list':
        return store.linklists[value] ?? null
      case 'collection':
        return value ? store.collections[value] ?? null : null
      case 'product':
        return value ? store.productByHandle(value) : null
      case 'image_picker':
      case 'video':
        return value || null
      case 'font_picker':
        return font(value)
      case 'url':
        return shopifyUrl(value) ?? null
      default:
        return value ?? null
    }
  }
  function resolveSettings(defs = [], values = {}) {
    const out = {}
    for (const d of defs) if (d.id) out[d.id] = resolveSetting(d, values[d.id])
    for (const [k, v] of Object.entries(values)) if (!(k in out)) out[k] = shopifyUrl(v)
    return out
  }

  const globalDefs = settingsSchema.flatMap((g) => g.settings || [])
  const merged = { ...preset, ...store.settingsOverrides }
  const settings = resolveSettings(globalDefs, merged)
  const schemeDef = globalDefs.find((d) => d.type === 'color_scheme_group')
  settings.color_schemes = Object.entries(merged.color_schemes).map(([id, s]) => ({
    id,
    settings: resolveSettings(schemeDef.definition, s.settings),
  }))

  // ---------- Sections ----------

  async function renderSection(type, id, data, ctx, extraClass = '') {
    const src = file(`sections/${type}.liquid`)
    if (!src) return `<!-- missing section ${type} -->`
    const schema = parseSchema(src)
    const blocks = (data.block_order || Object.keys(data.blocks || {}))
      .map((bid) => ({ bid, b: data.blocks[bid] }))
      .filter(({ b }) => b && !b.disabled)
      .map(({ bid, b }) => {
        const bdef = (schema.blocks || []).find((x) => x.type === b.type) || {}
        return { id: bid, type: b.type, settings: resolveSettings(bdef.settings, b.settings || {}), shopify_attributes: '' }
      })
    const section = {
      id,
      settings: resolveSettings(schema.settings, data.settings || {}),
      blocks,
      block_order: data.block_order || [],
    }
    // Shopify exposes global objects (settings, shop, product…) inside snippets too.
    // `section` is visible to snippets rendered from the section, as on Shopify.
    const globals = { ...(ctx ? ctx.getAll() : baseScope()), section }
    // Settings of type "liquid" (Custom Liquid blocks) are themselves Liquid.
    for (const block of blocks) {
      const bdef = (schema.blocks || []).find((x) => x.type === block.type) || {}
      for (const d of bdef.settings || []) {
        if (d.type === 'liquid' && block.settings[d.id])
          block.settings[d.id] = await liquid.parseAndRender(block.settings[d.id], { section, block }, { globals })
      }
    }
    const html = await liquid.parseAndRender(src, { section }, { globals })
    const tag = schema.tag || 'div'
    const cls = ['shopify-section', extraClass, schema.class].filter(Boolean).join(' ')
    return `<${tag} id="shopify-section-${id}" class="${cls}">${html}</${tag}>`
  }

  function baseScope() {
    return {
      settings,
      shop: store.shop,
      routes: store.routes,
      cart: store.cart,
      linklists: store.linklists,
      collections: store.collections,
      localization: { available_countries: [], available_languages: [], country: { iso_code: 'US' }, language: { iso_code: 'en' } },
      request: { locale: { iso_code: 'en' }, design_mode: false, origin: store.origin, host: store.host, page_type: 'index', path: '/' },
      content_for_header: '',
      customer: null,
      powered_by_link: '',
      canonical_url: store.origin,
      'blank': '',
    }
  }

  // Render a page template (e.g. 'product') inside layout/theme.liquid.
  async function renderPage(templateName, extra = {}) {
    posted = new Set(extra.posted_forms || [])
    const tpl = store.applyOverrides(`templates/${templateName}.json`, JSON.parse(file(`templates/${templateName}.json`)))
    const scope = {
      ...baseScope(),
      ...extra,
      template: { name: templateName, suffix: null, directory: null },
      request: { ...baseScope().request, page_type: templateName, path: extra.path || '/' },
    }
    const ctxLike = { getAll: () => scope }
    let content = ''
    for (const key of tpl.order) {
      const s = tpl.sections[key]
      if (s.disabled) continue
      content += await renderSection(s.type, `template--${templateName.replace(/[^a-z0-9]/gi, "-")}__${key}`, s, ctxLike)
    }
    return liquid.parseAndRender(file('layout/theme.liquid'), {}, { globals: { ...scope, content_for_layout: content } })
  }

  return { renderPage, settings }
}

// Simple card-style payment badges standing in for Shopify's payment icons.
const PAYMENT_LABELS = {
  visa: ['VISA', '#1A1F71', '#fff'],
  master: ['mastercard', '#fff', '#EB001B'],
  american_express: ['AMEX', '#2E77BC', '#fff'],
  paypal: ['PayPal', '#fff', '#003087'],
  apple_pay: [' Pay', '#000', '#fff'],
  google_pay: ['G Pay', '#fff', '#3C4043'],
  shopify_pay: ['shop', '#5A31F4', '#fff'],
}
function paymentSvg(type, cls = '') {
  const [label, bg, fg] = PAYMENT_LABELS[type] || [type, '#fff', '#000']
  return `<svg class="${escapeAttr(cls)}" viewBox="0 0 38 24" xmlns="http://www.w3.org/2000/svg" role="img" width="38" height="24" aria-labelledby="pi-${type}"><title id="pi-${type}">${escapeAttr(label.trim())}</title><rect x=".5" y=".5" width="37" height="23" rx="3" fill="${bg}" stroke="#000" stroke-opacity=".07"/><text x="19" y="15.5" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="${label.length > 5 ? 6.5 : 8}" fill="${fg}">${escapeAttr(label)}</text></svg>`
}
