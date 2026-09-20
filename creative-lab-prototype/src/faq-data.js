// Original FAQ copy from https://www.meshy.ai/creative-lab, verified 2026-09-20.
// Retained verbatim for the authorized Meshy test, regrouped by topic.
export const faqGroups=[
  {id:'getting-started',title:'Getting Started',items:[
    ['What is Meshy Creative Lab?','Creative Lab turns your ideas into custom 3D creations — keychains, figurines, lamps, keycaps, fridge magnets, fidgets, and more. Design with AI, then download to 3D-print at home, or have us print and ship it to you.'],
    ['Do I need any 3D modeling experience?','No. Upload a photo or describe what you want, and our AI handles the 3D design for you.'],
    ['Is Creative Lab free to use?',"Designing uses your Meshy credits — no extra fee. If you order a physical item, you'll see its price before you pay."],
    ["How is Creative Lab different from Meshy's other tools?","Meshy's core tools (Image to 3D, Text to 3D) give full control to build any model. Creative Lab is curated, ready-to-make objects you personalize and turn into real things, fast."],
    ['Is Creative Lab still in beta?',"Creative Lab is in beta — we're actively adding products and features, and your feedback shapes what's next. Join our Discord to share ideas.",'https://discord.com/invite/KgD5yVM9Y4','Discord']
  ]},
  {id:'files-printing',title:'Files & Printing',items:[
    ['What file formats do I get?','You can download your design in standard 3D-printing formats (3MF and STL), ready for any 3D printer or slicer.'],
    ['Will it print well on my 3D printer?','The downloaded 3MF/STL files work with any FDM or resin 3D printer or slicer.'],
    ['Can I edit the file before printing?','Yes. Once downloaded, the file is yours to modify, remix, or scale in any 3D software like Blender — see our Terms of Use for usage rights.','https://www.meshy.ai/terms-of-use','Terms of Use']
  ]},
  {id:'orders-delivery',title:'Orders & Delivery',items:[
    ['How long does shipping take?','Most orders are made and shipped within 7–10 days. Delivery time depends on your location — you will see an estimate at checkout.'],
    ['Where do you ship?','We currently ship to 9 countries: the United States, Canada, Germany, Spain, France, Italy, Brazil, China, and Japan. More regions are coming.'],
    ['What materials do you print in?','Materials vary by product. Our keychains, for example, pair a full-color or UV-printed resin badge with a genuine leather case. Each item lists its material and finish on its product page.'],
    ['How much does shipping cost?','Shipping is free — no coupon codes, no hidden fees. The price you see is delivered to your door.'],
    ['Can I cancel or get a refund?','You can cancel within 24 hours of placing your order. After that, contact support from your order page to arrange a refund.']
  ]},
  {id:'photos-rights',title:'Photos & Usage Rights',items:[
    ['Can I use a photo of myself or someone else?',"Yes — for products like figurines, you can upload a photo to personalize your creation. Only upload photos of yourself or people who've given you permission."],
    ['Who owns the designs I create?','You own the rights to use your custom designs for personal purposes. Commercial use is covered in our Terms of Use.','https://www.meshy.ai/terms-of-use','Terms of Use'],
    ['Can I sell what I create?','Personal use is always included. For commercial or reseller use, see our Terms of Use or contact us about licensing.','https://www.meshy.ai/terms-of-use','Terms of Use']
  ]}
];

// Every keyword must match the question, answer or topic; preserve the original grouping.
export function filterFaqGroups(query = '', topic = 'all') {
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return faqGroups
    .filter(group => topic === 'all' || group.id === topic)
    .map(group => ({
      ...group,
      items: group.items.filter(([question, answer]) => {
        const text = `${group.title} ${question} ${answer}`.toLowerCase();
        return words.every(word => text.includes(word));
      })
    }))
    .filter(group => group.items.length);
}
