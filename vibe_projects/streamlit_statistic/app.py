"""Top-selling products dashboard.

Reads every cart from the dummyjson carts API, aggregates the line items by
product and shows the best sellers with their revenue and quantity.

Run with:  streamlit run app.py
"""

from __future__ import annotations

import pandas as pd
import requests
import streamlit as st

# --------------------------------------------------------------------------- #
# Configuration
# --------------------------------------------------------------------------- #

APP_TITLE = "Top Selling Products"
CARTS_URL = "https://dummyjson.com/carts"
# The API paginates at 30 items by default; limit=0 returns every cart.
PAGE_LIMIT = 0
REQUEST_TIMEOUT = 15
TOP_N = 5
CACHE_TTL = 600  # seconds

st.set_page_config(page_title=APP_TITLE, page_icon="🛒", layout="wide")


# --------------------------------------------------------------------------- #
# Data
# --------------------------------------------------------------------------- #


@st.cache_data(ttl=CACHE_TTL, show_spinner="Fetching carts…")
def fetch_line_items() -> pd.DataFrame:
    """One row per product line across all carts."""
    response = requests.get(
        CARTS_URL, params={"limit": PAGE_LIMIT}, timeout=REQUEST_TIMEOUT
    )
    response.raise_for_status()
    carts = response.json().get("carts", [])

    rows = [
        {
            "cart_id": cart["id"],
            "id": product["id"],
            "title": product["title"],
            "price": product["price"],
            "quantity": product["quantity"],
            # `total` is price * quantity before the cart discount.
            "total": product["total"],
            "thumbnail": product["thumbnail"],
        }
        for cart in carts
        for product in cart.get("products", [])
    ]
    return pd.DataFrame(rows)


def aggregate_products(line_items: pd.DataFrame) -> pd.DataFrame:
    """Collapse the line items into one row per product."""
    aggregated = (
        line_items.groupby(["id", "title"], as_index=False)
        .agg(
            price=("price", "first"),
            total_revenue=("total", "sum"),
            total_quantity=("quantity", "sum"),
            thumbnail=("thumbnail", "first"),
            carts=("cart_id", "nunique"),
        )
        .round({"total_revenue": 2})
    )
    return aggregated


# --------------------------------------------------------------------------- #
# Rendering
# --------------------------------------------------------------------------- #


def render_summary(line_items: pd.DataFrame, products: pd.DataFrame) -> None:
    cols = st.columns(4)
    cols[0].metric("Carts", f"{line_items['cart_id'].nunique():,}")
    cols[1].metric("Distinct products", f"{len(products):,}")
    cols[2].metric("Units sold", f"{int(products['total_quantity'].sum()):,}")
    # Compact form so the tile does not truncate at narrow widths.
    cols[3].metric("Total revenue", f"${products['total_revenue'].sum() / 1e6:,.2f}M")


def render_top_products(top: pd.DataFrame) -> None:
    for rank, product in enumerate(top.itertuples(index=False), start=1):
        image, details = st.columns([1, 5])
        with image:
            st.image(product.thumbnail, width=120)
        with details:
            st.markdown(f"**#{rank} · {product.title}**  \n`id {product.id}`")
            metrics = st.columns(3)
            metrics[0].metric("Unit price", f"${product.price:,.2f}")
            metrics[1].metric("Total revenue", f"${product.total_revenue:,.2f}")
            metrics[2].metric("Total quantity", f"{int(product.total_quantity):,}")
        st.divider()


def render_table(top: pd.DataFrame) -> None:
    table = top[
        ["thumbnail", "id", "title", "price", "total_revenue", "total_quantity"]
    ]
    st.dataframe(
        table,
        width="stretch",
        hide_index=True,
        column_config={
            "thumbnail": st.column_config.ImageColumn("Thumbnail"),
            "id": st.column_config.NumberColumn("ID"),
            "title": st.column_config.TextColumn("Title"),
            "price": st.column_config.NumberColumn("Price", format="$%.2f"),
            "total_revenue": st.column_config.NumberColumn(
                "Total revenue", format="$%.2f"
            ),
            "total_quantity": st.column_config.NumberColumn("Total quantity"),
        },
    )


def main() -> None:
    st.title(APP_TITLE)
    st.caption(f"Sales aggregated from all carts returned by {CARTS_URL}")

    with st.sidebar:
        st.header("Options")
        rank_by_label = st.radio(
            "Rank best sellers by",
            options=["Total revenue", "Total quantity"],
            help="Revenue is price × quantity summed across every cart.",
        )
        top_n = st.slider("How many products", min_value=3, max_value=20, value=TOP_N)
        if st.button("Refresh data"):
            fetch_line_items.clear()

    try:
        line_items = fetch_line_items()
    except requests.RequestException as exc:
        st.error(f"Could not load data from the API: {exc}")
        return

    if line_items.empty:
        st.warning("The API returned no carts.")
        return

    products = aggregate_products(line_items)
    rank_by = {
        "Total revenue": "total_revenue",
        "Total quantity": "total_quantity",
    }[rank_by_label]
    top = products.sort_values(rank_by, ascending=False).head(top_n)

    render_summary(line_items, products)
    st.subheader(f"Top {len(top)} products by {rank_by_label.lower()}")

    cards_tab, table_tab = st.tabs(["Cards", "Table"])
    with cards_tab:
        render_top_products(top)
    with table_tab:
        render_table(top)


if __name__ == "__main__":
    main()
