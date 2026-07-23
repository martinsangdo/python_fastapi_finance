// Phase 1a/1b — Primitive color variables (raw Tailwind values used by the page).
// Run via use_figma. Returns { collectionId, modeId, variables: { name -> id } }.

const hex = (h) => {
  h = h.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16) / 255,
    g: parseInt(h.slice(2, 4), 16) / 255,
    b: parseInt(h.slice(4, 6), 16) / 255,
  };
};

const PRIMITIVES = {
  'white': '#FFFFFF',

  'gray/50': '#F9FAFB',
  'gray/100': '#F3F4F6',
  'gray/200': '#E5E7EB',
  'gray/400': '#9CA3AF',
  'gray/500': '#6B7280',
  'gray/600': '#4B5563',
  'gray/700': '#374151',
  'gray/800': '#1F2937',
  'gray/900': '#111827',

  'indigo/50': '#EEF2FF',
  'indigo/100': '#E0E7FF',
  'indigo/200': '#C7D2FE',
  'indigo/400': '#818CF8',
  'indigo/500': '#6366F1',
  'indigo/600': '#4F46E5',
  'indigo/700': '#4338CA',
  'indigo/800': '#3730A3',
  'indigo/900': '#312E81',

  'purple/900': '#581C87',

  'yellow/400': '#FACC15',
  'amber/400': '#FBBF24',
  'amber/600': '#D97706',

  'emerald/50': '#ECFDF5',
  'emerald/500': '#10B981',
  'emerald/600': '#059669',

  'pink/50': '#FDF2F8',
  'pink/600': '#DB2777',

  'blue/50': '#EFF6FF',
  'blue/600': '#2563EB',
};

const existing = await figma.variables.getLocalVariableCollectionsAsync();
let coll = existing.find((c) => c.name === 'Primitives');
if (!coll) {
  coll = figma.variables.createVariableCollection('Primitives');
  coll.renameMode(coll.modes[0].modeId, 'Value');
}
const modeId = coll.modes[0].modeId;

const all = await figma.variables.getLocalVariablesAsync('COLOR');
const variables = {};

for (const [name, value] of Object.entries(PRIMITIVES)) {
  let v = all.find((x) => x.name === name && x.variableCollectionId === coll.id);
  if (!v) v = figma.variables.createVariable(name, coll, 'COLOR');
  v.setValueForMode(modeId, hex(value));
  // Primitives are hidden from pickers — only semantics should be selectable.
  v.scopes = [];
  v.setVariableCodeSyntax('WEB', 'var(--' + name.replace(/\//g, '-') + ')');
  variables[name] = v.id;
}

return { collectionId: coll.id, modeId, count: Object.keys(variables).length, variables };
