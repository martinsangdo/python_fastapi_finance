// Shared prelude. `use_figma` scripts are standalone, so PASTE THIS BLOCK at the top
// of scripts 05-08 (or keep it here and concatenate before sending).

// ---------- token lookup ----------
const _colorVars = await figma.variables.getLocalVariablesAsync('COLOR');
const _floatVars = await figma.variables.getLocalVariablesAsync('FLOAT');
const _textStyles = await figma.getLocalTextStylesAsync();
const _effectStyles = await figma.getLocalEffectStylesAsync();

const C = (name) => {
  const v = _colorVars.find((x) => x.name === name);
  if (!v) throw new Error('Missing color variable: ' + name);
  return v;
};
const N = (name) => {
  const v = _floatVars.find((x) => x.name === name);
  if (!v) throw new Error('Missing number variable: ' + name);
  return v;
};
const TS = (name) => {
  const s = _textStyles.find((x) => x.name === name);
  if (!s) throw new Error('Missing text style: ' + name);
  return s;
};
const ES = (name) => {
  const s = _effectStyles.find((x) => x.name === name);
  if (!s) throw new Error('Missing effect style: ' + name);
  return s;
};

// ---------- painting ----------
// Bind a solid fill to a semantic color variable.
function fill(node, varName) {
  let paint = { type: 'SOLID', color: { r: 0, g: 0, b: 0 } };
  paint = figma.variables.setBoundVariableForPaint(paint, 'color', C(varName));
  node.fills = [paint];
  return node;
}
function stroke(node, varName, weight) {
  let paint = { type: 'SOLID', color: { r: 0, g: 0, b: 0 } };
  paint = figma.variables.setBoundVariableForPaint(paint, 'color', C(varName));
  node.strokes = [paint];
  node.strokeWeight = weight == null ? 1 : weight;
  node.strokeAlign = 'INSIDE';
  return node;
}

// ---------- spacing / radius binding ----------
function pad(frame, { t = null, r = null, b = null, l = null, all = null } = {}) {
  const set = (prop, name) => { if (name) frame.setBoundVariable(prop, N(name)); };
  if (all) { set('paddingTop', all); set('paddingBottom', all); set('paddingLeft', all); set('paddingRight', all); return frame; }
  set('paddingTop', t); set('paddingBottom', b); set('paddingLeft', l); set('paddingRight', r);
  return frame;
}
function gap(frame, name) { frame.setBoundVariable('itemSpacing', N(name)); return frame; }
function radius(node, name) {
  node.setBoundVariable('topLeftRadius', N(name));
  node.setBoundVariable('topRightRadius', N(name));
  node.setBoundVariable('bottomLeftRadius', N(name));
  node.setBoundVariable('bottomRightRadius', N(name));
  return node;
}

// ---------- text ----------
// Fonts must already be loaded by the caller (see 04-styles.js STYLES list).
async function text(chars, styleName, colorVarName, opts = {}) {
  const t = figma.createText();
  // Load the style's own font before writing characters.
  const st = TS(styleName);
  await figma.loadFontAsync(st.fontName);
  t.fontName = st.fontName;
  t.characters = chars;
  await t.setTextStyleIdAsync(st.id);
  fill(t, colorVarName);
  if (opts.width) {
    t.textAutoResize = 'HEIGHT';   // must set BEFORE resize for wrapping text
    t.resize(opts.width, t.height);
  } else {
    t.textAutoResize = 'WIDTH_AND_HEIGHT';
  }
  if (opts.name) t.name = opts.name;
  if (opts.truncate) { t.maxLines = opts.truncate; t.textTruncation = 'ENDING'; }
  return t;
}

// ---------- icons (simple hand-drawn paths, 24x24 viewBox) ----------
const ICON_SVG = {
  'graduation-cap': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 3 1 8l11 5 9-4.09V15h2V8L12 3zM5 13.18V17c0 1.66 3.13 3 7 3s7-1.34 7-3v-3.82l-7 3.18-7-3.18z" fill="#000"/></svg>',
  'search': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="#000"/></svg>',
  'cart': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42a.25.25 0 0 1-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0 0 20 4H5.21l-.94-2H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" fill="#000"/></svg>',
  'star': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="m12 17.27 6.18 3.73-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27z" fill="#000"/></svg>',
  'star-half': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4V6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z" fill="#000"/></svg>',
};

function icon(name, size, colorVarName) {
  const svg = ICON_SVG[name];
  if (!svg) throw new Error('Unknown icon: ' + name);
  const node = figma.createNodeFromSvg(svg);
  node.name = 'icon/' + name;
  node.resize(size, size);
  // Recolor every vector inside the imported SVG frame.
  for (const child of node.findAll((n) => 'fills' in n)) {
    fill(child, colorVarName);
  }
  node.constrainProportions = true;
  return node;
}

// ---------- misc ----------
// Find a clear x to the right of everything already on the page (Rule 13).
function nextFreeX(pageNode, padding = 200) {
  const kids = pageNode.children;
  if (!kids.length) return 0;
  return Math.max(...kids.map((n) => n.x + n.width)) + padding;
}

async function ensurePage(name) {
  let p = figma.root.children.find((x) => x.name === name);
  if (!p) { p = figma.createPage(); p.name = name; }
  return p;
}
