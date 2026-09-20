// Create-step controls verified on the public Meshy tools, 2026-09-18.
const photoExamples = (id, labels) =>
  labels.map((label, index) => ({ label, image: `${id}-inspiration-${index + 1}` }));
const figureLabels = [
  'Girl with a Pearl Earring',
  'Portrait with a pet',
  'Anime character',
  'Dog',
  'The Scream',
];
// Chibi and Vinyl use the same five original source photos.
const figureExamples = photoExamples('figure', figureLabels);
const modelExamples = (id) =>
  Array.from({ length: 9 }, (_, index) => ({
    label: `Example ${index + 1}`,
    image: `${id}-inspiration-${index + 1}`,
  }));
const batch = { defaultCount: 4, maxCount: 8, credits: 6, duration: '1 min', maxMB: 10 };
const model = { defaultCount: 1, credits: 30, duration: '1 min', maxMB: 20, exampleKind: 'model' };

export const creationSettings = {
  keychain: {
    ...batch,
    examples: ['Corgi', 'Cat', 'Camera', 'House'].map((label) => ({
      label,
      image: label.toLowerCase(),
    })),
  },
  chibi: { ...batch, examples: figureExamples },
  vinyl: { ...batch, examples: figureExamples },
  brick: {
    ...batch,
    duration: '2 min',
    examples: photoExamples('brick', ['Portrait 1', 'Portrait 2', 'Portrait 3', 'Portrait 4']),
  },
  magnet: { ...batch, examples: [] },
  keycap: { ...batch, examples: [] },
  pixel: {
    ...batch,
    defaultCount: 2,
    maxCount: 4,
    styles: ['Object', 'Person'],
    examples: photoExamples('pixel', ['Pixel Sword', 'Pixel Banana', 'Pixel Cat', 'Woman']),
  },
  pet: {
    defaultCount: 4,
    credits: 6,
    duration: '1 min',
    maxMB: 10,
    examples: photoExamples('pet', ['Pet 1', 'Pet 2', 'Pet 3', 'Pet 4']),
  },
  lamp: { ...model, styles: ['Character', 'Landscape'], examples: modelExamples('lamp') },
  egg: {
    ...model,
    duration: '2 min',
    styles: ['Pet', 'Character', 'Other'],
    examples: modelExamples('egg'),
  },
  collapsible: {
    ...model,
    credits: 6,
    duration: '25 sec',
    maxMB: 10,
    examples: modelExamples('collapsible'),
  },
  plantpot: {
    ...model,
    styles: ['Cute animal', 'Object', 'Character'],
    examples: modelExamples('plantpot'),
  },
};

export function creationEstimate(id, count) {
  const settings = creationSettings[id];
  const quantity = settings.maxCount
    ? Math.max(1, Math.min(settings.maxCount, Number(count) || settings.defaultCount))
    : settings.defaultCount;
  return { quantity, credits: settings.credits * quantity, duration: settings.duration };
}
