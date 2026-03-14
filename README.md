# bonneyruan.github.io

This repo now has two core static-site projects and a small experiments area.

## Core Projects

- `mill-ends/`
  - Supporting source for the Mill Ends Park fan site.
  - Owns the shared park stylesheet, park scripts, font, and park-specific images.
  - Public entry pages remain at the repo root so existing URLs still work.

- `weather-window/`
  - Supporting source for the Weather Window project.
  - Owns its CSS, app modules, generated standalone bundle, docs, and screenshots.
  - The public entry page remains at the repo root as `weatherwindow.html`.

## Experiments

- `experiments/`
  - Non-core or in-progress work that should not clutter the main site structure.
  - Includes the rival scoreboard and old test page.

## Notes

- There is intentionally no `shared/` directory yet.
- Supporting source stays with its project until two projects genuinely need the same file.
- The Mill Ends scripts are split into:
  - `mill-ends/scripts/millendsparkJS.js` for zoom and shared site chrome
  - `mill-ends/scripts/millendspark-pages.js` for page-specific interactions
