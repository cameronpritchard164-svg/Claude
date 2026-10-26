// @ts-nocheck
// Store policies shown at /pages/refund-policy and /pages/shipping.
// Written for the product sold on this store.

const EMAIL = 'forgerelic@outlook.com'

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
const h2 = (t) => `<h2>${esc(t)}</h2>`
const h3 = (t) => `<h3>${esc(t)}</h3>`
const p = (t) => `<p>${t}</p>`
const ul = (items) => `<ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul>`
const ol = (items) => `<ol>${items.map((i) => `<li>${i}</li>`).join('')}</ol>`
const mail = `<a href="mailto:${EMAIL}">${EMAIL}</a>`

export function policyPages({ store, product, season, updated = '12 September 2026' }) {
  const refund = [
    p(`<strong>Last updated: ${esc(updated)}</strong>`),
    p(`Please read this policy in full before placing your order. By completing a purchase on ${esc(store)} you confirm that you have read, understood and agreed to every term set out below. Placing an order is your acceptance of this policy.`),

    h2('1. All sales are final'),
    p(`<strong>All sales on this store are final.</strong>`),
    p(`Unless you purchased the optional <strong>30-Day Money-Back Guarantee</strong> at checkout (see Section 2), we do not offer refunds, returns, exchanges, cancellations or store credit for change of mind. This includes, without limitation, situations where:`),
    ul([
      'you no longer want the item',
      'you found it cheaper elsewhere',
      'you ordered the wrong quantity or add-on',
      `your ${esc(season)} event was cancelled, postponed or has passed`,
      'you did not read the product description, sizing or delivery timeframe before ordering',
      'a family member, partner or housemate objected to the purchase',
      'your financial situation changed after ordering',
      'you were gifted a duplicate',
      'you simply changed your mind for any other reason',
    ]),
    p(`The only other circumstances in which a refund or replacement is issued are set out in <strong>Section 5 (Damaged, Defective or Incorrect Items)</strong>.`),

    h2('2. Optional 30-Day Money-Back Guarantee'),
    p(`The 30-Day Money-Back Guarantee is an optional add-on offered at checkout. Where it was purchased with your order and appears on your receipt:`),
    ul([
      'you may return the item for a refund of the item price for any reason within <strong>30 days of the delivery date</strong> recorded by the carrier',
      'the item must be <strong>unused, undamaged, clean</strong> and returned in its original packaging',
      'you must request a Return Authorisation by email before sending anything back (see Section 6)',
      'return shipping is at your cost unless the return is due to our error',
      'the add-on fee itself, original shipping (where charged) and any other add-ons are non-refundable',
    ]),
    p(`Without this add-on, change-of-mind returns are not available.`),

    h2('3. Dispatch, delivery and your responsibilities'),
    p(`Every item is <strong>made to order</strong>, so it is produced after you pay and then shipped. We do not promise a fixed dispatch or delivery date; any timeframe we mention is an estimate only. Please order early for ${esc(season)}: a delay within or reasonably beyond this window is not a failure to deliver and is not grounds for a refund or cancellation. Full delivery terms are in our <a href="/pages/shipping">Shipping Policy</a>.`),
    h3('3.1 Orders cannot be cancelled'),
    p(`Once payment is processed your order goes into production and <strong>cannot be cancelled, amended or refunded</strong>. Requests to cancel will be declined.`),
    h3('3.2 Delivery address accuracy is your responsibility'),
    p(`You are responsible for entering a complete and correct delivery address. We are not liable and <strong>no refund or replacement will be issued</strong> where:`),
    ul([
      'the address supplied was incorrect, incomplete or outdated',
      'the recipient name was wrong or unrecognised at the address',
      'delivery failed because nobody was available to receive the item',
      'the parcel was refused, returned to sender or abandoned',
      'the parcel was held by the carrier and not collected within their holding period',
      'the parcel was marked delivered by the carrier and subsequently went missing from the delivery location, was stolen, or was taken by another person (unless you purchased Shipping Protection, see Section 4)',
    ]),
    p(`If an address correction is required after dispatch, or a parcel is returned to sender due to an address error, any re-delivery, re-shipping or storage fees are payable by you.`),

    h2('4. Optional Shipping Protection'),
    p(`Shipping Protection is an optional add-on offered at checkout. Where it was purchased with your order and appears on your receipt, we will send a <strong>free replacement</strong> (or, at our discretion, a refund) where your parcel is:`),
    ul([
      'formally declared lost by the carrier',
      'recorded as delivered but confirmed missing from the delivery location, reported to us within 48 hours of the delivery scan',
      'damaged in transit, reported with the evidence in Section 5',
    ]),
    p(`Without this add-on, parcels recorded as delivered by the carrier are not covered.`),

    h2('5. Damaged, defective or incorrect items'),
    p(`We stand behind our product. If your item arrives damaged, faulty or incorrect we will make it right.`),
    h3('5.1 Inspect on arrival'),
    p(`<strong>You must inspect your order immediately upon delivery.</strong> Unpack the item and check the hammer, water tank, lights and power cable.`),
    h3('5.2 Report within 48 hours'),
    p(`All damage, defect and incorrect-item claims must be submitted to <strong>${mail} within 48 hours of the delivery timestamp recorded by the carrier.</strong> Claims submitted after 48 hours will not be accepted, because we cannot verify whether the damage occurred in transit or after delivery while the item was in your possession.`),
    h3('5.3 Evidence required'),
    p(`A claim cannot be assessed and will not be approved unless <strong>all</strong> of the following are supplied in your first email:`),
    ul([
      'your <strong>order number</strong>',
      '<strong>clear, well-lit photographs of the damage or fault</strong>, in focus, showing the affected area close up',
      'a <strong>wider photograph</strong> showing the damaged part in the context of the whole item',
      '<strong>photographs of the outer shipping bag or carton</strong>, including any tears, crush or water damage',
      'a <strong>photograph of the shipping label</strong>',
      'for a mist, light or power fault, a <strong>short video</strong> clearly showing the fault',
      'for an incorrect item, <strong>photographs of the item received</strong> alongside the label',
    ]),
    p(`Incomplete claims will be returned to you for the missing evidence. The 48-hour window applies to your initial claim, not to the completion of your evidence, provided you respond to our follow-up requests within 5 days.`),
    h3('5.4 Keep the packaging'),
    p(`<strong>Do not discard any packaging until your claim is fully resolved.</strong> Carriers require original packaging to process a damage claim. Disposing of the packaging before your claim closes will void the claim.`),
    h3('5.5 Assessment and outcome'),
    p(`We will acknowledge your claim within 2 business days and issue a decision within 5 business days of receiving complete evidence. Where a claim is approved, <strong>we choose the remedy at our discretion</strong>, being one of:`),
    ul(['dispatch of a free replacement unit', 'dispatch of a free replacement unit', 'a partial refund proportionate to the fault, where the item remains usable', 'a full refund']),
    p(`Where a replacement part resolves the fault, a replacement part is the remedy provided. A full refund is not automatic.`),
    h3('5.6 What is not a defect'),
    p(`The following are expressly <strong>not</strong> defects and will not be accepted as a damage claim:`),
    ul([
      'minor variation in colour, print alignment or shade from the product photography, including differences caused by screen calibration',
      'minor paint or colour variation on the figure',
      'small cosmetic marks, loose threads or packing residue that cleans off',
      'minor packaging damage where the item inside is undamaged',
      'small differences in size or shape within normal manufacturing tolerance',
      'water or washer fluid not included with the product',
      'loss or damage from running the item without water, using liquids other than clean water, or dropping it',
      'the suction cup not holding on dirty, wet, curved or tinted-film surfaces',
      'damage to vehicles, paintwork or other property; you are responsible for safe placement that does not block your view or lights, and for complying with local road rules',
      'damage caused by washing in a machine, tumble drying, ironing or using solvents',
      'normal wear and tear after use',
    ]),

    h2('6. Returns process (approved claims and Guarantee returns only)'),
    p(`<strong>Do not send anything back without a Return Authorisation.</strong> Items returned without prior written authorisation will not be accepted, will not be refunded, and will be disposed of after 14 days.`),
    ol([
      `Email <strong>${mail}</strong> with your order number and, for a damage claim, the evidence listed in Section 5.3.`,
      'If approved, we will issue a <strong>Return Authorisation (RA) number</strong> together with written return instructions and the return destination. The return destination is supplied only with an approved RA and is not published.',
      'The item must be returned <strong>in its original packaging</strong>, in the condition it was received.',
      'The RA number must be clearly marked on the outside of the parcel.',
      'Returns must be dispatched <strong>within 7 days</strong> of the RA being issued. RAs expire after 7 days.',
      'For approved damage, defect and incorrect-item claims, <strong>we cover return shipping.</strong> In all other cases, including Guarantee returns, return shipping is at your cost and is non-refundable.',
    ]),
    p(`Returned items are inspected on arrival. Where an item is returned incomplete, without original packaging, with damage beyond that reported, showing signs of wear, or outside the RA window, we may decline the refund entirely or apply a deduction reflecting the loss in value.`),

    h2('7. Non-returnable items'),
    p(`The following cannot be returned or refunded under any circumstances:`),
    ul([
      'items purchased on sale, clearance or with a promotional discount code, except under an approved claim in Section 5',
      'items reported outside the 48-hour damage window',
      'items returned without a valid Return Authorisation',
      'items that have been used, absent an approved defect claim',
      'items damaged after delivery',
      'checkout add-ons, where offered, which hold no independent refund value',
    ]),

    h2('8. Exchanges'),
    p(`We do not operate an exchange programme. Where a replacement is warranted under an approved claim in Section 5, a replacement will be issued directly.`),

    h2('9. Refund processing'),
    p(`Where a refund has been formally approved in writing by us:`),
    ul([
      'refunds are issued to the <strong>original payment method only.</strong> We cannot refund to a different card, account or person.',
      'refunds are processed <strong>within 10 business days of approval</strong>, or within 10 business days of our receipt and inspection of an authorised return where a return was required.',
      'your bank or card issuer may take a further <strong>5 to 10 business days</strong> to post the funds. This period is outside our control.',
      'where a discount, bundle price or promotional rate was applied, the refund is calculated on the <strong>amount actually paid</strong>, not the compare-at price.',
      'where part of a bundle is refunded, the remaining units are re-priced at their standard individual rate and the refund is adjusted accordingly.',
    ]),
    p(`If more than <strong>15 business days</strong> have passed since we confirmed your refund in writing and you have not received it, contact ${mail} with your order number.`),

    h2('10. Payment disputes and chargebacks'),
    p(`<strong>You agree to contact us at ${mail} and allow us a reasonable opportunity to resolve any issue before initiating a chargeback, payment dispute or claim with your bank, card issuer or payment provider.</strong>`),
    ul([
      'a delay within or reasonably beyond the disclosed delivery window is <strong>not</strong> a valid basis for a dispute',
      'a change of mind is <strong>not</strong> a valid basis for a dispute',
      'where a dispute is raised, we will supply the payment provider with full evidence, including your order record, timestamped proof of your acceptance of these terms at checkout, the full communication history and carrier tracking and delivery confirmation',
      'raising a fraudulent or bad-faith dispute, including a dispute claiming non-receipt of goods confirmed as delivered by the carrier, may result in the loss of any remedy otherwise available to you under Section 5',
      'accounts associated with fraudulent disputes may be blocked from placing future orders',
    ]),
    p(`Contacting us first is always faster than a dispute, and in almost every genuine case we resolve it directly.`),

    h2('11. How to contact us'),
    p(`All claims, returns and refund enquiries must be submitted by email to <strong>${mail}</strong>. Please include your <strong>order number</strong> in the subject line. We respond to all enquiries within <strong>24 to 48 hours</strong> on business days. Claims submitted through social media comments or direct messages are not monitored for claim purposes and do not satisfy the notification requirements in this policy.`),

    h2('12. Changes to this policy'),
    p(`We may update this policy at any time. The version published on this page at the time you place your order is the version that governs your purchase. We recommend saving or printing a copy with your order confirmation.`),
  ].join('\n')

  const shipping = [
    p(`<strong>Last updated: ${esc(updated)}</strong>`),
    p(`Please read this policy in full before placing your order. By completing a purchase on ${esc(store)} you confirm that you have read, understood and agreed to every term set out below.`),

    h2('1. Dispatch and delivery times'),
    p(`Your ${esc(product)} is <strong>made to order</strong>. It is produced after you pay and shipped once it is ready, so we do not promise a fixed dispatch or delivery date. Any timeframe we give is an estimate only. Business days are Monday to Friday, excluding public holidays.`),
    p(`By completing your purchase you expressly acknowledge and agree that:`),
    ul([
      'production and delivery times are estimates, not guaranteed dates',
      'delivery may take longer than estimated for reasons set out in Section 6',
      `you have ordered with enough time before your ${esc(season)} event, and a delivery after the event is not grounds for cancellation or a refund`,
      'a delay within, or reasonably beyond, this window is not a failure to deliver and is not grounds for cancellation or a refund',
    ]),
    p(`If the delivery window does not suit you, please do not place an order.`),
    h3('1.1 Orders cannot be cancelled or amended'),
    p(`Once payment is processed your order goes into production and cannot be cancelled, amended, paused or refunded. This includes requests made minutes after ordering. Requests to cancel will be declined.`),

    h2('2. Delivery address: your responsibility'),
    p(`You are responsible for supplying a complete, correct and current delivery address. Please check it carefully before paying, including unit or apartment number, street name, suburb or city, state or region and postcode.`),
    p(`We cannot guarantee that an address change can be made after an order is placed. If a change is possible it must be requested in writing to ${mail} immediately, and it cannot be made once the order has been dispatched.`),
    p(`We are not liable, and no refund or free replacement will be issued, where:`),
    ul([
      'the address supplied was incorrect, incomplete or outdated',
      'the recipient name was wrong or unrecognised at the address',
      'delivery failed because nobody was available to receive the item',
      'the parcel was refused by the recipient',
      "the parcel was held at a depot or collection point and not collected within the carrier's holding period",
      'the parcel was returned to sender for any of the reasons above',
      'the parcel was recorded as delivered by the carrier and subsequently went missing from the delivery location, was stolen, or was taken in by another person (unless you purchased Shipping Protection)',
    ]),
    p(`Where an address correction, re-delivery, depot storage or re-shipment is required as a result of an error on your side, those costs are payable by you before the item is sent again.`),

    h2('3. Shipping rates and free shipping'),
    p(`Shipping is <strong>free</strong> on every order and is shown as free at checkout before payment. Where a shipping charge ever applies, it is displayed before payment and is non-refundable except where an entire order is refunded due to our error.`),

    h2('4. Tracking'),
    p(`You will receive a shipping confirmation email with a tracking number once your order leaves our facility.`),
    ul([
      'tracking can take 2 to 5 business days to show its first scan after the email is sent, which is normal and does not mean the parcel is lost',
      'tracking is updated by the carrier, not by us, and we have no ability to change or speed up carrier scans',
      `if your tracking has not updated for 10 or more consecutive business days, email ${mail} with your order number and we will open an enquiry with the carrier`,
      'always check your junk and promotions folders before contacting us about a missing confirmation email',
    ]),

    h2('5. Delivery and handover'),
    h3('5.1 Someone should be available'),
    p(`Where nobody is available, the carrier may leave the parcel in a safe place at their discretion, leave a card, or return it to a depot. Depot storage and re-delivery fees, if charged by the carrier, are payable by you.`),
    h3('5.2 Inspect on arrival'),
    p(`Inspect your delivery immediately and check the hammer, water tank, lights and power cable. Any damage, defect or incorrect item must be reported to ${mail} within 48 hours of the delivery timestamp recorded by the carrier, with the photographic evidence set out in our <a href="/pages/refund-policy">Refund &amp; Return Policy</a>. Do not discard the packaging until any claim is fully resolved.`),
    h3('5.3 Multiple parcels'),
    p(`Bundle orders of two or more units may ship in more than one parcel, may leave on different dates and may arrive on different days. Receiving part of your order does not mean the remainder is lost. Each parcel has its own tracking number.`),

    h2('6. Delays outside our control'),
    p(`Delivery estimates are not guarantees. Delays may occur for reasons outside our reasonable control, including:`),
    ul([
      'freight capacity shortages, flight rescheduling and port congestion',
      'customs inspection, clearance backlogs and border processing',
      'carrier delays, depot backlogs, misrouting and failed delivery attempts',
      `peak seasonal volume, including ${esc(season)}, Black Friday and the Christmas and New Year period`,
      'public holidays in the country of origin or destination',
      'severe weather, natural disasters, strikes, civil disruption and other force majeure events',
      'incorrect or incomplete address details supplied at checkout',
    ]),
    p(`Delays of this kind are not grounds for cancellation or a refund. We will keep you updated and we will work with the carrier to resolve any issue.`),

    h2('7. Lost parcels'),
    p(`A parcel is treated as lost only once the carrier has formally declared it lost following an enquiry.`),
    ul([
      'enquiries are opened once tracking has shown no movement for 10 or more consecutive business days',
      'carrier investigations commonly take 10 to 20 business days to conclude',
      'where a parcel is formally declared lost in transit, we will send a free replacement at our cost',
      'where tracking confirms delivery, the parcel is not treated as lost. Items recorded as delivered and subsequently missing from the delivery location are not covered unless you purchased Shipping Protection at checkout, and should be reported to the carrier and, where relevant, to your local authorities',
    ]),

    h2('8. Customs, duties and import taxes'),
    p(`For international orders:`),
    ul([
      'any customs duties, import taxes, brokerage fees, handling fees or levies charged by the destination country are payable by you and are not included in the price',
      'these charges are set by your government and its carriers, and we have no control over the amount and cannot predict or refund it',
      'refusing to pay import charges is not grounds for a refund. Where a parcel is returned to sender or destroyed by customs because charges were unpaid or the parcel was refused, no refund is issued',
      'you are responsible for ensuring the item may lawfully be imported into your country',
    ]),

    h2('9. Undeliverable and returned-to-sender parcels'),
    p(`Where a parcel is returned to us as undeliverable, we will contact you at the email supplied with your order. You may choose to have it re-sent, with re-shipping costs payable by you. If we receive no response within 14 days of contacting you, the order is treated as abandoned and no refund is issued.`),

    h2('10. Order changes and duplicate orders'),
    ul([
      'quantity, bundle and add-on selections cannot be changed once an order is placed',
      `if you believe you have placed a duplicate order in error, email ${mail} within 1 hour of ordering. We will try to help, but we cannot guarantee a duplicate can be stopped once it has been dispatched`,
    ]),

    h2('11. Payment disputes and chargebacks'),
    p(`You agree to contact us at ${mail} and allow us a reasonable opportunity to resolve any shipping issue before initiating a chargeback, payment dispute or claim with your bank, card issuer or payment provider.`),
    ul([
      'a delay within, or reasonably beyond, the disclosed delivery window is not a valid basis for a dispute',
      'an unclaimed, refused or incorrectly addressed parcel is not a valid basis for a dispute',
      'a parcel confirmed as delivered by carrier tracking is not a valid basis for a non-receipt dispute',
      'where a dispute is raised, we will supply the payment provider with full evidence, including your order record, timestamped proof of your acceptance of these terms at checkout, the full communication history, and carrier tracking and delivery confirmation',
      'accounts associated with fraudulent or bad-faith disputes may be blocked from placing future orders',
    ]),
    p(`Contacting us first is always faster than a dispute, and in almost every genuine case we resolve it directly.`),

    h2('12. How to contact us'),
    p(`All shipping, tracking and delivery enquiries should be emailed to <strong>${mail}</strong>. Please include your order number in the subject line. We respond to all enquiries within 24 to 48 hours on business days. Enquiries sent through social media comments or direct messages are not monitored and do not satisfy the notification requirements in this policy or in our Refund &amp; Return Policy.`),

    h2('13. Changes to this policy'),
    p(`We may update this policy at any time. The version published on this page at the time you place your order is the version that governs your purchase. We recommend saving or printing a copy with your order confirmation.`),
  ].join('\n')

  return {
    '/pages/refund-policy': { title: 'Refund & Return Policy', handle: 'refund-policy', url: '/pages/refund-policy', content: refund },
    '/pages/shipping': { title: 'Shipping Policy', handle: 'shipping', url: '/pages/shipping', content: shipping },
  }
}
