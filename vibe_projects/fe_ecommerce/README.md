# fe_ecommerce

A minimal product listing front end. HTML, CSS and vanilla JavaScript only — no
frameworks, no bundler, no install step.

```
fe_ecommerce/
├── index.html   markup + one container per view state
├── style.css    design tokens, layout, card and state styling
├── script.js    config → api → render → page
└── README.md
```

## Running

Open `index.html` directly if you like, but prefer a static server — `file://`
pages send a `null` origin that most CORS setups reject:

```bash
cd vibe_projects/fe_ecommerce
python3 -m http.server 5500
# then visit http://localhost:5500
```

## Backend contract

On load the page issues:

```
GET http://localhost:8000/api/products
```

and expects a JSON array:

```json
[
  { "id": 1, "sku": "SKU-001", "name": "Blue Frock", "price": 29.99 }
]
```

`price` may be a number or a decimal string — both render correctly. Unknown
extra fields are ignored.

Change the host or path at the top of `script.js`:

```js
var CONFIG = {
    apiBaseUrl: "http://localhost:8000",
    productsPath: "/api/products",
    ...
};
```

The backend in `../fastapi_template` already serves this endpoint. Start it with:

```bash
cd ../fastapi_template
uvicorn app:app --reload
```

### CORS

The page and the API are different origins (`:5500` vs `:8000`), so the API must
send `Access-Control-Allow-Origin`. `../fastapi_template/app.py` is already
configured for it:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5500", "http://127.0.0.1:5500"],
    allow_methods=["GET"],
)
```

If you serve this page from a different port, add that origin to the list.
Otherwise the request fails and the page shows the "could not reach the API"
error — the browser console will name CORS as the cause.

## View states

The page is always in exactly one of four states, each its own container in
`index.html`, toggled by `showState()`:

| State     | When                                       |
| --------- | ------------------------------------------ |
| `loading` | while the request is in flight             |
| `error`   | unreachable, timed out, or non-2xx status  |
| `empty`   | request succeeded, array was empty         |
| `grid`    | request succeeded with at least one product |

The error state includes a **Try again** button that re-runs the request, and
requests time out after 10s so a dead backend never leaves the page spinning.

## Extending

**Add a field to the card** — add the element to the `<template>` in
`index.html` with a `data-field` attribute, then set it in `fillProductCard()`.

**Add an endpoint** — add a method to the `api` object. Route it through
`api.request()` so it inherits the timeout, status checking and error
translation:

```js
getProduct: function (id) {
    return api.request("/api/products/" + id);
}
```

**Add a page** — copy `index.html`, keep the header and `style.css`, and give it
its own script. The `api` and render helpers are written to be independent of
each other, so a new page reuses them and only supplies its own wiring. If pages
start sharing logic, split `script.js` into ES modules (`api.js`, `render.js`)
and load with `<script type="module">` — still no build step.

## Notes

- `replaceChildren()` and `AbortController` are used, so a current browser is
  required — no polyfills or transpilation.
- All product text is set via `textContent`, never `innerHTML`, so API values
  cannot inject markup.
- Dark mode follows the OS setting via `prefers-color-scheme`.
