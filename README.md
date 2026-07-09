# ShelfScore

Personal, single-user reading tracker. Fully client-side (React + Vite + TypeScript),
data stored in IndexedDB, book search/metadata via the [Open Library API](https://openlibrary.org/developers/api).
See [book-tracker-spec.md](../book-tracker-spec.md) (or wherever you keep the spec) for the full feature spec.

## Project layout

```
src/
  types/book.ts        Book data model (single primary genre — see spec decision)
  lib/db.ts             IndexedDB wrapper (get/save/delete/export/import)
  lib/openLibrary.ts    Open Library search + cover URL helpers
  lib/image.ts           Resizes an uploaded cover image to a compressed JPEG data URL
  lib/chartPalette.ts    Categorical chart palette, validated for the dark surface
  stats/stats.ts        Pure stats functions (author/genre counts, rating distribution,
                         averages, books-over-time series, summary) — kept separate from
                         UI so it's easy to test and extend
  stats/stats.test.ts   Vitest tests for the stats module
  components/
    AddBook.tsx          Search → pick result → editable form, or manual entry
    Library.tsx          Sortable/filterable grid of all books
    BookDetail.tsx        View/edit/delete a single book
    StatsDashboard.tsx    Renders the stats module's output as tiles + charts
    RatingInput.tsx       Click/drag directly on the stars, 0.25-star increments
    Logo.tsx               Inline SVG brand mark
    charts/PieChart.tsx    Donut chart (authors/genres), legend + hover tooltip
    charts/LineChart.tsx   Books-read-over-time line chart, crosshair + tooltip
  App.tsx                Top-level view state (library/add/detail/stats), wires
                          components to the IndexedDB layer
```

## Setup

1. Install [Node.js](https://nodejs.org/) (LTS is fine).
2. From this directory:
   ```
   npm install
   npm run dev
   ```
3. Open the printed local URL in a browser.

Other scripts:
- `npm run test` — run the stats module's Vitest suite
- `npm run build` — type-check and produce a production build

## Deployment

Deployed on [Vercel](https://vercel.com), connected to this repo's `main` branch —
Vercel auto-detects the Vite preset (`npm run build`, output dir `dist`) and deploys
on every push.

## Notes

- Genre is a single value per book (not multi-tag) — see the spec's Decisions section.
- Covers: the Open Library cover ID is stored and resolved to a URL on demand via
  `getCoverUrl`. A user-uploaded cover overrides it — stored as a resized/compressed
  JPEG data URL (`Book.customCoverData`) so it round-trips through JSON export/import
  without a backend. `resolveCoverUrl()` always prefers the custom cover when present.
- Export produces a JSON file (`{ version, exportedAt, books }`); import accepts either
  that shape or a bare array of books.
- ShelfScore is a fixed dark-brand theme (matching the logo) rather than a light/dark
  toggle. The chart categorical palette lives in `lib/chartPalette.ts` and was validated
  against the dark surface with the dataviz skill's six-checks script; see the comment
  there for the one accepted floor-band CVD warning and its mitigation (labels + legend
  always shipped).
