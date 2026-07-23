// Phase 3 (part B) — Logo, Search Field, Category Tab, Rating, Nav Link, Footer Link.
// PREREQ: paste _helpers.js at the top. Run after 06-atoms-a.js.
// Returns { components: { name -> id } }.

const page = figma.root.children.find((p) => p.name === 'Components');
if (!page) throw new Error('Run 05-pages.js first.');
await figma.setCurrentPageAsync(page);

let cursorX = nextFreeX(page);
let cursorY = 400;
const components = {};
const createdNodeIds = [];

const place = (node) => {
  node.x = cursorX; node.y = cursorY;
  cursorX += node.width + 120;
};

// ---------------------------------------------------------------- Logo
async function makeLogo(variantName, textStyle, textVar, iconVar) {
  const c = figma.createComponent();
  c.name = variantName;
  c.layoutMode = 'HORIZONTAL';
  c.primaryAxisSizingMode = 'AUTO';
  c.counterAxisSizingMode = 'AUTO';
  c.counterAxisAlignItems = 'CENTER';
  gap(c, 'spacing/sm');
  c.fills = [];
  c.appendChild(icon('graduation-cap', textStyle === 'Heading/Logo' ? 24 : 20, iconVar));
  const t = await text('SkillVerse', textStyle, textVar, { name: 'Wordmark' });
  c.appendChild(t);
  t.layoutSizingHorizontal = 'HUG';
  return c;
}

const logoLight = await makeLogo('Theme=Light', 'Heading/Logo', 'color/text/brand', 'color/text/brand');
const logoDark = await makeLogo('Theme=Dark', 'Heading/Logo Small', 'color/text/inverse', 'color/icon/brand');
const logoSet = figma.combineAsVariants([logoLight, logoDark], page);
logoSet.name = 'Logo';
logoSet.description = 'Light = header on white. Dark = footer on gray/900.';
logoSet.layoutMode = 'VERTICAL';
logoSet.primaryAxisSizingMode = 'AUTO';
logoSet.counterAxisSizingMode = 'AUTO';
logoSet.itemSpacing = 16;
logoSet.paddingTop = logoSet.paddingBottom = logoSet.paddingLeft = logoSet.paddingRight = 16;
place(logoSet);
components['Logo'] = logoSet.id;
createdNodeIds.push(logoSet.id);

// ---------------------------------------------------------------- Search Field
const search = figma.createComponent();
search.name = 'Search Field';
search.description = 'Header search input. Fills available width inside the header.';
search.layoutMode = 'HORIZONTAL';
search.counterAxisAlignItems = 'CENTER';
search.primaryAxisSizingMode = 'FIXED';
search.counterAxisSizingMode = 'AUTO';
pad(search, { t: 'spacing/sm', b: 'spacing/sm', l: 'spacing/md', r: 'spacing/base' });
gap(search, 'spacing/sm');
radius(search, 'radius/full');
fill(search, 'color/bg/muted');
search.strokes = [];
search.appendChild(icon('search', 16, 'color/icon/muted'));
const searchPlaceholder = await text(
  'Search for anything (e.g. Python, Design, Web)...',
  'Body/Small', 'color/text/subtle', { name: 'Placeholder' }
);
search.appendChild(searchPlaceholder);
searchPlaceholder.layoutSizingHorizontal = 'FILL';
search.resize(672, search.height);   // max-w-2xl
const searchProp = search.addComponentProperty('Placeholder', 'TEXT', searchPlaceholder.characters);
searchPlaceholder.componentPropertyReferences = { characters: searchProp };
place(search);
components['Search Field'] = search.id;
createdNodeIds.push(search.id);

// ---------------------------------------------------------------- Category Tab
async function makeTab(variantName, textStyle, textVar, underlineVar, underlineVisible) {
  const c = figma.createComponent();
  c.name = variantName;
  c.layoutMode = 'VERTICAL';
  c.primaryAxisSizingMode = 'AUTO';
  c.counterAxisSizingMode = 'AUTO';
  c.counterAxisAlignItems = 'CENTER';
  c.fills = [];

  const labelWrap = figma.createAutoLayout('HORIZONTAL', { name: 'Label Wrap' });
  labelWrap.fills = [];
  pad(labelWrap, { t: 'spacing/sm', b: 'spacing/sm', l: 'spacing/base', r: 'spacing/base' });
  const t = await text('All Courses', textStyle, textVar, { name: 'Label' });
  labelWrap.appendChild(t);
  t.layoutSizingHorizontal = 'HUG';
  c.appendChild(labelWrap);
  labelWrap.layoutSizingHorizontal = 'HUG';

  const underline = figma.createRectangle();
  underline.name = 'Underline';
  underline.resize(100, 2);
  if (underlineVisible) fill(underline, underlineVar); else underline.fills = [];
  c.appendChild(underline);
  underline.layoutSizingHorizontal = 'FILL';
  underline.layoutSizingVertical = 'FIXED';
  return c;
}

const tabActive = await makeTab('State=Active', 'Body/Small Semibold', 'color/text/brand', 'color/border/brand', true);
const tabDefault = await makeTab('State=Default', 'Body/Small Medium', 'color/text/muted', 'color/border/brand', false);
const tabSet = figma.combineAsVariants([tabActive, tabDefault], page);
tabSet.name = 'Category Tab';
tabSet.description = 'Filter tab above the course grid. Active state shows the indigo underline.';
tabSet.layoutMode = 'VERTICAL';
tabSet.primaryAxisSizingMode = 'AUTO';
tabSet.counterAxisSizingMode = 'AUTO';
tabSet.itemSpacing = 16;
tabSet.paddingTop = tabSet.paddingBottom = tabSet.paddingLeft = tabSet.paddingRight = 16;
place(tabSet);
const tabProp = tabSet.addComponentProperty('Label', 'TEXT', 'All Courses');
for (const v of tabSet.children) {
  const t = v.findOne((n) => n.type === 'TEXT');
  if (t) t.componentPropertyReferences = { characters: tabProp };
}
components['Category Tab'] = tabSet.id;
createdNodeIds.push(tabSet.id);

// ---------------------------------------------------------------- Rating
const rating = figma.createComponent();
rating.name = 'Rating';
rating.description = 'Score + 5 stars + review count. Swap the 5th star for the half variant.';
rating.layoutMode = 'HORIZONTAL';
rating.primaryAxisSizingMode = 'AUTO';
rating.counterAxisSizingMode = 'AUTO';
rating.counterAxisAlignItems = 'CENTER';
gap(rating, 'spacing/2xs');
rating.fills = [];

const score = await text('4.8', 'Label/Caption Bold', 'color/text/rating', { name: 'Score' });
rating.appendChild(score);
score.layoutSizingHorizontal = 'HUG';

const stars = figma.createAutoLayout('HORIZONTAL', { name: 'Stars' });
stars.fills = [];
stars.itemSpacing = 1;
for (let i = 0; i < 4; i++) stars.appendChild(icon('star', 12, 'color/icon/star'));
stars.appendChild(icon('star-half', 12, 'color/icon/star'));
rating.appendChild(stars);

const count = await text('(142,500)', 'Label/Caption', 'color/text/subtle', { name: 'Count' });
rating.appendChild(count);
count.layoutSizingHorizontal = 'HUG';

const scoreProp = rating.addComponentProperty('Score', 'TEXT', '4.8');
const countProp = rating.addComponentProperty('Count', 'TEXT', '(142,500)');
score.componentPropertyReferences = { characters: scoreProp };
count.componentPropertyReferences = { characters: countProp };
place(rating);
components['Rating'] = rating.id;
createdNodeIds.push(rating.id);

// ---------------------------------------------------------------- Nav / Footer links
async function makeLink(name, styleName, colorVar, label) {
  const c = figma.createComponent();
  c.name = name;
  c.layoutMode = 'HORIZONTAL';
  c.primaryAxisSizingMode = 'AUTO';
  c.counterAxisSizingMode = 'AUTO';
  c.fills = [];
  const t = await text(label, styleName, colorVar, { name: 'Label' });
  c.appendChild(t);
  t.layoutSizingHorizontal = 'HUG';
  const p = c.addComponentProperty('Label', 'TEXT', label);
  t.componentPropertyReferences = { characters: p };
  place(c);
  return c;
}

const navLink = await makeLink('Nav Link', 'Body/Small Medium', 'color/text/secondary', 'Teach on SkillVerse');
navLink.description = 'Header text link.';
components['Nav Link'] = navLink.id;
createdNodeIds.push(navLink.id);

const footerLink = await makeLink('Footer Link', 'Body/Small', 'color/text/footer', 'About');
footerLink.description = 'Footer text link on gray/900.';
components['Footer Link'] = footerLink.id;
createdNodeIds.push(footerLink.id);

// ---------------------------------------------------------------- Cart w/ counter
const cart = figma.createComponent();
cart.name = 'Cart Icon';
cart.description = 'Cart glyph with an absolute-positioned count bubble.';
cart.layoutMode = 'NONE';
cart.resize(24, 24);
cart.fills = [];
cart.clipsContent = false;
const cartGlyph = icon('cart', 20, 'color/text/secondary');
cart.appendChild(cartGlyph);
cartGlyph.x = 0; cartGlyph.y = 2;

const bubble = figma.createAutoLayout('HORIZONTAL', { name: 'Count' });
bubble.primaryAxisAlignItems = 'CENTER';
bubble.counterAxisAlignItems = 'CENTER';
fill(bubble, 'color/bg/brand');
radius(bubble, 'radius/full');
const bubbleText = await text('3', 'Label/Caption Bold', 'color/text/inverse', { name: 'Value' });
bubble.appendChild(bubbleText);
cart.appendChild(bubble);
bubble.layoutPositioning = 'ABSOLUTE';
bubble.resize(16, 16);
bubble.x = 14; bubble.y = -2;
const cartProp = cart.addComponentProperty('Count', 'TEXT', '3');
bubbleText.componentPropertyReferences = { characters: cartProp };
place(cart);
components['Cart Icon'] = cart.id;
createdNodeIds.push(cart.id);

return { components, createdNodeIds };
