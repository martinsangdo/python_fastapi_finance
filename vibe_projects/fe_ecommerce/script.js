/**
 * FE Ecommerce — product listing.
 *
 * Organised in four layers, top to bottom:
 *   1. config   — values you are most likely to change
 *   2. api      — talking to the backend, returns plain data
 *   3. render   — turning data into DOM, knows nothing about fetch
 *   4. page     — wires the two together and starts things off
 *
 * Keeping the api and render layers unaware of each other is what makes a
 * second page (cart, product detail) cheap to add: reuse layers 1-3, write a
 * new layer 4.
 */

(function () {
    "use strict";

    /* ======================================================================
       1. Config
       ====================================================================== */

    var CONFIG = {
        apiBaseUrl: "http://localhost:8000",
        productsPath: "/api/products",
        // Without a timeout a dead backend leaves "Loading…" on screen forever.
        requestTimeoutMs: 10000,
        currency: "USD",
        locale: "en-US"
    };

    /* ======================================================================
       2. API layer
       Returns data or throws an Error with a message fit to show a user.
       ====================================================================== */

    var api = {
        /**
         * GET the product list.
         * @returns {Promise<Array<{id:number, sku:string, name:string, price:number}>>}
         */
        getProducts: function () {
            return api.request(CONFIG.productsPath).then(function (data) {
                if (!Array.isArray(data)) {
                    throw new Error("The server returned an unexpected response.");
                }
                return data;
            });
        },

        /**
         * Shared fetch wrapper: absolute URL, timeout, HTTP and JSON checks.
         * Every future endpoint should go through here.
         */
        request: function (path, options) {
            var controller = new AbortController();
            var timer = setTimeout(function () {
                controller.abort();
            }, CONFIG.requestTimeoutMs);

            var settings = Object.assign(
                { headers: { Accept: "application/json" }, signal: controller.signal },
                options || {}
            );

            return fetch(CONFIG.apiBaseUrl + path, settings)
                .then(function (response) {
                    if (!response.ok) {
                        throw new Error(
                            "The server responded with " +
                                response.status +
                                " " +
                                response.statusText +
                                "."
                        );
                    }
                    return response.json();
                })
                .catch(function (error) {
                    // fetch rejects identically for offline, DNS failure, CORS and
                    // abort, so translate to something a user can act on.
                    if (error.name === "AbortError") {
                        throw new Error(
                            "The request timed out. Is the API running at " +
                                CONFIG.apiBaseUrl +
                                "?"
                        );
                    }
                    if (error instanceof TypeError) {
                        throw new Error(
                            "Could not reach the API at " +
                                CONFIG.apiBaseUrl +
                                ". Check that it is running and allows requests from this page (CORS)."
                        );
                    }
                    throw error;
                })
                .finally(function () {
                    clearTimeout(timer);
                });
        }
    };

    /* ======================================================================
       3. Render layer
       ====================================================================== */

    var priceFormatter = new Intl.NumberFormat(CONFIG.locale, {
        style: "currency",
        currency: CONFIG.currency
    });

    /** Prices may arrive as a JSON number or as a decimal string. */
    function formatPrice(price) {
        var amount = typeof price === "number" ? price : parseFloat(price);
        return isNaN(amount) ? "—" : priceFormatter.format(amount);
    }

    var elements = {
        loading: document.getElementById("loading"),
        error: document.getElementById("error"),
        errorMessage: document.getElementById("error-message"),
        empty: document.getElementById("empty"),
        grid: document.getElementById("product-grid"),
        retry: document.getElementById("retry"),
        cardTemplate: document.getElementById("product-card-template")
    };

    /**
     * Show exactly one of the view states.
     * @param {"loading"|"error"|"empty"|"grid"} name
     */
    function showState(name) {
        ["loading", "error", "empty", "grid"].forEach(function (state) {
            elements[state].hidden = state !== name;
        });
    }

    function showError(message) {
        elements.errorMessage.textContent = message;
        showState("error");
    }

    /** Fill one cloned card. Add a field here and in the template together. */
    function fillProductCard(card, product) {
        card.querySelector('[data-field="sku"]').textContent = product.sku || "";
        card.querySelector('[data-field="name"]').textContent = product.name || "Untitled product";
        card.querySelector('[data-field="price"]').textContent = formatPrice(product.price);
        return card;
    }

    function renderProducts(products) {
        if (products.length === 0) {
            showState("empty");
            return;
        }

        // Build off-document, then swap in once: one reflow instead of N.
        var fragment = document.createDocumentFragment();
        products.forEach(function (product) {
            var card = elements.cardTemplate.content.cloneNode(true);
            fragment.appendChild(fillProductCard(card, product));
        });

        elements.grid.replaceChildren(fragment);
        showState("grid");
    }

    /* ======================================================================
       4. Page
       ====================================================================== */

    function loadProducts() {
        showState("loading");

        api.getProducts()
            .then(renderProducts)
            .catch(function (error) {
                showError(error.message);
                console.error("Failed to load products:", error);
            });
    }

    function init() {
        elements.retry.addEventListener("click", loadProducts);
        loadProducts();
    }

    init();
})();
