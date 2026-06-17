# Mundial 2026 Implementation Status

## Current Session

Status: static page layout completed.

Implemented only static markup and SCSS for the Mundial 2026 landing page. Schedule data, automatic slider behavior, match status calculation, current-match centering, and popup opening flow were not implemented.

Changed files:

- `src/components/pages/home/home.html`;
- `src/components/pages/home/home.scss`;
- `src/components/layout/header/header.scss`;
- `src/IMPLEMENTATION-STATUS.md`.

## Instructions Read

- `AGENTS.md`: read in the planning session.
- `src/IMPLEMENTATION-PLAN.md`: read.
- `template.config.js`: read in the planning session.
- `vite.config.js`: read in the planning session.
- `src/index.html`: read in the planning session.
- `src/components/templates/main/main.html`: read in the planning session.
- `src/components/pages/home`: read.
- `src/components/layout/header`: read.
- `src/components/layout/footer`: read in the planning session.
- `src/components/layout/popup`: read in the planning session.
- Existing form components/scripts: read in the planning session.
- `src/design-reference`: all PNGs opened and matched to viewport.
- `src/assets/img/hero`: inspected.
- `src/assets/img/bonus-items`: inspected.
- `src/assets/img/cards`: inspected.

Requested skill note:

- `fls-landing-builder` was required by `AGENTS.md`, but no matching `SKILL.md` was found in the available skills list or local project skill folders during audit.

## Design References

- `src/design-reference/desktop.png`: `1920x1080`;
- `src/design-reference/tablet.png`: `992x1080`;
- `src/design-reference/mobile.png`: `768x1454`;
- `src/design-reference/small.png`: `375x1230`.

The reference PNG files were used only for visual matching and were not connected to the page or copied into working assets.

## Asset Status

Hero assets:

- `src/assets/img/hero/hero-image-desktop.png`: `1920x1080`;
- `src/assets/img/hero/hero-image-tablet.png`: `992x1080`;
- `src/assets/img/hero/hero-image-mobile.png`: `768x1454`.

Bonus items:

- `src/assets/img/bonus-items/01.png`: `440x122`;
- `src/assets/img/bonus-items/02.png`: `440x122`.

Cards:

- exact count: `71`;
- filenames found: `01.png` through `71.png`;
- dimensions: all `474x256`;
- missing numbers: none.

Temporary slider cards used in static layout:

- `src/assets/img/cards/02.webp`: Corea del Sur vs Chequia;
- `src/assets/img/cards/03.webp`: Canadá vs Bosnia, central active test card;
- `src/assets/img/cards/04.webp`: Estados Unidos vs Paraguay.

## Static Layout Completed

- Existing layout header is used; no duplicate `<header>` was added to `home.html`.
- Header still contains the CuatroBet logo from `src/components/layout/header/header.html`.
- Header logo alignment and responsive width were adjusted in `src/components/layout/header/header.scss`.
- Existing manual hero `<picture>` is preserved.
- Hero sources remain:
  - mobile: `@img/hero/hero-image-mobile.png`;
  - tablet: `@img/hero/hero-image-tablet.png`;
  - fallback desktop: `@img/hero/hero-image-desktop.png`.
- No `data-fls-image-ignore` was added.
- `template.config.js` still uses `images.optimize.sizesignore` for `hero/hero-image-desktop.png`.
- Hero title and description were added:
  - `Mundial 2026:`;
  - `¡Te toca ganar a vos!`;
  - `Elegí tu favorito, aprovechá las mejores cuotas y convertí tu intuición futbolística en plata de verdad`.
- Two real bonus item images were added from `src/assets/img/bonus-items`.
- Match block heading was added: `Los partidos que se vienen:`.
- Static slider shell was added with central active card and partially visible neighbors.
- Slider arrows were added as static buttons.
- CTA was added as a static button: `Conseguí tu bono y apostá`.
- Existing layout footer remains connected through `src/index.html`.

## Not Implemented Yet

- No schedule data module.
- No 71-card render loop.
- No JavaScript slider navigation.
- No automatic past/live/upcoming states.
- No automatic current-match centering.
- No popup CTA integration and no popup opening logic.
- No form script changes.

Known existing risk still present:

- `src/components/pages/home/home.js` calls `initFlashPreview()`, but that function was not found in the current file. This was not changed because the current session was limited to static layout and avoided JS/popup/form work.

## Current Popup And Form Status

- Popup lives in `src/components/layout/popup`, not in the page component.
- Popup core opens by `data-fls-popup-link="popup"` and targets `[data-fls-popup="popup"]`.
- Registration form is inside `popup.html`.
- Custom validation and submit helpers remain unchanged.
- Current static CTA does not include `data-fls-popup-link`, by request to avoid popup logic in this stage.

## Match Data Needed

No schedule data was added.

Needed before stages 5-8:

- `startAt` for all `71` cards;
- `endAt` for all `71` cards, or a confirmed duration rule;
- timezone for status calculation;
- optional `stage`;
- optional `priority` for simultaneous matches.

Do not infer match times from the card images.

## Stage Progress

| Stage | Status |
| --- | --- |
| 1. Structure and assets check | Done |
| 2. Header and static hero | Static layout done |
| 3. Bonus-items | Static layout done |
| 4. Static slider shell | Static layout done with temporary cards `02`, `03`, `04` |
| 5. Match data model | Not started; blocked pending schedule data |
| 6. Manual slider navigation | Not started |
| 7. Automatic past/live/upcoming | Not started; blocked pending schedule data |
| 8. Automatic current match centering | Not started; blocked pending schedule data |
| 9. CTA and popup integration | Not started; CTA is static only |
| 10. Ready form and validation check | Not started |
| 11. Adaptive check | Partially checked against reference dimensions while writing SCSS; browser visual QA not completed |
| 12. Production build | Passed |

## Verification Performed

Commands/checks run:

- Opened all PNG files from `src/design-reference`.
- Opened temporary card images `02.png`, `03.png`, `04.png`.
- Opened bonus item images `01.png`, `02.png`.
- `npm.cmd run build`: passed outside sandbox after `spawn EPERM` inside sandbox.
- Inspected `dist/index.html`:
  - hero remains a single manual `<picture>`;
  - hero sources use `.webp`;
  - fallback desktop image uses `.webp`;
  - `data-fls-image-ignore` is absent.

Not completed:

- In-app Browser visual QA: unavailable in this session (`iab` not available).
- Local dev-server visual QA inside sandbox: blocked by `spawn EPERM`; production build was verified outside sandbox instead.
