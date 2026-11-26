/** Policy copy — placeholder text the owner should review (see README "Decisions to confirm"). */
export const POLICIES: Record<string, { title: string; urdu: string; updated: string; sections: { h: string; p: string[] }[] }> = {
  shipping: {
    title: "Shipping & Delivery",
    urdu: "ترسیل",
    updated: "November 2026",
    sections: [
      { h: "Where we deliver", p: ["We deliver to every city in Pakistan through trusted courier partners. We do not ship internationally yet — for overseas orders, please message us on WhatsApp."] },
      { h: "Delivery times", p: ["Ready-to-wear pieces are dispatched within 5–7 working days of order confirmation.", "Made-to-order and custom-stitched pieces take 2–4 weeks, as each is embroidered and finished by hand. Bridal timelines are confirmed individually."] },
      { h: "Charges", p: ["A flat delivery charge of Rs. 250 applies to all orders. Delivery is complimentary on orders of Rs. 15,000 and above."] },
      { h: "Cash on Delivery", p: ["All orders are Cash on Delivery. Our team confirms every order by phone or WhatsApp before dispatch. Orders we cannot confirm after three attempts may be cancelled.", "Please keep the exact amount ready; couriers may not carry change."] },
    ],
  },
  exchange: {
    title: "Exchange & Returns",
    urdu: "تبادلہ",
    updated: "November 2026",
    sections: [
      { h: "Exchanges", p: ["Ready-to-wear pieces can be exchanged for a different size or another piece of equal or higher value within 7 days of delivery.", "Pieces must be unworn, unwashed, with tags and original packaging."] },
      { h: "Final sale", p: ["Custom-stitched, made-to-order, bridal and sale pieces are final sale and cannot be exchanged or returned, unless they arrive damaged."] },
      { h: "Damaged or incorrect items", p: ["If your parcel arrives damaged or incorrect, please WhatsApp us photos within 48 hours of delivery and we'll make it right at no cost to you."] },
      { h: "How to request an exchange", p: ["Message us on WhatsApp or use the contact form with your order number. We'll arrange a pickup or share the return address. Reverse shipping for size exchanges is Rs. 250."] },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    urdu: "رازداری",
    updated: "November 2026",
    sections: [
      { h: "What we collect", p: ["When you place an order we collect your name, phone number, delivery address and, optionally, your email and measurements. We store a one-way hash of your IP address to protect against fake orders."] },
      { h: "How we use it", p: ["Only to confirm, deliver and support your order, and — if you subscribe — to send occasional letters about new collections. We never sell your data."] },
      { h: "Who we share it with", p: ["Your delivery details are shared with our courier partner to deliver your parcel. Our database and email providers process data on our behalf."] },
      { h: "Your choices", p: ["You can ask us to correct or delete your details at any time via the contact page. Your bag and wishlist are stored only in your browser."] },
    ],
  },
  terms: {
    title: "Terms of Service",
    urdu: "شرائط",
    updated: "November 2026",
    sections: [
      { h: "Hand-made pieces", p: ["Every piece is embroidered by hand. Small variations in colour, motif placement and finish are part of the craft and not defects. Colours may vary slightly between screens."] },
      { h: "Pricing", p: ["Prices are in Pakistani Rupees and include applicable taxes. Prices and discounts are confirmed at the moment you place your order."] },
      { h: "Orders", p: ["We reserve the right to decline or cancel orders we cannot confirm, orders with incorrect information, or orders suspected to be fraudulent."] },
      { h: "Contact", p: ["Questions about these terms? Reach us through the contact page or on WhatsApp."] },
    ],
  },
};

export const FAQS: { q: string; a: string }[] = [
  { q: "How does Cash on Delivery work?", a: "Place your order online — no card needed. Our team confirms it with you by phone or WhatsApp, then dispatches it. You pay the courier in cash when your parcel arrives." },
  { q: "How long will my order take?", a: "Ready-to-wear pieces arrive in 5–7 working days. Made-to-order and custom-stitched pieces take 2–4 weeks because they are embroidered by hand." },
  { q: "Do you deliver to my city?", a: "Yes — we deliver to every city and town in Pakistan. Delivery is Rs. 250, and free on orders of Rs. 15,000 and above." },
  { q: "Can I get a piece stitched to my measurements?", a: "Yes. Choose “Custom Stitching” on the product page and enter your measurements. Custom pieces are made to order and are final sale." },
  { q: "What if the size doesn't fit?", a: "Ready-to-wear pieces can be exchanged within 7 days of delivery, unworn and with tags. See our exchange policy for details." },
  { q: "Is the embroidery really done by hand?", a: "Every Tanzaib piece is traced and embroidered by hand on the adda by master karigars — zardozi, tilla, dabka, resham, mirror and gota work. Each product lists the approximate hours of hand work." },
  { q: "How do I care for hand-embroidered clothes?", a: "Dry clean only, iron on the reverse on low heat, and store folded in muslin away from damp. Never spray perfume directly on embroidery." },
  { q: "Can I order on WhatsApp instead?", a: "Of course. Every product page has an “Order on WhatsApp” button, or tap the WhatsApp icon at the bottom of any page." },
];
