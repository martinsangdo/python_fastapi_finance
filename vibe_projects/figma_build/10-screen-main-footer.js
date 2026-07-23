// Phase 4 (part B) — Main content (tabs + heading + course grid) and Footer.
// PREREQ: paste _helpers.js at the top. Run after 09-screen-header-hero.js.
// Returns { mainId, footerId }.

const page = figma.root.children.find((p) => p.name === 'Desktop');
await figma.setCurrentPageAsync(page);

const screen = page.findOne((n) => n.type === 'FRAME' && n.name.startsWith('Desktop —'));
if (!screen) throw new Error('Run 09-screen-header-hero.js first.');

const comps = figma.root.children.find((p) => p.name === 'Components');
const find = (name, type) => {
  const n = comps.findOne((x) => x.type === type && x.name === name);
  if (!n) throw new Error('Missing component: ' + name);
  return n;
};
const tabSet = find('Category Tab', 'COMPONENT_SET');
const cardComp = find('Course Card', 'COMPONENT');
const badgeSet = find('Badge', 'COMPONENT_SET');
const tagSet = find('Category Tag', 'COMPONENT_SET');
const logoSet = find('Logo', 'COMPONENT_SET');
const footerLinkComp = find('Footer Link', 'COMPONENT');

const GUTTER = 80;
const variantByName = (set, name) =>
  set.children.find((c) => c.name === name) || set.defaultVariant;

// ---------------------------------------------------------------- Main
const main = figma.createFrame();
main.name = 'Main';
main.layoutMode = 'VERTICAL';
main.primaryAxisSizingMode = 'AUTO';
main.counterAxisSizingMode = 'FIXED';
main.paddingLeft = main.paddingRight = GUTTER;
pad(main, { t: 'spacing/2xl', b: 'spacing/2xl' });
main.paddingLeft = main.paddingRight = GUTTER;
gap(main, 'spacing/lg');
main.fills = [];
screen.appendChild(main);
main.layoutSizingHorizontal = 'FILL';

// --- Category tabs ---
const tabsRow = figma.createAutoLayout('HORIZONTAL', { name: 'Category Tabs' });
tabsRow.fills = [];
tabsRow.itemSpacing = 8;
tabsRow.counterAxisAlignItems = 'MAX';
main.appendChild(tabsRow);
tabsRow.layoutSizingHorizontal = 'FILL';

const TABS = ['All Courses', 'Web Development', 'Data Science & AI', 'UI/UX Design', 'Business & Marketing'];
TABS.forEach((label, i) => {
  const inst = variantByName(tabSet, i === 0 ? 'State=Active' : 'State=Default').createInstance();
  inst.setProperties({ Label: label });
  tabsRow.appendChild(inst);
});

// Bottom rule under the tab strip (border-b border-gray-200)
const tabsRule = figma.createRectangle();
tabsRule.name = 'Tabs Rule';
tabsRule.resize(1280, 1);
fill(tabsRule, 'color/border/default');
main.appendChild(tabsRule);
tabsRule.layoutSizingHorizontal = 'FILL';
tabsRule.layoutSizingVertical = 'FIXED';

// --- Section heading ---
const heading = figma.createAutoLayout('VERTICAL', { name: 'Section Heading' });
heading.fills = [];
gap(heading, 'spacing/2xs');
main.appendChild(heading);
heading.layoutSizingHorizontal = 'FILL';

const h2 = await text('Featured Courses', 'Heading/Section', 'color/text/primary', { name: 'Title' });
heading.appendChild(h2);
h2.layoutSizingHorizontal = 'HUG';

const h2sub = await text(
  'Explore our most popular and highly-rated classes',
  'Body/Small', 'color/text/muted', { name: 'Subtitle' }
);
heading.appendChild(h2sub);
h2sub.layoutSizingHorizontal = 'HUG';

// --- Course grid (xl:grid-cols-4, gap-6) ---
const grid = figma.createAutoLayout('HORIZONTAL', { name: 'Course Grid' });
grid.fills = [];
gap(grid, 'spacing/lg');
grid.counterAxisAlignItems = 'MIN';
main.appendChild(grid);
grid.layoutSizingHorizontal = 'FILL';

const COURSES = [
  {
    title: 'The Complete 2026 Web Development Bootcamp',
    instructor: 'Angela Yu, Developer & Lead Instructor',
    price: '$14.99', original: '$84.99',
    score: '4.8', count: '(142,500)',
    badge: 'Type=Bestseller', tag: 'Category=Web Dev', showBadge: true,
  },
  {
    title: 'Python for Data Science and Machine Learning',
    instructor: 'Jose Portilla, Head of Data Science',
    price: '$18.99', original: '$94.99',
    score: '4.9', count: '(89,210)',
    badge: 'Type=Hot & New', tag: 'Category=Data Science', showBadge: true,
  },
  {
    title: 'Figma UI/UX Design Essentials 2026',
    instructor: 'Daniel Walter Scott, Design Certified',
    price: '$12.99', original: '$69.99',
    score: '4.7', count: '(45,100)',
    badge: 'Type=Bestseller', tag: 'Category=Design', showBadge: true,
  },
  {
    title: 'Digital Marketing Masterclass - 23 Courses in 1',
    instructor: 'Phil Ebiner, Top Rated Instructor',
    price: '$15.99', original: '$79.99',
    score: '4.6', count: '(32,800)',
    badge: 'Type=Bestseller', tag: 'Category=Business', showBadge: false,
  },
];

const cardIds = [];
for (const course of COURSES) {
  const inst = cardComp.createInstance();
  inst.name = course.title;
  grid.appendChild(inst);
  inst.layoutSizingHorizontal = 'FILL';

  inst.setProperties({
    'Title': course.title,
    'Instructor': course.instructor,
    'Price': course.price,
    'Original Price': course.original,
    'Show Badge': course.showBadge,
  });

  // Swap nested variant instances + set rating text.
  const badgeInst = inst.findOne((n) => n.type === 'INSTANCE' && n.name === 'Badge');
  if (badgeInst && course.showBadge) {
    badgeInst.swapComponent(variantByName(badgeSet, course.badge));
  }
  const tagInst = inst.findOne((n) => n.type === 'INSTANCE' && n.name === 'Category Tag');
  if (tagInst) tagInst.swapComponent(variantByName(tagSet, course.tag));

  const ratingInst = inst.findOne((n) => n.type === 'INSTANCE' && n.name === 'Rating');
  if (ratingInst) ratingInst.setProperties({ Score: course.score, Count: course.count });

  cardIds.push(inst.id);
}

// ---------------------------------------------------------------- Footer
const footer = figma.createFrame();
footer.name = 'Footer';
footer.layoutMode = 'HORIZONTAL';
footer.primaryAxisSizingMode = 'FIXED';
footer.counterAxisSizingMode = 'AUTO';
footer.counterAxisAlignItems = 'CENTER';
footer.primaryAxisAlignItems = 'SPACE_BETWEEN';
footer.paddingLeft = footer.paddingRight = GUTTER;
pad(footer, { t: 'spacing/xl', b: 'spacing/xl' });
footer.paddingLeft = footer.paddingRight = GUTTER;
gap(footer, 'spacing/base');
fill(footer, 'color/bg/inverse');
stroke(footer, 'color/border/footer', 1);
footer.strokeLeftWeight = footer.strokeRightWeight = footer.strokeBottomWeight = 0;
footer.strokeTopWeight = 1;
screen.appendChild(footer);
footer.layoutSizingHorizontal = 'FILL';

footer.appendChild(variantByName(logoSet, 'Theme=Dark').createInstance());

const footerLinks = figma.createAutoLayout('HORIZONTAL', { name: 'Links' });
footerLinks.fills = [];
footerLinks.counterAxisAlignItems = 'CENTER';
gap(footerLinks, 'spacing/lg');
footer.appendChild(footerLinks);
for (const label of ['About', 'Careers', 'Blog', 'Help & Support', 'Privacy Policy']) {
  const l = footerLinkComp.createInstance();
  l.setProperties({ Label: label });
  footerLinks.appendChild(l);
}

const copyright = await text(
  '© 2026 SkillVerse, Inc. All rights reserved.',
  'Label/Caption', 'color/text/footer-muted', { name: 'Copyright' }
);
footer.appendChild(copyright);
copyright.layoutSizingHorizontal = 'HUG';

await screen.screenshot();

return {
  mainId: main.id,
  footerId: footer.id,
  cardIds,
  createdNodeIds: [main.id, footer.id],
};
