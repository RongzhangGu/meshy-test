// All 16 original FAQ topics, regrouped by task. Sources and policy differences: CONTENT-AUDIT.md.
export const faqGroups=[
  {id:'getting-started',title:'Getting started',items:[
    ['What can I do in Creative Lab?','Personalize a ready-to-make object, then choose an available download or delivery option.'],
    ['Do I need to know how to model in 3D?','No modeling skills are required. Start with a reference image or a description; Meshy creates the model.'],
    ['What does it cost to design?','Generation consumes Meshy credits without an additional design fee. Physical orders are priced separately.'],
    ['How does the Lab differ from the other Meshy tools?','The Lab offers curated object templates. The main toolkit supports more open-ended modeling and editing.'],
    ['Is this a beta product?','Yes. The catalogue and features are still expanding. Share feedback through Meshy’s community.','https://discord.com/invite/KgD5yVM9Y4','Join the community']
  ]},
  {id:'files-printing',title:'Files & printing',items:[
    ['Which formats can I download?','Printable exports include STL and 3MF. Check the download options for your chosen creation.'],
    ['Can I use my own 3D printer?','FDM and resin workflows are supported. Open the exported file in a compatible slicer and check the model before printing.'],
    ['Can I change a model before printing it?','Yes. Download an editable 3D file to resize or refine in software such as Blender. Usage remains subject to Meshy’s terms.','https://www.meshy.ai/terms-of-use','Read usage terms']
  ]},
  {id:'orders-delivery',title:'Orders & delivery',items:[
    ['When should I expect my order?','Made-to-order keychains normally ship after 7–10 days. Transit time is additional; check the delivery estimate at checkout.'],
    ['Is delivery available in my country?','Check your chosen product and enter your destination at checkout to confirm delivery availability.','https://www.meshy.ai/creative-lab','Check product availability'],
    ['What is the finished object made from?','Materials and finishes depend on the item. Consult the product specification before ordering.'],
    ['Is shipping charged separately?','The Lab currently advertises delivery included. Confirm the final total at checkout.'],
    ['How do cancellations and refunds work?','The Lab lists a 24-hour cancellation window. After that, use the order page to contact support about a refund.','https://help.meshy.ai/en/','Get order support']
  ]},
  {id:'photos-rights',title:'Photos & usage rights',items:[
    ['Whose photos can I upload?','Use your own photos, or photos you have permission to use. You must hold the necessary rights to the input.'],
    ['What rights do I have to my designs?','Design rights depend on Meshy’s terms and your source material. Review the current terms for your intended use.','https://www.meshy.ai/terms-of-use','Review design rights'],
    ['May I sell the objects I create?','Check commercial and reseller permissions before selling. Meshy’s team can help with licensing and business arrangements.','https://www.meshy.ai/terms-of-use','Check commercial terms']
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
