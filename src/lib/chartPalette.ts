/**
 * Categorical chart palette, validated against the ReadScore chart surface
 * (--bg-surface, #1c1a17) with the dataviz skill's six-checks validator: lightness
 * band, chroma floor, and contrast all PASS; worst all-pairs CVD separation is a
 * floor-band WARN (red↔aqua, ΔE 9.7), which is legal only with secondary encoding —
 * every chart using this palette ships direct labels + a legend, satisfying that.
 * Re-run scripts/validate_palette.js (dataviz skill) against the new surface if
 * --bg-surface ever changes.
 */
export const CHART_CATEGORICAL = ['#c98500', '#199e70', '#9085e9', '#008300', '#d95926', '#e66767']
export const CHART_OTHER = '#6b6a63'
