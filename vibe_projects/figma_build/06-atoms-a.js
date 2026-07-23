// Phase 3 (part A) — Button, Badge, Category Tag component sets.
// PREREQ: paste _helpers.js at the top of this script before sending.
// Returns { componentSets: { name -> id } }.

const page = figma.root.children.find((p) => p.name === 'Components');
if (!page) throw new Error('Run 05-pages.js first.');
await figma.setCurrentPageAsync(page);

let cursorX = nextFreeX(page);
const componentSets = {};
const createdNodeIds = [];

// ---------------------------------------------------------------- Button
async function makeButton(variantName, bgVar, textVar, borderVar) {
  const c = figma.createComponent();
  c.name = variantName;                       // e.g. 'Style=Primary'
  c.layoutMode = 'HORIZONTAL';
  c.primaryAxisSizingMode = 'AUTO';
  c.counterAxisSizingMode = 'AUTO';
  c.counterAxisAlignItems = 'CENTER';
  pad(c, { t: 'spacing/xs', b: 'spacing/xs', l: 'spacing/base', r: 'spacing/base' });
  radius(c, 'radius/full');
  fill(c, bgVar);
  stroke(c, borderVar, 1);

  const label = await text('Button', 'Body/Small Medium', textVar, { name: 'Label' });
  c.appendChild(label);
  label.layoutSizingHorizontal = 'HUG';       // valid: TEXT child of auto-layout
  return c;
}

const btnPrimary = await makeButton('Style=Primary', 'color/bg/brand', 'color/text/inverse', 'color/border/brand');
const btnSecondary = await makeButton('Style=Secondary', 'color/bg/surface', 'color/text/brand', 'color/border/brand');

const buttonSet = figma.combineAsVariants([btnPrimary, btnSecondary], page);
buttonSet.name = 'Button';
buttonSet.description = 'Pill button. Primary = filled indigo (Sign Up); Secondary = outlined (Log In).';
buttonSet.layoutMode = 'VERTICAL';
buttonSet.primaryAxisSizingMode = 'AUTO';
buttonSet.counterAxisSizingMode = 'AUTO';
buttonSet.itemSpacing = 16;
buttonSet.paddingTop = buttonSet.paddingBottom = buttonSet.paddingLeft = buttonSet.paddingRight = 16;
buttonSet.x = cursorX;
buttonSet.y = 0;
// Expose the label as an editable text property.
const btnTextProp = buttonSet.addComponentProperty('Label', 'TEXT', 'Button');
for (const v of buttonSet.children) {
  const t = v.findOne((n) => n.type === 'TEXT');
  if (t) t.componentPropertyReferences = { characters: btnTextProp };
}
componentSets['Button'] = buttonSet.id;
createdNodeIds.push(buttonSet.id);
cursorX += buttonSet.width + 120;

// ---------------------------------------------------------------- Badge (card ribbon)
async function makeBadge(variantName, label, bgVar, textVar) {
  const c = figma.createComponent();
  c.name = variantName;
  c.layoutMode = 'HORIZONTAL';
  c.primaryAxisSizingMode = 'AUTO';
  c.counterAxisSizingMode = 'AUTO';
  c.counterAxisAlignItems = 'CENTER';
  pad(c, { t: 'spacing/3xs', b: 'spacing/3xs', l: 'spacing/sm', r: 'spacing/sm' });
  radius(c, 'radius/sm');
  fill(c, bgVar);
  c.effects = [];
  await c.setEffectStyleIdAsync(ES('Shadow/Small').id);

  const t = await text(label, 'Label/Caption Bold', textVar, { name: 'Label' });
  c.appendChild(t);
  t.layoutSizingHorizontal = 'HUG';
  return c;
}

const badgeBest = await makeBadge('Type=Bestseller', 'Bestseller', 'color/bg/badge-bestseller', 'color/text/primary');
const badgeNew = await makeBadge('Type=Hot & New', 'Hot & New', 'color/bg/badge-new', 'color/text/inverse');

const badgeSet = figma.combineAsVariants([badgeBest, badgeNew], page);
badgeSet.name = 'Badge';
badgeSet.description = 'Absolute-positioned ribbon on a course thumbnail.';
badgeSet.layoutMode = 'VERTICAL';
badgeSet.primaryAxisSizingMode = 'AUTO';
badgeSet.counterAxisSizingMode = 'AUTO';
badgeSet.itemSpacing = 16;
badgeSet.paddingTop = badgeSet.paddingBottom = badgeSet.paddingLeft = badgeSet.paddingRight = 16;
badgeSet.x = cursorX;
badgeSet.y = 0;
componentSets['Badge'] = badgeSet.id;
createdNodeIds.push(badgeSet.id);
cursorX += badgeSet.width + 120;

// ---------------------------------------------------------------- Category Tag
const TAGS = [
  ['Category=Web Dev',      'Web Dev',      'color/bg/tag-webdev',   'color/text/tag-webdev'],
  ['Category=Data Science', 'Data Science', 'color/bg/tag-data',     'color/text/tag-data'],
  ['Category=Design',       'Design',       'color/bg/tag-design',   'color/text/tag-design'],
  ['Category=Business',     'Business',     'color/bg/tag-business', 'color/text/tag-business'],
];

const tagVariants = [];
for (const [variantName, label, bgVar, textVar] of TAGS) {
  const c = figma.createComponent();
  c.name = variantName;
  c.layoutMode = 'HORIZONTAL';
  c.primaryAxisSizingMode = 'AUTO';
  c.counterAxisSizingMode = 'AUTO';
  c.counterAxisAlignItems = 'CENTER';
  pad(c, { t: 'spacing/2xs', b: 'spacing/2xs', l: 'spacing/sm', r: 'spacing/sm' });
  radius(c, 'radius/sm');
  fill(c, bgVar);
  const t = await text(label, 'Label/Caption Semibold', textVar, { name: 'Label' });
  c.appendChild(t);
  t.layoutSizingHorizontal = 'HUG';
  tagVariants.push(c);
}

const tagSet = figma.combineAsVariants(tagVariants, page);
tagSet.name = 'Category Tag';
tagSet.description = 'Subject pill shown in the card footer. Colour is driven by category.';
tagSet.layoutMode = 'VERTICAL';
tagSet.primaryAxisSizingMode = 'AUTO';
tagSet.counterAxisSizingMode = 'AUTO';
tagSet.itemSpacing = 16;
tagSet.paddingTop = tagSet.paddingBottom = tagSet.paddingLeft = tagSet.paddingRight = 16;
tagSet.x = cursorX;
tagSet.y = 0;
componentSets['Category Tag'] = tagSet.id;
createdNodeIds.push(tagSet.id);

return { componentSets, createdNodeIds };
