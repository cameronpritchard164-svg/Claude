// Store + passcodes — the only file you must edit.
export const STORE = {
  // Your Whop business ID. Run `whop accounts list` to see it (starts with biz_).
  account_id: 'biz_CHANGE_ME',
  // Your store name, shown on the login page and header.
  name: 'MyStore',
  // What you sell, shown on every order and in the CSV.
  product: 'My Product',
}

// Change both before deploying. Or override them later without touching code:
//   whop apps secrets set --secret OWNER_PASS=... --secret SUPPLIER_PASS=...
export const PASSCODES = {
  // Store owner: sees everything (emails, totals, refunds, full CSV).
  owner: 'change-me-owner',
  // Supplier: sees names, addresses, quantities; adds tracking numbers. Cannot see money or refund.
  supplier: 'change-me-supplier',
}

// Optional: lets the supplier's ERP (Dianxiaomi / 店小秘, or anything that connects to
// WooCommerce) pull orders and push tracking automatically. In 店小秘 add a WooCommerce store
// (REST API 授权) with your site URL and these two keys. Make them long and random.
export const WOOCOMMERCE = {
  consumer_key: 'ck_CHANGE_ME_long_random',
  consumer_secret: 'cs_CHANGE_ME_long_random',
}
