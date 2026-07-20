"""Auto-Dashboard: upload a CSV and get an interactive dashboard.

The app profiles the uploaded dataset, classifies every column into a semantic
role (numeric / categorical / datetime / boolean / free text / identifier) and
then renders only the KPIs, tables and charts that make sense for that profile.

Run with:  streamlit run app.py
"""

from __future__ import annotations

import io
import warnings
from dataclasses import dataclass, field
from enum import Enum
from typing import Iterable, Sequence

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st

# --------------------------------------------------------------------------- #
# Configuration
# --------------------------------------------------------------------------- #

APP_TITLE = "CSV Auto-Dashboard"
MAX_PREVIEW_ROWS = 200
TOP_N_CATEGORIES = 15
# A text column with more distinct values than this is treated as an identifier
# or free text rather than a category worth charting.
MAX_CATEGORY_CARDINALITY = 50
# Share of non-null values that must parse as dates before a text column is
# promoted to a datetime column.
DATE_PARSE_THRESHOLD = 0.85
# Object columns whose values are almost all unique are identifiers.
IDENTIFIER_UNIQUENESS_RATIO = 0.95
PIE_MAX_SLICES = 8
SAMPLE_SIZE_FOR_INFERENCE = 1_000
SCATTER_MAX_POINTS = 5_000

PLOT_TEMPLATE = "plotly_white"
SEQUENTIAL_SCALE = "Blues"
DIVERGING_SCALE = "RdBu"

st.set_page_config(page_title=APP_TITLE, page_icon="📊", layout="wide")


# --------------------------------------------------------------------------- #
# Profiling
# --------------------------------------------------------------------------- #


class ColumnRole(str, Enum):
    NUMERIC = "numeric"
    DATETIME = "datetime"
    BOOLEAN = "boolean"
    CATEGORICAL = "categorical"
    IDENTIFIER = "identifier"
    TEXT = "text"
    EMPTY = "empty"


@dataclass(frozen=True)
class ColumnProfile:
    """Everything the renderers need to know about a single column."""

    name: str
    role: ColumnRole
    dtype: str
    n_missing: int
    n_unique: int
    n_rows: int

    @property
    def missing_pct(self) -> float:
        return 100.0 * self.n_missing / self.n_rows if self.n_rows else 0.0

    @property
    def is_constant(self) -> bool:
        return self.n_unique <= 1


@dataclass
class DatasetProfile:
    """Column roles for a dataframe, grouped for convenient lookup."""

    frame: pd.DataFrame
    columns: list[ColumnProfile] = field(default_factory=list)

    def by_role(self, *roles: ColumnRole) -> list[str]:
        wanted = set(roles)
        return [c.name for c in self.columns if c.role in wanted and not c.is_constant]

    @property
    def numeric(self) -> list[str]:
        return self.by_role(ColumnRole.NUMERIC)

    @property
    def datetime(self) -> list[str]:
        return self.by_role(ColumnRole.DATETIME)

    @property
    def categorical(self) -> list[str]:
        """Categorical + boolean columns that are small enough to chart."""
        candidates = self.by_role(ColumnRole.CATEGORICAL, ColumnRole.BOOLEAN)
        lookup = {c.name: c for c in self.columns}
        return [c for c in candidates if lookup[c].n_unique <= MAX_CATEGORY_CARDINALITY]

    @property
    def n_rows(self) -> int:
        return len(self.frame)

    @property
    def n_missing_cells(self) -> int:
        return int(self.frame.isna().sum().sum())


def _looks_like_dates(series: pd.Series) -> bool:
    """Cheap guard so numeric-ish strings are not parsed as dates."""
    sample = series.dropna().astype(str).head(SAMPLE_SIZE_FOR_INFERENCE)
    if sample.empty:
        return False
    separated = sample.str.contains(r"[-/:\s]").mean()
    return bool(separated >= DATE_PARSE_THRESHOLD)


def _parses_as_datetime(series: pd.Series) -> bool:
    sample = series.dropna().head(SAMPLE_SIZE_FOR_INFERENCE)
    if sample.empty:
        return False
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        try:
            parsed = pd.to_datetime(sample, errors="coerce", format="mixed")
        except (ValueError, TypeError):
            return False
    return bool(parsed.notna().mean() >= DATE_PARSE_THRESHOLD)


def classify_column(series: pd.Series) -> ColumnRole:
    """Assign a semantic role to a single column."""
    non_null = series.dropna()
    if non_null.empty:
        return ColumnRole.EMPTY

    if pd.api.types.is_bool_dtype(series):
        return ColumnRole.BOOLEAN
    if pd.api.types.is_datetime64_any_dtype(series):
        return ColumnRole.DATETIME
    if pd.api.types.is_numeric_dtype(series):
        # Low-cardinality integer codes (flags, ratings, ids-as-labels) behave
        # like categories, but keep them numeric so aggregations still work.
        return ColumnRole.NUMERIC

    n_unique = non_null.nunique()
    if n_unique <= 2:
        return ColumnRole.BOOLEAN
    if _looks_like_dates(non_null) and _parses_as_datetime(non_null):
        return ColumnRole.DATETIME
    if n_unique / len(non_null) >= IDENTIFIER_UNIQUENESS_RATIO:
        return ColumnRole.IDENTIFIER
    if n_unique <= MAX_CATEGORY_CARDINALITY:
        return ColumnRole.CATEGORICAL
    return ColumnRole.TEXT


def coerce_types(frame: pd.DataFrame) -> pd.DataFrame:
    """Convert detected date columns to real datetimes so charts can use them."""
    converted = frame.copy()
    for name in converted.columns:
        series = converted[name]
        if pd.api.types.is_object_dtype(series) and classify_column(series) is ColumnRole.DATETIME:
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                converted[name] = pd.to_datetime(series, errors="coerce", format="mixed")
    return converted


def profile_dataset(frame: pd.DataFrame) -> DatasetProfile:
    n_rows = len(frame)
    columns = [
        ColumnProfile(
            name=name,
            role=classify_column(frame[name]),
            dtype=str(frame[name].dtype),
            n_missing=int(frame[name].isna().sum()),
            n_unique=int(frame[name].nunique(dropna=True)),
            n_rows=n_rows,
        )
        for name in frame.columns
    ]
    return DatasetProfile(frame=frame, columns=columns)


@st.cache_data(show_spinner="Reading CSV…")
def load_csv(raw: bytes, separator: str | None) -> pd.DataFrame:
    """Read the uploaded bytes into a dataframe with types coerced."""
    kwargs: dict = {"sep": separator} if separator else {"sep": None, "engine": "python"}
    frame = pd.read_csv(io.BytesIO(raw), **kwargs)
    frame.columns = [str(c).strip() for c in frame.columns]
    return coerce_types(frame)


# --------------------------------------------------------------------------- #
# Formatting helpers
# --------------------------------------------------------------------------- #


def human_number(value: float) -> str:
    """Compact, readable representation of a number for KPI tiles."""
    if pd.isna(value):
        return "—"
    magnitude = abs(value)
    for threshold, suffix in ((1e12, "T"), (1e9, "B"), (1e6, "M"), (1e3, "K")):
        if magnitude >= threshold:
            return f"{value / threshold:,.2f}{suffix}"
    if magnitude >= 1 or value == 0:
        return f"{value:,.2f}".rstrip("0").rstrip(".")
    return f"{value:,.4g}"


def style_figure(fig: go.Figure, height: int = 380) -> go.Figure:
    fig.update_layout(
        template=PLOT_TEMPLATE,
        height=height,
        margin=dict(l=10, r=10, t=50, b=10),
        title_font_size=15,
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
    )
    return fig


def show(fig: go.Figure, height: int = 380) -> None:
    st.plotly_chart(style_figure(fig, height), use_container_width=True)


def chunk(items: Sequence, size: int) -> Iterable[Sequence]:
    for start in range(0, len(items), size):
        yield items[start : start + size]


# --------------------------------------------------------------------------- #
# Sections
# --------------------------------------------------------------------------- #


def render_overview(profile: DatasetProfile) -> None:
    st.subheader("Overview")
    frame = profile.frame
    total_cells = frame.size or 1
    cols = st.columns(5)
    cols[0].metric("Rows", f"{profile.n_rows:,}")
    cols[1].metric("Columns", f"{len(frame.columns):,}")
    cols[2].metric("Numeric columns", f"{len(profile.numeric):,}")
    cols[3].metric("Categorical columns", f"{len(profile.categorical):,}")
    cols[4].metric("Missing cells", f"{100 * profile.n_missing_cells / total_cells:.1f}%")

    numeric = profile.numeric
    if not numeric:
        return

    st.markdown("**Key numeric indicators**")
    highlights = numeric[:4]
    for row in chunk(highlights, 4):
        tiles = st.columns(len(row))
        for tile, name in zip(tiles, row):
            series = frame[name].dropna()
            if series.empty:
                continue
            tile.metric(
                label=f"{name} — total",
                value=human_number(series.sum()),
                delta=f"avg {human_number(series.mean())}",
                delta_color="off",
            )


def render_schema(profile: DatasetProfile) -> None:
    st.subheader("Dataset structure")
    schema = pd.DataFrame(
        [
            {
                "Column": c.name,
                "Detected type": c.role.value,
                "Pandas dtype": c.dtype,
                "Unique values": c.n_unique,
                "Missing": c.n_missing,
                "Missing %": round(c.missing_pct, 2),
            }
            for c in profile.columns
        ]
    )
    st.dataframe(schema, use_container_width=True, hide_index=True)

    incomplete = schema[schema["Missing"] > 0].sort_values("Missing %", ascending=False)
    if not incomplete.empty:
        fig = px.bar(
            incomplete,
            x="Missing %",
            y="Column",
            orientation="h",
            title="Missing values by column",
            color="Missing %",
            color_continuous_scale=SEQUENTIAL_SCALE,
        )
        fig.update_layout(coloraxis_showscale=False, yaxis=dict(autorange="reversed"))
        show(fig, height=max(280, 30 * len(incomplete)))
    else:
        st.success("No missing values detected.")


def render_preview(profile: DatasetProfile) -> None:
    st.subheader("Data preview")
    st.caption(f"First {min(MAX_PREVIEW_ROWS, profile.n_rows):,} rows.")
    st.dataframe(profile.frame.head(MAX_PREVIEW_ROWS), use_container_width=True)

    numeric = profile.numeric
    if numeric:
        st.markdown("**Descriptive statistics**")
        stats = profile.frame[numeric].describe().T
        stats["missing"] = profile.frame[numeric].isna().sum()
        st.dataframe(stats.round(3), use_container_width=True)


def render_numeric(profile: DatasetProfile) -> None:
    numeric = profile.numeric
    if not numeric:
        st.info("No numeric columns detected — distribution charts were skipped.")
        return

    st.subheader("Numeric distributions")
    selected = st.multiselect(
        "Columns to plot",
        options=numeric,
        default=numeric[:4],
        key="numeric_columns",
    )
    for row in chunk(selected, 2):
        cols = st.columns(len(row))
        for col, name in zip(cols, row):
            series = profile.frame[name].dropna()
            if series.empty:
                continue
            with col:
                fig = px.histogram(
                    profile.frame,
                    x=name,
                    nbins=min(50, max(10, series.nunique())),
                    marginal="box",
                    title=f"Distribution of {name}",
                    color_discrete_sequence=["#2E74B5"],
                )
                show(fig, height=360)


def render_categorical(profile: DatasetProfile) -> None:
    categorical = profile.categorical
    if not categorical:
        st.info("No categorical columns with a chartable number of values were detected.")
        return

    st.subheader("Categorical breakdown")
    column = st.selectbox("Category", options=categorical, key="category_column")
    counts = (
        profile.frame[column]
        .astype(str)
        .value_counts()
        .head(TOP_N_CATEGORIES)
        .rename_axis(column)
        .reset_index(name="Count")
    )
    counts["Share %"] = (100 * counts["Count"] / len(profile.frame)).round(2)

    left, right = st.columns([3, 2])
    with left:
        fig = px.bar(
            counts,
            x="Count",
            y=column,
            orientation="h",
            title=f"Top values of {column}",
            color="Count",
            color_continuous_scale=SEQUENTIAL_SCALE,
        )
        fig.update_layout(coloraxis_showscale=False, yaxis=dict(autorange="reversed"))
        show(fig, height=max(320, 28 * len(counts)))
    with right:
        # A pie chart only communicates well with a handful of slices.
        if len(counts) <= PIE_MAX_SLICES:
            fig = px.pie(counts, names=column, values="Count", hole=0.45, title="Composition")
            show(fig, height=max(320, 28 * len(counts)))
        else:
            st.dataframe(counts, use_container_width=True, hide_index=True)

    numeric = profile.numeric
    if numeric:
        st.markdown("**Aggregated metrics by category**")
        measure = st.selectbox("Measure", options=numeric, key="category_measure")
        grouped = (
            profile.frame.groupby(profile.frame[column].astype(str), dropna=False)[measure]
            .agg(Count="count", Sum="sum", Mean="mean", Median="median")
            .sort_values("Sum", ascending=False)
            .head(TOP_N_CATEGORIES)
            .reset_index()
        )
        st.dataframe(grouped.round(3), use_container_width=True, hide_index=True)
        fig = px.bar(
            grouped,
            x=grouped.columns[0],
            y="Sum",
            title=f"Total {measure} by {column}",
            color_discrete_sequence=["#2E74B5"],
        )
        show(fig)


def render_time_series(profile: DatasetProfile) -> None:
    dates = profile.datetime
    if not dates:
        st.info("No date columns detected — time series charts were skipped.")
        return

    st.subheader("Trends over time")
    date_col = st.selectbox("Date column", options=dates, key="date_column")
    series_dates = profile.frame[date_col].dropna()
    if series_dates.nunique() < 3:
        st.info(f"`{date_col}` has too few distinct dates to plot a trend.")
        return

    granularity = st.radio(
        "Granularity",
        options=["Day", "Week", "Month", "Quarter", "Year"],
        index=2,
        horizontal=True,
        key="granularity",
    )
    freq = {"Day": "D", "Week": "W", "Month": "MS", "Quarter": "QS", "Year": "YS"}[granularity]

    numeric = profile.numeric
    measure = st.selectbox(
        "Measure",
        options=["Record count"] + numeric,
        key="time_measure",
    )

    working = profile.frame.dropna(subset=[date_col]).set_index(date_col).sort_index()
    if measure == "Record count":
        resampled = working.resample(freq).size().rename("Records").reset_index()
        y_col = "Records"
    else:
        resampled = working[measure].resample(freq).sum().reset_index()
        y_col = measure

    if len(resampled) < 2:
        st.info("Not enough periods at this granularity to draw a trend.")
        return

    fig = px.line(
        resampled,
        x=date_col,
        y=y_col,
        markers=len(resampled) <= 60,
        title=f"{y_col} by {granularity.lower()}",
        color_discrete_sequence=["#2E74B5"],
    )
    show(fig, height=400)

    # Split the same trend by a category when one is available and compact.
    categorical = [c for c in profile.categorical if profile.frame[c].nunique() <= PIE_MAX_SLICES]
    if categorical:
        split_by = st.selectbox("Split by (optional)", options=["None"] + categorical, key="ts_split")
        if split_by != "None":
            source = profile.frame.dropna(subset=[date_col]).copy()
            source[split_by] = source[split_by].astype(str)
            buckets = source.groupby([pd.Grouper(key=date_col, freq=freq), split_by])
            aggregated = buckets.size() if measure == "Record count" else buckets[measure].sum()
            grouped = aggregated.rename("value").reset_index()
            fig = px.line(
                grouped,
                x=date_col,
                y="value",
                color=split_by,
                title=f"{y_col} by {granularity.lower()} and {split_by}",
            )
            fig.update_yaxes(title=y_col)
            show(fig, height=400)


def render_relationships(profile: DatasetProfile) -> None:
    numeric = profile.numeric
    if len(numeric) < 2:
        st.info("At least two numeric columns are required for correlation analysis.")
        return

    st.subheader("Relationships")
    corr = profile.frame[numeric].corr(numeric_only=True)
    fig = px.imshow(
        corr,
        text_auto=".2f",
        zmin=-1,
        zmax=1,
        color_continuous_scale=DIVERGING_SCALE,
        title="Correlation matrix",
        aspect="auto",
    )
    show(fig, height=max(360, 40 * len(numeric)))

    left, right = st.columns(2)
    x_col = left.selectbox("X axis", options=numeric, index=0, key="scatter_x")
    y_options = [c for c in numeric if c != x_col]
    y_col = right.selectbox("Y axis", options=y_options, index=0, key="scatter_y")

    categorical = [c for c in profile.categorical if profile.frame[c].nunique() <= PIE_MAX_SLICES]
    color_by = st.selectbox("Colour by (optional)", options=["None"] + categorical, key="scatter_color")

    plot_frame = profile.frame[[x_col, y_col] + ([color_by] if color_by != "None" else [])].dropna()
    if plot_frame.empty:
        st.info("No overlapping non-null values for the selected columns.")
        return
    if len(plot_frame) > SCATTER_MAX_POINTS:
        plot_frame = plot_frame.sample(SCATTER_MAX_POINTS, random_state=0)
        st.caption(f"Sampled {SCATTER_MAX_POINTS:,} points for readability.")

    fig = px.scatter(
        plot_frame,
        x=x_col,
        y=y_col,
        color=None if color_by == "None" else plot_frame[color_by].astype(str),
        opacity=0.7,
        trendline="ols" if color_by == "None" else None,
        title=f"{y_col} vs {x_col}",
    )
    if color_by != "None":
        fig.update_layout(legend_title_text=color_by)
    show(fig, height=430)


# --------------------------------------------------------------------------- #
# Application shell
# --------------------------------------------------------------------------- #


def render_sidebar() -> tuple[bytes | None, str | None]:
    with st.sidebar:
        st.header("Data source")
        upload = st.file_uploader("Upload a CSV file", type=["csv", "txt"])
        separator_label = st.selectbox(
            "Delimiter",
            options=["Auto-detect", "Comma (,)", "Semicolon (;)", "Tab", "Pipe (|)"],
        )
        separator = {
            "Auto-detect": None,
            "Comma (,)": ",",
            "Semicolon (;)": ";",
            "Tab": "\t",
            "Pipe (|)": "|",
        }[separator_label]
        st.caption("Columns are profiled automatically; only relevant charts are shown.")
    return (upload.getvalue() if upload else None), separator


def render_empty_state() -> None:
    st.info("Upload a CSV file from the sidebar to generate the dashboard.")
    st.markdown(
        """
        **What happens next**

        1. The file is parsed and every column is profiled.
        2. Columns are classified as numeric, categorical, date, boolean, identifier or free text.
        3. KPIs, tables and charts are selected to match the detected structure —
           anything that would not be meaningful for this dataset is skipped.
        """
    )


def main() -> None:
    st.title(APP_TITLE)
    st.caption("Upload a CSV and get an interactive dashboard tailored to its structure.")

    raw, separator = render_sidebar()
    if raw is None:
        render_empty_state()
        return

    try:
        frame = load_csv(raw, separator)
    except Exception as exc:  # noqa: BLE001 - surfaced to the user verbatim
        st.error(f"Could not read the CSV file: {exc}")
        return

    if frame.empty:
        st.warning("The uploaded file contains no rows.")
        return

    profile = profile_dataset(frame)

    tabs = st.tabs(
        ["Overview", "Data", "Distributions", "Categories", "Trends", "Relationships"]
    )
    with tabs[0]:
        render_overview(profile)
        render_schema(profile)
    with tabs[1]:
        render_preview(profile)
    with tabs[2]:
        render_numeric(profile)
    with tabs[3]:
        render_categorical(profile)
    with tabs[4]:
        render_time_series(profile)
    with tabs[5]:
        render_relationships(profile)


if __name__ == "__main__":
    main()
