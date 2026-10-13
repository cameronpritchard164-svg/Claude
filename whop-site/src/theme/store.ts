// @ts-nocheck
// Store data for the theme. The product's title, photos and prices are read
// live from Whop, so changing them in the Whop dashboard updates the site.

export const WHOP_PRODUCT_ID = 'prod_63epfH2IUlzYn'
export const WHOP_PLAN_ID = 'plan_rFXSUE37gHuPi'
export const PRODUCT_HANDLE = 'clausegrab'
const API = 'https://api.whop.com/api/v1'
const CACHE_MS = 60_000

// Used if Whop can't be reached.
const FALLBACK = {
  product: {
    title: 'ClauseGrab™ Inflatable Mrs. Claus Carry Costume',
    description: '',
    gallery_images: [
      { id: 'file_C3M9zEqTHZlDb', url: 'https://img-v2-prod.whop.com/pm_xXT4ROQuf9Yh-fixkweJbX56o5wk2OHwSLfTYyWw/mb:180000/plain/https://assets-2-prod.whop.com/public/uploads/2026-10-13/411bd0db-95f6-4ab2-94f5-b2098628650e/image.jpg', content_type: 'image/png', width: 1121, height: 631 },
      { id: 'file_iN3HTRj5wDKg1', url: 'https://img-v2-prod.whop.com/ohGAhGgIThG7LFqI3B0eh9MUBSPopbWKxHhNnvOpJO8/mb:180000/plain/https://assets-2-prod.whop.com/public/uploads/2026-10-13/d668beb0-0f8f-489f-b78b-62c10eca728f/image.png', content_type: 'image/png', width: 1099, height: 618 },
    ],
  },
  plan: {
    initial_price: 99.99,
    strike_through_initial_price: 199.98,
    currency: 'usd',
    purchase_url: `https://whop.com/checkout/${WHOP_PLAN_ID}`,
  },
}

// Reads width/height from the first bytes of a PNG or JPEG so the gallery
// keeps each photo's real shape. Results are cached per URL.
const sizeCache = new Map()
async function imageSize(url) {
  if (sizeCache.has(url)) return sizeCache.get(url)
  let size = null
  try {
    const res = await fetch(url, { headers: { range: 'bytes=0-65535' } })
    const b = new Uint8Array(await res.arrayBuffer())
    if (b[0] === 0x89 && b[1] === 0x50) {
      const v = new DataView(b.buffer)
      size = { width: v.getUint32(16), height: v.getUint32(20) }
    } else if (b[0] === 0xff && b[1] === 0xd8) {
      let i = 2
      while (i + 9 < b.length) {
        if (b[i] !== 0xff) { i++; continue }
        const marker = b[i + 1]
        const len = (b[i + 2] << 8) | b[i + 3]
        if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
          size = { height: (b[i + 5] << 8) | b[i + 6], width: (b[i + 7] << 8) | b[i + 8] }
          break
        }
        i += 2 + len
      }
    }
  } catch (e) {
    console.error('image size failed', url, e)
  }
  sizeCache.set(url, size)
  return size
}

async function withSizes(product) {
  const images = (product.gallery_images || []).map((g) => ({ ...g, url: originalOf(g.url) }))
  await Promise.all(
    images.map(async (g) => {
      const size = g.url && (await imageSize(g.url))
      if (size) Object.assign(g, size)
    }),
  )
  return { ...product, gallery_images: images }
}

let cached = null
let cachedAt = 0

async function getJson(url) {
  const res = await fetch(url, { headers: { accept: 'application/json' } })
  if (!res.ok) throw new Error(`${url} -> ${res.status}`)
  return res.json()
}

export async function loadWhopData() {
  if (cached && Date.now() - cachedAt < CACHE_MS) return cached
  try {
    const [product, plan] = await Promise.all([
      getJson(`${API}/products/${WHOP_PRODUCT_ID}`),
      getJson(`${API}/plans/${WHOP_PLAN_ID}`),
    ])
    cached = { product: await withSizes(product), plan }
    cachedAt = Date.now()
  } catch (e) {
    console.error('Whop fetch failed', e)
    if (!cached) cached = FALLBACK
  }
  return cached
}

const CURRENCY_SYMBOLS = { usd: '$', aud: 'A$', cad: 'C$', gbp: '£', eur: '€', nzd: 'NZ$' }

// Whop's gallery URLs are size-capped previews wrapping the original upload
// (".../plain/<original url>"); use the original for a sharp gallery and zoom.
const originalOf = (url) => (url && url.match(/\/plain\/(https:\/\/.+)$/)?.[1]) || url

function imageFrom(g, i, title) {
  const src = originalOf(g.url || g.source_url || '')
  const width = g.width || 1200
  const height = g.height || 1200
  const image = {
    id: g.id || `img${i}`,
    src,
    url: src,
    width,
    height,
    aspect_ratio: width / height,
    alt: title,
  }
  return {
    ...image,
    media_type: 'image',
    position: i + 1,
    preview_image: image,
  }
}

export function buildStore(data, origin) {
  const { product: wp, plan } = data
  const toCents = (v) => (v == null ? null : Math.round(Number(v) * 100))
  const price = toCents(plan.initial_price)
  const compare = toCents(plan.strike_through_initial_price)
  const url = `/products/${PRODUCT_HANDLE}`

  let media = (wp.gallery_images || [])
    .filter((g) => !g.content_type || g.content_type.startsWith('image/'))
    .map((g, i) => imageFrom(g, i, wp.title)).filter((m) => m.src)
  if (!media.length) media = [imageFrom({ url: '/images/placeholder.svg', width: 1200, height: 1500 }, 0, wp.title)]

  const variant = {
    id: 1,
    title: 'Default Title',
    price,
    compare_at_price: compare,
    available: true,
    inventory_management: null,
    inventory_policy: 'continue',
    quantity_rule: { min: 1, max: null, increment: 1 },
    quantity_price_breaks: [],
    featured_media: null,
    sku: '',
    url,
    requires_shipping: true,
    unit_price_measurement: null,
    selling_plan_allocations: [],
    options: [],
    'matched?': true,
  }

  const product = {
    id: 1,
    title: wp.title,
    handle: PRODUCT_HANDLE,
    url,
    description: wp.description ? `<p>${wp.description}</p>` : '',
    vendor: 'ClauseGrab',
    type: 'Costume',
    tags: [],
    media,
    images: media,
    featured_media: media[0],
    featured_image: media[0],
    price,
    price_min: price,
    price_max: price,
    compare_at_price: compare,
    compare_at_price_min: compare,
    compare_at_price_max: compare,
    price_varies: false,
    available: true,
    has_only_default_variant: true,
    variants: [variant],
    selected_or_first_available_variant: variant,
    selected_variant: null,
    first_available_variant: variant,
    options: ['Title'],
    options_with_values: [],
    metafields: {},
    'quantity_price_breaks_configured?': false,
    requires_selling_plan: false,
    selling_plan_groups: [],
    'gift_card?': false,
  }

  const allCollection = {
    id: 1,
    title: 'Products',
    handle: 'all',
    url: '/collections/all',
    products: [product],
    products_count: 1,
    all_products_count: 1,
    description: '',
    image: null,
    featured_image: null,
  }

  const currency = (plan.currency || 'usd').toLowerCase()

  return {
    product,
    checkoutUrl: plan.purchase_url || FALLBACK.plan.purchase_url,
    currency: currency.toUpperCase(),
    currency_symbol: CURRENCY_SYMBOLS[currency] || '$',
    origin,
    host: new URL(origin).host,
    settingsOverrides: {},
    applyOverrides: (_path, data) => data,
    productByHandle: (h) => (h === PRODUCT_HANDLE ? product : null),
    collections: { all: allCollection },
    linklists: {
      'main-menu': {
        title: 'Main menu',
        handle: 'main-menu',
        levels: 1,
        links: [
          { title: 'Shop', url, handle: 'shop', links: [], levels: 0, current: false, child_active: false, child_current: false, type: 'product_link' },
          { title: 'Contact Us', url: '/pages/contact', handle: 'contact-us', links: [], levels: 0, current: false, child_active: false, child_current: false, type: 'page_link' },
        ],
      },
      footer: { title: 'Footer', handle: 'footer', levels: 1, links: [] },
    },
    shop: {
      name: 'ClauseGrab',
      url: origin,
      secure_url: origin,
      domain: new URL(origin).host,
      currency: currency.toUpperCase(),
      money_format: `${CURRENCY_SYMBOLS[currency] || '$'}{{amount}}`,
      enabled_payment_types: ['visa', 'master', 'american_express', 'paypal', 'apple_pay', 'google_pay'],
      policies: [],
      brand: {},
      'customer_accounts_enabled?': false,
      products_count: 1,
    },
    routes: {
      root_url: '/',
      cart_url: '/cart',
      cart_add_url: '/cart/add',
      cart_change_url: '/cart/change',
      cart_update_url: '/cart/update',
      cart_clear_url: '/cart/clear',
      search_url: '/search',
      predictive_search_url: '/search/suggest',
      collections_url: '/collections',
      all_products_collection_url: '/collections/all',
      product_recommendations_url: '/recommendations/products',
      account_url: '/account',
      account_login_url: '/account/login',
    },
    // Liquid treats the cart as `empty` only if it has no own keys, so the
    // fields live on the prototype.
    cart: Object.create({
      item_count: 0,
      items: [],
      total_price: 0,
      original_total_price: 0,
      items_subtotal_price: 0,
      total_discount: 0,
      cart_level_discount_applications: [],
      discount_applications: [],
      note: '',
      'empty?': true,
      requires_shipping: false,
      currency: { iso_code: currency.toUpperCase() },
      attributes: {},
    }),
  }
}
