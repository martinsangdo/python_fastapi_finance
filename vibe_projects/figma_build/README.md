# SkillVerse → Figma build scripts

Converts [`vibe_1_page_2_figma.html`](../vibe_1_page_2_figma.html) into an editable Figma
design system + desktop screen.

**Target file:** https://www.figma.com/design/q0kiKM3oe31n33K0WpFjRw
**File key:** `q0kiKM3oe31n33K0WpFjRw`

## Status

The file was created, but **no content has been written yet** — the Figma MCP server
returned `You've reached the Figma MCP tool call limit on the Starter plan` on the first
write attempt. These scripts are the finished work, pending execution.

Two separate blockers to clear first:

1. **MCP tool-call quota** — Starter plan cap. Upgrade, or wait for the rolling window.
2. **Seat type** — `whoami` reports a `View` seat on `Sang Do's team`. View seats cannot
   edit design files. A Full/Design seat is required regardless of quota.

## How to run

Each numbered file is the body of one `use_figma` call against the file key above.

Scripts **05–10 require the `_helpers.js` prelude pasted at the top** — `use_figma`
executes each script in a fresh context, so there is no shared module scope. Scripts
01–04 are self-contained.

Run **strictly in order**, and never in parallel — Figma state mutations must be
sequential.

| # | Script | Creates |
|---|--------|---------|
| 01 | `01-primitives.js` | `Primitives` collection — 31 raw Tailwind colours, scopes `[]` (hidden from pickers) |
| 02 | `02-semantic-color.js` | `Color` collection — 38 semantic tokens aliased to primitives, scoped per use |
| 03 | `03-spacing-radius.js` | `Spacing` (11), `Radius` (6), `Size` (5) float tokens |
| 04 | `04-styles.js` | 17 text styles, ~38 paint styles (each bound to its colour variable), 3 effect styles |
| 05 | `05-pages.js` | Page skeleton: Cover / Foundations / Components / Desktop |
| 06 | `06-atoms-a.js` | `Button` (2 variants), `Badge` (2), `Category Tag` (4) |
| 07 | `07-atoms-b.js` | `Logo` (2), `Search Field`, `Category Tab` (2), `Rating`, `Nav Link`, `Footer Link`, `Cart Icon` |
| 08 | `08-course-card.js` | `Course Card` — the repeated grid element, composing Badge + Rating + Category Tag |
| 09 | `09-screen-header-hero.js` | 1440px screen frame, Header, Hero |
| 10 | `10-screen-main-footer.js` | Category tabs, section heading, 4-card grid, Footer + screenshot |

All scripts are idempotent where practical (variables and styles are matched by name),
so a partial run can be resumed by re-running from the failed step.

## How the HTML maps across

**Layout** — the 1440px frame reproduces the `xl:` breakpoint: `max-w-7xl` (1280) with
80px side gutters, `xl:grid-cols-4` course grid at `gap-6`. Every container is Auto
Layout; nothing is absolutely positioned except the card badge and the cart counter,
which are absolute in the source too.

**Repeated elements → components.** The four `.course-card` divs collapse into one
`Course Card` component with TEXT properties (Title, Instructor, Price, Original Price)
and a BOOLEAN `Show Badge` — card 4 has no ribbon in the HTML, which that boolean
reproduces without a second variant. The five `.category-btn` tabs collapse into a
2-variant `Category Tab`; the two header buttons into a 2-variant `Button`.

**Tokens** — spacing/radius/size are bound via `setBoundVariable`, not typed in. The
Tailwind classes map directly: `p-4` → `spacing/base`, `gap-6` → `spacing/lg`,
`rounded-xl` → `radius/xl`, `h-16` → `size/header-height`.

## Known limitations

- **Icons are redrawn, not FontAwesome.** `_helpers.js` ships simplified 24×24 paths for
  graduation-cap, search, cart, star, and star-half. Swap in the real icon set if you
  have one in a library.
- **Hero gradient is not tokenised.** Figma cannot bind variables to gradient stops, so
  `bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900` is a literal 3-stop
  linear gradient. The values mirror the primitives and are commented as such.
- **Images depend on sandbox network access.** Scripts 08 and 09 attempt
  `figma.createImageAsync` against the Unsplash URLs and fall back to a muted placeholder
  fill if the plugin sandbox blocks the request. The return value reports `imageLoaded` /
  `heroImageLoaded` so you know which you got.
- **Responsive variants are not built.** The HTML has `sm:`/`md:`/`lg:`/`xl:` breakpoints;
  only the `xl` desktop layout is reproduced. Mobile/tablet frames would be a follow-up.
- **Interactivity is not reproduced.** The `filterCourses()` / `filterCategory()` search
  and tab-filter behaviour has no Figma equivalent beyond prototype wiring, which is out
  of scope here.

## If quota is tight

Scripts 01–04 can be concatenated into a single `use_figma` call (they share no runtime
state, only ordering), and 06–08 likewise if `_helpers.js` is prepended once. That takes
the build from 10 calls down to 4:

1. `01 + 02 + 03 + 04` — all foundations
2. `05` — pages
3. `_helpers + 06 + 07 + 08` — all components
4. `_helpers + 09 + 10` — the screen

Batching trades away per-step validation, so prefer the 10-call version if you have room.
