// Phase 1c/1d/1e — Semantic color variables, aliased to Primitives.
// PREREQ: run 01-primitives.js first.
// Returns { collectionId, modeId, variables: { name -> id } }.

const prims = await figma.variables.getLocalVariablesAsync('COLOR');
const collections = await figma.variables.getLocalVariableCollectionsAsync();
const primColl = collections.find((c) => c.name === 'Primitives');
if (!primColl) throw new Error('Run 01-primitives.js first — "Primitives" collection not found.');

const P = {};
for (const v of prims) {
  if (v.variableCollectionId === primColl.id) P[v.name] = v;
}

// name -> [primitive, scopes]
const BG = ['FRAME_FILL', 'SHAPE_FILL'];
const TX = ['TEXT_FILL'];
const ST = ['STROKE_COLOR'];

const SEMANTIC = {
  'color/bg/page':            ['gray/50', BG],
  'color/bg/surface':         ['white', BG],
  'color/bg/muted':           ['gray/100', BG],
  'color/bg/inverse':         ['gray/900', BG],
  'color/bg/brand':           ['indigo/600', BG],
  'color/bg/brand-hover':     ['indigo/700', BG],
  'color/bg/brand-subtle':    ['indigo/50', BG],
  'color/bg/hero-start':      ['indigo/900', BG],
  'color/bg/hero-mid':        ['indigo/800', BG],
  'color/bg/hero-end':        ['purple/900', BG],
  'color/bg/badge-bestseller':['yellow/400', BG],
  'color/bg/badge-new':       ['emerald/500', BG],
  'color/bg/tag-webdev':      ['indigo/50', BG],
  'color/bg/tag-data':        ['emerald/50', BG],
  'color/bg/tag-design':      ['pink/50', BG],
  'color/bg/tag-business':    ['blue/50', BG],

  'color/text/primary':       ['gray/900', TX],
  'color/text/secondary':     ['gray/600', TX],
  'color/text/muted':         ['gray/500', TX],
  'color/text/subtle':        ['gray/400', TX],
  'color/text/inverse':       ['white', TX],
  'color/text/brand':         ['indigo/600', TX],
  'color/text/on-hero':       ['indigo/100', TX],
  'color/text/hero-eyebrow':  ['indigo/200', TX],
  'color/text/rating':        ['amber/600', TX],
  'color/text/footer':        ['gray/400', TX],
  'color/text/footer-muted':  ['gray/500', TX],
  'color/text/tag-webdev':    ['indigo/600', TX],
  'color/text/tag-data':      ['emerald/600', TX],
  'color/text/tag-design':    ['pink/600', TX],
  'color/text/tag-business':  ['blue/600', TX],

  'color/border/default':     ['gray/200', ST],
  'color/border/subtle':      ['gray/100', ST],
  'color/border/brand':       ['indigo/600', ST],
  'color/border/footer':      ['gray/800', ST],

  'color/icon/star':          ['amber/400', TX],
  'color/icon/muted':         ['gray/400', TX],
  'color/icon/brand':         ['indigo/500', TX],
};

let coll = collections.find((c) => c.name === 'Color');
if (!coll) {
  coll = figma.variables.createVariableCollection('Color');
  coll.renameMode(coll.modes[0].modeId, 'Light');
}
const modeId = coll.modes[0].modeId;

const variables = {};
const missing = [];

for (const [name, [primName, scopes]] of Object.entries(SEMANTIC)) {
  const prim = P[primName];
  if (!prim) { missing.push(primName); continue; }
  let v = prims.find((x) => x.name === name && x.variableCollectionId === coll.id);
  if (!v) v = figma.variables.createVariable(name, coll, 'COLOR');
  v.setValueForMode(modeId, { type: 'VARIABLE_ALIAS', id: prim.id });
  v.scopes = scopes;
  v.setVariableCodeSyntax('WEB', 'var(--' + name.replace(/\//g, '-') + ')');
  variables[name] = v.id;
}

if (missing.length) throw new Error('Missing primitives: ' + missing.join(', '));

return { collectionId: coll.id, modeId, count: Object.keys(variables).length, variables };
