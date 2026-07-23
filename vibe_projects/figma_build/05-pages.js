// Phase 2 — File page skeleton.
// Safe to re-run: pages are matched by name.
// Returns { pages: { name -> id } }.

const WANTED = [
  'Cover',
  'Foundations',
  '--- COMPONENTS ---',
  'Components',
  '--- SCREENS ---',
  'Desktop',
];

const pages = {};
for (const name of WANTED) {
  let p = figma.root.children.find((x) => x.name === name);
  if (!p) {
    p = figma.createPage();
    p.name = name;
  }
  pages[name] = p.id;
}

// Rename the default "Page 1" out of the way if it is still empty and unused.
const stray = figma.root.children.find((p) => p.name === 'Page 1' && p.children.length === 0);
if (stray && figma.root.children.length > 1) stray.remove();

return { pages, order: figma.root.children.map((p) => p.name) };
