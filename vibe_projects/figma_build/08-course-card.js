// Phase 3 (part C) — Course Card, the repeated element of the grid.
// PREREQ: paste _helpers.js at the top. Run after 06-atoms-a.js and 07-atoms-b.js.
// Returns { courseCardId, propertyIds }.

const page = figma.root.children.find((p) => p.name === 'Components');
if (!page) throw new Error('Run 05-pages.js first.');
await figma.setCurrentPageAsync(page);

const badgeSet = page.findOne((n) => n.type === 'COMPONENT_SET' && n.name === 'Badge');
const tagSet = page.findOne((n) => n.type === 'COMPONENT_SET' && n.name === 'Category Tag');
const ratingComp = page.findOne((n) => n.type === 'COMPONENT' && n.name === 'Rating');
if (!badgeSet || !tagSet || !ratingComp) {
  throw new Error('Missing atoms — run 06-atoms-a.js and 07-atoms-b.js first.');
}

const CARD_W = 302;   // (1280 - 3*24) / 4

const card = figma.createComponent();
card.name = 'Course Card';
card.description =
  'Course tile used in the Featured Courses grid. Badge is optional (card 4 has none); ' +
  'category colour comes from the Category Tag variant.';
card.layoutMode = 'VERTICAL';
card.primaryAxisSizingMode = 'AUTO';
card.counterAxisSizingMode = 'FIXED';
card.clipsContent = true;
fill(card, 'color/bg/surface');
stroke(card, 'color/border/default', 1);
radius(card, 'radius/xl');
card.resize(CARD_W, 100);

// ---------------------------------------------------------------- Thumbnail
const thumb = figma.createFrame();
thumb.name = 'Thumbnail';
thumb.layoutMode = 'NONE';
thumb.clipsContent = false;
thumb.resize(CARD_W, 160);
fill(thumb, 'color/bg/muted');
card.appendChild(thumb);
thumb.layoutSizingHorizontal = 'FILL';
thumb.layoutSizingVertical = 'FIXED';
thumb.setBoundVariable('height', N('size/card-image'));

// Try to pull the real Unsplash thumbnail; fall back to the muted placeholder offline.
let imageLoaded = false;
try {
  const img = await figma.createImageAsync(
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80'
  );
  thumb.fills = [{ type: 'IMAGE', scaleMode: 'FILL', imageHash: img.hash }];
  imageLoaded = true;
} catch (e) {
  // Network unavailable in the plugin sandbox — keep the placeholder fill.
}

const badgeInstance = badgeSet.defaultVariant.createInstance();
badgeInstance.name = 'Badge';
thumb.appendChild(badgeInstance);
badgeInstance.x = 12;
badgeInstance.y = 12;

// ---------------------------------------------------------------- Content
const content = figma.createAutoLayout('VERTICAL', { name: 'Content' });
content.fills = [];
pad(content, { all: 'spacing/base' });
gap(content, 'spacing/md');
card.appendChild(content);
content.layoutSizingHorizontal = 'FILL';
content.layoutSizingVertical = 'HUG';

// --- meta block ---
const meta = figma.createAutoLayout('VERTICAL', { name: 'Meta' });
meta.fills = [];
gap(meta, 'spacing/2xs');
content.appendChild(meta);
meta.layoutSizingHorizontal = 'FILL';

const title = await text(
  'The Complete 2026 Web Development Bootcamp',
  'Heading/Card', 'color/text/primary',
  { name: 'Title', width: CARD_W - 32, truncate: 2 }   // line-clamp-2
);
meta.appendChild(title);
title.layoutSizingHorizontal = 'FILL';

const instructor = await text(
  'Angela Yu, Developer & Lead Instructor',
  'Label/Caption', 'color/text/muted', { name: 'Instructor' }
);
meta.appendChild(instructor);
instructor.layoutSizingHorizontal = 'FILL';

const ratingInstance = ratingComp.createInstance();
ratingInstance.name = 'Rating';
meta.appendChild(ratingInstance);

// --- divider + footer ---
const divider = figma.createRectangle();
divider.name = 'Divider';
divider.resize(CARD_W - 32, 1);
fill(divider, 'color/border/subtle');
content.appendChild(divider);
divider.layoutSizingHorizontal = 'FILL';
divider.layoutSizingVertical = 'FIXED';

const footer = figma.createAutoLayout('HORIZONTAL', { name: 'Footer' });
footer.fills = [];
footer.counterAxisAlignItems = 'CENTER';
footer.primaryAxisAlignItems = 'SPACE_BETWEEN';
content.appendChild(footer);
footer.layoutSizingHorizontal = 'FILL';

const priceGroup = figma.createAutoLayout('HORIZONTAL', { name: 'Price' });
priceGroup.fills = [];
priceGroup.counterAxisAlignItems = 'BASELINE';
gap(priceGroup, 'spacing/sm');
footer.appendChild(priceGroup);

const price = await text('$14.99', 'Price/Current', 'color/text/primary', { name: 'Price' });
priceGroup.appendChild(price);
price.layoutSizingHorizontal = 'HUG';

const original = await text('$84.99', 'Price/Original', 'color/text/subtle', { name: 'Original Price' });
priceGroup.appendChild(original);
original.layoutSizingHorizontal = 'HUG';

const tagInstance = tagSet.defaultVariant.createInstance();
tagInstance.name = 'Category Tag';
footer.appendChild(tagInstance);

// ---------------------------------------------------------------- Component properties
const propertyIds = {};
propertyIds.title = card.addComponentProperty('Title', 'TEXT', title.characters);
propertyIds.instructor = card.addComponentProperty('Instructor', 'TEXT', instructor.characters);
propertyIds.price = card.addComponentProperty('Price', 'TEXT', price.characters);
propertyIds.original = card.addComponentProperty('Original Price', 'TEXT', original.characters);
propertyIds.showBadge = card.addComponentProperty('Show Badge', 'BOOLEAN', true);

title.componentPropertyReferences = { characters: propertyIds.title };
instructor.componentPropertyReferences = { characters: propertyIds.instructor };
price.componentPropertyReferences = { characters: propertyIds.price };
original.componentPropertyReferences = { characters: propertyIds.original };
badgeInstance.componentPropertyReferences = { visible: propertyIds.showBadge };

card.x = nextFreeX(page);
card.y = 800;

return {
  courseCardId: card.id,
  propertyIds,
  imageLoaded,
  createdNodeIds: [card.id],
};
