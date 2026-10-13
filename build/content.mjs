// All store-specific content for the ClauseGrab site lives here.
// The theme files in ../shopify-theme are rendered unchanged; this file
// swaps the Shopify store data (products, settings, section text) for ours.

export const STORE_NAME = 'ClauseGrab';
export const PRODUCT_HANDLE = 'clausegrab';

// Whop checkout link for the Add to cart / Buy buttons.
// Filled in once the Whop product and plan exist.
export const CHECKOUT_URL = process.env.CHECKOUT_URL || '#checkout';

// Christmas palette: the theme's pink accent becomes Christmas red,
// with deep evergreen as the secondary colour.
export const ACCENT = '#C8102E';
export const ACCENT_2 = '#0F5132';
export const STAR = '#F5B82E';

export const product = {
  title: 'ClauseGrab™ Inflatable Mrs. Claus Carry Costume',
  handle: PRODUCT_HANDLE,
  // Prices in cents
  price: 5999,
  compare_at_price: 11999,
  description:
    '<p>The inflatable Christmas costume where a big, jolly Mrs. Claus carries you off under her arm. Your legs are her legs, the fan does the rest.</p>',
  // Gallery images. Drop real photos into build/images/ and list them here.
  images: [
    { src: '/images/product-1.svg', alt: 'ClauseGrab costume, front view', width: 1200, height: 1200 },
    { src: '/images/product-2.svg', alt: 'ClauseGrab costume, side view', width: 1200, height: 1200 },
    { src: '/images/product-3.svg', alt: 'ClauseGrab costume at a Christmas party', width: 1200, height: 1200 },
  ],
};

// Text overrides keyed by template -> section id -> settings/blocks.
// Anything not listed keeps the original theme value.
export const saleBarMessages = [
  'Christmas Sale: 50% Off Ends Soon!',
  '50% OFF TODAY ONLY!',
  'Secure & Reliable World-Wide Shipping!',
];
export const saleBarTitle = 'CHRISTMAS SALE!';

export const ORDER_BY = 'December 1';

export const productBlocks = {
  avatars: {
    pill_title: '41+ orders',
    pill_sub: 'in the last 24h',
  },
  badge: { text: "DON'T MISS OUT | TRENDING!" },
  stars: { label: 'Loved By +412 Husbands...' },
  salebox: {
    emoji: '🎄',
    title: 'CHRISTMAS SALE',
    badge: '50% OFF',
    text: `Order by ${ORDER_BY} to have it under the tree for Christmas.`,
  },
  review_slider: {
    text_1:
      '“Wore it to the work Christmas party and nobody could talk for a solid minute. The fan stands it up in about a minute and it stayed up all night. Your own legs are her legs so you can actually walk around, dance and get to the eggnog in it.”',
    name_1: '- OH, United States',
    text_2:
      '“Four hours on one set of batteries and it never sagged. My hands were free the whole night so I could hold a drink and hand out presents.”',
    name_2: '- TN, United States',
    text_3:
      '“Everything was in the box, fan, straps and instructions. Up next to the Christmas tree in about a minute.”',
    name_3: '- MI, United States',
  },
  how: {
    heading: 'How Does The Costume Work?',
    content:
      "<p>You step into Mrs. Claus's legs, so your real legs are her legs, and the fan inflates her big festive body around you. Your head comes out of the little husband's collar and your hands come out of his sleeves, while his stuffed legs dangle in front. It looks like Mrs. Claus is carrying you off under her arm. You can walk, dance and sit down in it.</p>",
  },
  ship: {
    heading: 'How Long Is Shipping?',
    content: `<p>Orders are dispatched in 1 to 3 business days and delivery is 2 to 3 weeks from dispatch (please allow up to 30 days), with tracking emailed the moment it ships. Order by ${ORDER_BY} to have it for Christmas.</p>`,
  },
  fit: {
    heading: 'Will It Fit Me?',
    content:
      "<p>One adult size fits roughly 5'3 to 6'4 (160 to 195 cm) and up to about 300 lb. The waist, ankle and wrist cuffs are elastic with adjustable straps, and the fan keeps it fully inflated whether you are 150 lb or 300 lb.</p>",
  },
  box: {
    heading: "What's In The Box And How Does It Inflate?",
    content:
      '<p>The costume, the battery fan unit with its on/off switch, adjustable straps and the instructions. Load 4 AA batteries (not included), zip in, flick the switch and it stands up in about 60 seconds. One set of batteries runs it for roughly 4 hours.</p>',
  },
};

export const faq = {
  q1: {
    heading: 'Will it arrive in time for Christmas?',
    row_content: `<p>Order by ${ORDER_BY}. Orders are dispatched in 1 to 3 business days and delivery is 2 to 3 weeks from dispatch, with tracking emailed the moment it ships.</p>`,
  },
  q2: {
    heading: 'Can I actually move around in it?',
    row_content:
      "<p>Yes. Your real legs are Mrs. Claus's legs, so you can walk, dance, sit down and get to the eggnog. Your hands come out of the husband's sleeves, so you can hold a drink or hand out presents.</p>",
  },
  q3: {
    heading: 'How long do the batteries last?',
    row_content:
      '<p>One set of 4 AA batteries (not included) runs the fan for roughly 4 hours. Bring a spare set for a long Christmas party.</p>',
  },
  q4: {
    heading: "What if it turns up damaged or the fan doesn't work?",
    row_content:
      "<p>Send us a photo and we'll sort it out. You've got 30 days to return it for a refund, and if the fan or costume is faulty we'll replace it.</p>",
  },
};

export const reviews = {
  r1: {
    title: '"Wore it for four hours straight"',
    text: '“Wore it to our street Christmas party. Your real hands are free so you can hold a drink and shake hands. Four hours on one set of batteries and it never sagged.”',
    name: 'Travis M.',
    location: 'Knoxville, TN',
  },
  r2: {
    title: '"Everything was in the box, up in a minute"',
    text: '“Costume, fan, straps, instructions. Four batteries in and it stood up next to the tree in about a minute. The little husband is way more detailed than I expected for an inflatable.”',
    name: 'Cody R.',
    location: 'Grand Rapids, MI',
  },
  r3: {
    title: '"My actual wife could not breathe"',
    text: '“Walked into Christmas lunch deadpan with Mrs. Claus carrying me and she had to hold on to the table to stay standing. The grandkids would not leave me alone all afternoon.”',
    name: 'Dale H.',
    location: 'Billings, MT',
  },
};

export const preorder = {
  heading: 'BEFORE YOU ORDER (please read)',
  text: `<p>Orders are dispatched in 1 to 3 business days and delivery takes 2 to 3 weeks from dispatch, so order by ${ORDER_BY} to have it for Christmas.</p><p>Every costume is checked before it ships, and every order is covered by our 30-day money-back guarantee.</p>`,
};

export const homeBanner = {
  heading: 'Browse our latest products',
  button_label_1: 'Shop all',
};
