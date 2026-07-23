// Phase 1b/1d/1e — Spacing + Radius + Size tokens (FLOAT variables).
// Values mirror the Tailwind scale actually used by vibe_1_page_2_figma.html.
// Returns { spacing: {...}, radius: {...}, size: {...} }.

const collections = await figma.variables.getLocalVariableCollectionsAsync();
const allFloats = await figma.variables.getLocalVariablesAsync('FLOAT');

function ensureCollection(name, modeName) {
  let c = collections.find((x) => x.name === name);
  if (!c) {
    c = figma.variables.createVariableCollection(name);
    c.renameMode(c.modes[0].modeId, modeName);
  }
  return c;
}

function ensureVars(coll, map, scopes, prefixForCss) {
  const modeId = coll.modes[0].modeId;
  const out = {};
  for (const [name, value] of Object.entries(map)) {
    let v = allFloats.find((x) => x.name === name && x.variableCollectionId === coll.id);
    if (!v) v = figma.variables.createVariable(name, coll, 'FLOAT');
    v.setValueForMode(modeId, value);
    v.scopes = scopes;
    v.setVariableCodeSyntax('WEB', 'var(--' + name.replace(/\//g, '-') + ')');
    out[name] = v.id;
  }
  return out;
}

// --- Spacing (Tailwind 4px base) ---
const spacingColl = ensureCollection('Spacing', 'Value');
const spacing = ensureVars(spacingColl, {
  'spacing/3xs': 2,   // py-0.5
  'spacing/2xs': 4,   // gap-1
  'spacing/xs': 6,    // py-1.5
  'spacing/sm': 8,    // gap-2, px-2
  'spacing/md': 12,   // px-3, pt-3
  'spacing/base': 16, // p-4, gap-4
  'spacing/lg': 24,   // gap-6, px-6
  'spacing/xl': 32,   // py-8
  'spacing/2xl': 40,  // py-10
  'spacing/3xl': 48,  // py-12
  'spacing/4xl': 64,
}, ['GAP', 'WIDTH_HEIGHT'], 'spacing');

// --- Radius ---
const radiusColl = ensureCollection('Radius', 'Value');
const radius = ensureVars(radiusColl, {
  'radius/none': 0,
  'radius/sm': 4,     // rounded
  'radius/md': 6,
  'radius/lg': 8,     // rounded-lg
  'radius/xl': 12,    // rounded-xl
  'radius/full': 9999,// rounded-full
}, ['CORNER_RADIUS'], 'radius');

// --- Fixed sizes used across the layout ---
const sizeColl = ensureCollection('Size', 'Value');
const size = ensureVars(sizeColl, {
  'size/header-height': 64,   // h-16
  'size/container-max': 1280, // max-w-7xl
  'size/card-image': 160,     // h-40
  'size/hero-image': 384,     // w-96
  'size/cart-badge': 16,      // w-4 h-4
}, ['WIDTH_HEIGHT'], 'size');

return {
  collections: {
    spacing: spacingColl.id,
    radius: radiusColl.id,
    size: sizeColl.id,
  },
  spacing,
  radius,
  size,
};
