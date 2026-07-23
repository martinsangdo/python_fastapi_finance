// Phase 1f — Typography styles, paint (color) styles, and effect styles.
// PREREQ: 01 + 02 must have run (paint styles bind to semantic color variables).
// Returns { textStyles, paintStyles, effectStyles }.

// ---- Fonts: load every family/style combination BEFORE creating text styles ----
const FAMILY = 'Inter';
// NOTE: Inter's style strings are "Semi Bold" / "Extra Bold" — NOT "SemiBold"/"ExtraBold".
const STYLES = ['Regular', 'Medium', 'Semi Bold', 'Bold', 'Extra Bold'];

const available = await figma.listAvailableFontsAsync();
const haveInter = new Set(
  available.filter((f) => f.fontName.family === FAMILY).map((f) => f.fontName.style)
);
const unavailable = STYLES.filter((s) => !haveInter.has(s));
if (unavailable.length) {
  throw new Error(
    'Missing Inter styles: ' + unavailable.join(', ') +
    '. Available: ' + Array.from(haveInter).join(', ')
  );
}
for (const style of STYLES) {
  await figma.loadFontAsync({ family: FAMILY, style });
}

// ---- Text styles ----
const TYPE_RAMP = [
  // name,                      size, style,        lineHeight, letterSpacing, extras
  ['Display/Hero',              48, 'Extra Bold', 52, -1],
  ['Heading/Section',           24, 'Bold',       32, -0.2],
  ['Heading/Logo',              24, 'Bold',       32, -0.2],
  ['Heading/Logo Small',        20, 'Bold',       28, -0.2],
  ['Heading/Card',              16, 'Bold',       22, 0],
  ['Body/Large',                18, 'Regular',    28, 0],
  ['Body/Base',                 16, 'Regular',    24, 0],
  ['Body/Small',                14, 'Regular',    20, 0],
  ['Body/Small Medium',         14, 'Medium',     20, 0],
  ['Body/Small Semibold',       14, 'Semi Bold',  20, 0],
  ['Label/Caption',             12, 'Regular',    16, 0],
  ['Label/Caption Medium',      12, 'Medium',     16, 0],
  ['Label/Caption Semibold',    12, 'Semi Bold',  16, 0],
  ['Label/Caption Bold',        12, 'Bold',       16, 0],
  ['Label/Eyebrow',             12, 'Semi Bold',  16, 1,    { textCase: 'UPPER' }],
  ['Price/Current',             18, 'Extra Bold', 24, 0],
  ['Price/Original',            12, 'Regular',    16, 0,    { textDecoration: 'STRIKETHROUGH' }],
];

const existingText = await figma.getLocalTextStylesAsync();
const textStyles = {};

for (const [name, size, style, lh, ls, extras] of TYPE_RAMP) {
  let s = existingText.find((x) => x.name === name);
  if (!s) {
    s = figma.createTextStyle();
    s.name = name;
  }
  s.fontName = { family: FAMILY, style };
  s.fontSize = size;
  s.lineHeight = { unit: 'PIXELS', value: lh };
  s.letterSpacing = { unit: 'PIXELS', value: ls };
  if (extras && extras.textCase) s.textCase = extras.textCase;
  if (extras && extras.textDecoration) s.textDecoration = extras.textDecoration;
  textStyles[name] = s.id;
}

// ---- Paint styles (the color style library), each bound to its semantic variable ----
const colorVars = await figma.variables.getLocalVariablesAsync('COLOR');
const collections = await figma.variables.getLocalVariableCollectionsAsync();
const colorColl = collections.find((c) => c.name === 'Color');
if (!colorColl) throw new Error('Run 02-semantic-color.js first.');

const existingPaint = await figma.getLocalPaintStylesAsync();
const paintStyles = {};

for (const v of colorVars) {
  if (v.variableCollectionId !== colorColl.id) continue;
  // "color/bg/brand" -> style named "Background/Brand"
  const parts = v.name.split('/');            // ['color','bg','brand']
  const group = { bg: 'Background', text: 'Text', border: 'Border', icon: 'Icon' }[parts[1]] || parts[1];
  const leaf = parts.slice(2).join('/')
    .split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const styleName = group + '/' + leaf;

  let s = existingPaint.find((x) => x.name === styleName);
  if (!s) {
    s = figma.createPaintStyle();
    s.name = styleName;
  }
  let paint = { type: 'SOLID', color: { r: 0, g: 0, b: 0 } };
  // setBoundVariableForPaint returns a NEW paint — must capture and reassign.
  paint = figma.variables.setBoundVariableForPaint(paint, 'color', v);
  s.paints = [paint];
  paintStyles[styleName] = s.id;
}

// ---- Effect styles (Tailwind shadow-sm / shadow-lg / shadow-2xl) ----
const existingEffect = await figma.getLocalEffectStylesAsync();
const EFFECTS = {
  'Shadow/Small': [
    { type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.05 }, offset: { x: 0, y: 1 }, radius: 2, spread: 0, visible: true, blendMode: 'NORMAL' },
  ],
  'Shadow/Large': [
    { type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.1 }, offset: { x: 0, y: 10 }, radius: 15, spread: -3, visible: true, blendMode: 'NORMAL' },
    { type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.1 }, offset: { x: 0, y: 4 }, radius: 6, spread: -4, visible: true, blendMode: 'NORMAL' },
  ],
  'Shadow/2XL': [
    { type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.25 }, offset: { x: 0, y: 25 }, radius: 50, spread: -12, visible: true, blendMode: 'NORMAL' },
  ],
};

const effectStyles = {};
for (const [name, effects] of Object.entries(EFFECTS)) {
  let s = existingEffect.find((x) => x.name === name);
  if (!s) {
    s = figma.createEffectStyle();
    s.name = name;
  }
  s.effects = effects;
  effectStyles[name] = s.id;
}

return {
  textStyleCount: Object.keys(textStyles).length,
  paintStyleCount: Object.keys(paintStyles).length,
  effectStyleCount: Object.keys(effectStyles).length,
  textStyles,
  paintStyles,
  effectStyles,
};
