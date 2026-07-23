// Phase 4 (part A) — Desktop screen frame + Header + Hero.
// PREREQ: paste _helpers.js at the top. Run after 06/07/08.
// Returns { screenId, headerId, heroId }.

const page = figma.root.children.find((p) => p.name === 'Desktop');
if (!page) throw new Error('Run 05-pages.js first.');
await figma.setCurrentPageAsync(page);

const comps = figma.root.children.find((p) => p.name === 'Components');
const find = (name, type) => {
  const n = comps.findOne((x) => x.type === type && x.name === name);
  if (!n) throw new Error('Missing component: ' + name);
  return n;
};
const logoSet = find('Logo', 'COMPONENT_SET');
const buttonSet = find('Button', 'COMPONENT_SET');
const searchComp = find('Search Field', 'COMPONENT');
const navLinkComp = find('Nav Link', 'COMPONENT');
const cartComp = find('Cart Icon', 'COMPONENT');

const W = 1440;
const GUTTER = 80;            // (1440 - 1280 max-w-7xl) / 2

const variantByName = (set, name) =>
  set.children.find((c) => c.name === name) || set.defaultVariant;

// ---------------------------------------------------------------- Screen
const screen = figma.createFrame();
screen.name = 'Desktop — SkillVerse Marketplace';
screen.layoutMode = 'VERTICAL';
screen.primaryAxisSizingMode = 'AUTO';
screen.counterAxisSizingMode = 'FIXED';
screen.itemSpacing = 0;
screen.clipsContent = true;
fill(screen, 'color/bg/page');
screen.resize(W, 1000);
screen.x = nextFreeX(page);
screen.y = 0;

// ---------------------------------------------------------------- Header
const header = figma.createFrame();
header.name = 'Header';
header.layoutMode = 'HORIZONTAL';
header.counterAxisAlignItems = 'CENTER';
header.primaryAxisSizingMode = 'FIXED';
header.counterAxisSizingMode = 'FIXED';
header.paddingLeft = header.paddingRight = GUTTER;
fill(header, 'color/bg/surface');
stroke(header, 'color/border/default', 1);
header.strokeAlign = 'INSIDE';
header.strokeTopWeight = header.strokeLeftWeight = header.strokeRightWeight = 0;
header.strokeBottomWeight = 1;
screen.appendChild(header);
header.layoutSizingHorizontal = 'FILL';
header.layoutSizingVertical = 'FIXED';
header.setBoundVariable('height', N('size/header-height'));
await header.setEffectStyleIdAsync(ES('Shadow/Small').id);

const headerInner = figma.createAutoLayout('HORIZONTAL', { name: 'Container' });
headerInner.fills = [];
headerInner.counterAxisAlignItems = 'CENTER';
headerInner.primaryAxisAlignItems = 'SPACE_BETWEEN';
gap(headerInner, 'spacing/base');
header.appendChild(headerInner);
headerInner.layoutSizingHorizontal = 'FILL';
headerInner.layoutSizingVertical = 'FILL';

const logo = variantByName(logoSet, 'Theme=Light').createInstance();
headerInner.appendChild(logo);

const searchWrap = figma.createAutoLayout('HORIZONTAL', { name: 'Search Wrap' });
searchWrap.fills = [];
searchWrap.counterAxisAlignItems = 'CENTER';
headerInner.appendChild(searchWrap);
searchWrap.layoutSizingHorizontal = 'FILL';
const searchInst = searchComp.createInstance();
searchWrap.appendChild(searchInst);
searchInst.layoutSizingHorizontal = 'FILL';

const actions = figma.createAutoLayout('HORIZONTAL', { name: 'Actions' });
actions.fills = [];
actions.counterAxisAlignItems = 'CENTER';
gap(actions, 'spacing/base');
headerInner.appendChild(actions);

const teachLink = navLinkComp.createInstance();
teachLink.setProperties({ Label: 'Teach on SkillVerse' });
actions.appendChild(teachLink);

actions.appendChild(cartComp.createInstance());

const loginBtn = variantByName(buttonSet, 'Style=Secondary').createInstance();
loginBtn.setProperties({ Label: 'Log In' });
actions.appendChild(loginBtn);

const signupBtn = variantByName(buttonSet, 'Style=Primary').createInstance();
signupBtn.setProperties({ Label: 'Sign Up' });
actions.appendChild(signupBtn);

// ---------------------------------------------------------------- Hero
const hero = figma.createFrame();
hero.name = 'Hero';
hero.layoutMode = 'HORIZONTAL';
hero.primaryAxisSizingMode = 'FIXED';
hero.counterAxisSizingMode = 'AUTO';
hero.counterAxisAlignItems = 'CENTER';
hero.primaryAxisAlignItems = 'SPACE_BETWEEN';
hero.paddingLeft = hero.paddingRight = GUTTER;
pad(hero, { t: 'spacing/3xl', b: 'spacing/3xl' });
hero.paddingLeft = hero.paddingRight = GUTTER;
gap(hero, 'spacing/xl');

// bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900.
// Gradient stops cannot be bound to variables — values mirror Primitives.
hero.fills = [{
  type: 'GRADIENT_LINEAR',
  gradientTransform: [[1, 0, 0], [0, 1, 0]],
  gradientStops: [
    { position: 0,   color: { r: 0x31 / 255, g: 0x2E / 255, b: 0x81 / 255, a: 1 } }, // indigo/900
    { position: 0.5, color: { r: 0x37 / 255, g: 0x30 / 255, b: 0xA3 / 255, a: 1 } }, // indigo/800
    { position: 1,   color: { r: 0x58 / 255, g: 0x1C / 255, b: 0x87 / 255, a: 1 } }, // purple/900
  ],
}];
screen.appendChild(hero);
hero.layoutSizingHorizontal = 'FILL';

const heroCopy = figma.createAutoLayout('VERTICAL', { name: 'Copy' });
heroCopy.fills = [];
gap(heroCopy, 'spacing/base');
hero.appendChild(heroCopy);
heroCopy.layoutSizingHorizontal = 'FIXED';
heroCopy.resize(576, heroCopy.height);   // max-w-xl

const eyebrow = figma.createAutoLayout('HORIZONTAL', { name: 'Eyebrow' });
pad(eyebrow, { t: 'spacing/2xs', b: 'spacing/2xs', l: 'spacing/md', r: 'spacing/md' });
radius(eyebrow, 'radius/full');
eyebrow.fills = [{
  type: 'SOLID',
  color: { r: 0x63 / 255, g: 0x66 / 255, b: 0xF1 / 255 },
  opacity: 0.3,                          // bg-indigo-500/30
}];
heroCopy.appendChild(eyebrow);
const eyebrowText = await text('Skill Up Today', 'Label/Eyebrow', 'color/text/hero-eyebrow', { name: 'Label' });
eyebrow.appendChild(eyebrowText);
eyebrowText.layoutSizingHorizontal = 'HUG';

const h1 = await text(
  'Learn without limits. Master new skills.',
  'Display/Hero', 'color/text/inverse',
  { name: 'Headline', width: 576 }
);
heroCopy.appendChild(h1);
h1.layoutSizingHorizontal = 'FILL';

const sub = await text(
  'Access over 10,000+ top-rated courses taught by industry experts in development, business, design, and AI.',
  'Body/Large', 'color/text/on-hero',
  { name: 'Subhead', width: 576 }
);
heroCopy.appendChild(sub);
sub.layoutSizingHorizontal = 'FILL';

// Hero image
const heroImg = figma.createFrame();
heroImg.name = 'Hero Image';
heroImg.layoutMode = 'NONE';
heroImg.clipsContent = true;
heroImg.resize(384, 256);
radius(heroImg, 'radius/xl');
fill(heroImg, 'color/bg/muted');
heroImg.strokes = [{
  type: 'SOLID',
  color: { r: 0x81 / 255, g: 0x8C / 255, b: 0xF8 / 255 },
  opacity: 0.2,                          // border-indigo-400/20
}];
heroImg.strokeWeight = 2;
let heroImageLoaded = false;
try {
  const img = await figma.createImageAsync(
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80'
  );
  heroImg.fills = [{ type: 'IMAGE', scaleMode: 'FILL', imageHash: img.hash }];
  heroImageLoaded = true;
} catch (e) { /* offline — placeholder stays */ }
hero.appendChild(heroImg);
heroImg.layoutSizingHorizontal = 'FIXED';
heroImg.layoutSizingVertical = 'FIXED';
await heroImg.setEffectStyleIdAsync(ES('Shadow/2XL').id);

return {
  screenId: screen.id,
  headerId: header.id,
  heroId: hero.id,
  heroImageLoaded,
  createdNodeIds: [screen.id],
};
