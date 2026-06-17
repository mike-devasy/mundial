# Mundial 2026 Implementation Plan

## Audit Summary

- Project type: FLS/Vite landing, Vite root is `src`.
- Template entry: `src/index.html` uses `@components/templates/main/main.html`.
- Layout architecture is already in place:
  - header: `src/components/layout/header/header.html`;
  - page: `src/components/pages/home/home.html`;
  - footer: `src/components/layout/footer/footer.html`;
  - popup: `src/components/layout/popup/popup.html`.
- The `fls-landing-builder` skill was requested in `AGENTS.md`, but no matching local `SKILL.md` was found in the available skill list or project skill folders during audit. Continue by following `AGENTS.md` and existing FLS patterns.
- Local visual references are in `src/design-reference` and must remain reference-only.

## Assets Found

| Folder | Files | Dimensions |
| --- | --- | --- |
| `src/design-reference` | `desktop.png`, `tablet.png`, `mobile.png`, `small.png` | `1920x1080`, `992x1080`, `768x1454`, `375x1230` |
| `src/assets/img/hero` | `hero-image-desktop.png`, `hero-image-tablet.png`, `hero-image-mobile.png` | `1920x1080`, `992x1080`, `768x1454` |
| `src/assets/img/bonus-items` | `01.png`, `02.png` | both `440x122` |
| `src/assets/img/cards` | `01.webp` through `71.webp` | all `474x256` |

Cards found: `71`.

Missing card numbers: none. The sequence `01-71` is complete.

## Popup And Form Architecture

- `src/index.html` includes one layout popup through `<include src="@components/layout/popup/popup.html"></include>`.
- `popup.html` defines `[data-fls-popup="popup"]` with `[data-fls-popup-wrapper]`, `[data-fls-popup-body]`, and `[data-fls-popup-content]`.
- FLS popup behavior is implemented in `src/components/layout/popup/popup.js`.
- The popup opens from any element with `data-fls-popup-link="popup"`.
- Current popup form markup is inside `src/components/layout/popup/popup.html`, not inside `home.html`.
- Registration form id: `#register-form`.
- Form fields: phone, email, password, `isAdult`, hidden bonus/language/currency fields.
- Form validation is custom page JS:
  - `src/components/pages/home/form-validation.js`;
  - `src/components/pages/home/form-submit.js`;
  - `src/components/pages/home/password-toggle.js`;
  - `src/components/pages/home/phone-select.js`;
  - `src/components/pages/home/phone-utils.js`.
- Submit currently expects `window.patrickLandingAdapter.submit(data, { form })`.
- Phone mask expects `window.IMask`, but no import/script source was confirmed during audit.
- `home.js` currently calls `initFlashPreview()`, but that function was not found in `home.js`; this can break page JS before future implementation unless removed or restored.
- `home.js` also expects optional popup flow elements: `[data-popup-flow]`, `[data-popup-bonus]`, and `[data-popup-bonus-button]`. Current `popup.html` has `[data-popup-form]`, but no matching flow wrapper/bonus step was confirmed.

## Match Time Data Still Needed

To implement match states and current-match centering, provide for each card `01-71`:

- `id`: stable card id, preferably `1-71`;
- `image`: existing filename, for example `01.png`;
- `startAt`: ISO date-time with timezone, for example `2026-06-11T20:00:00-03:00`;
- `endAt`: ISO date-time with timezone, or a consistent match duration rule if exact end times are not available;
- optional `stage`: group, round of 32, round of 16, quarterfinal, semifinal, final;
- optional `priority`: if several matches are live/upcoming at the same time.

Also confirm the business timezone for status calculation. The form currently targets Argentina (`ARS`, Argentina flag, `+54`), so Argentina time may be expected, but this should not be guessed.

## Stages

### 1. Structure And Assets Check

Goal: Confirm actual project structure, FLS includes, and asset inventory before changing markup.

Changed files:

- `src/IMPLEMENTATION-PLAN.md`;
- `src/IMPLEMENTATION-STATUS.md`.

Dependencies:

- `AGENTS.md`;
- `template.config.js`;
- `vite.config.js`;
- `src/index.html`;
- `src/components/pages/home`;
- `src/components/layout/header`;
- `src/components/layout/footer`;
- `src/components/layout/popup`;
- `src/design-reference`;
- `src/assets/img/hero`;
- `src/assets/img/bonus-items`;
- `src/assets/img/cards`.

Done when:

- asset counts and dimensions are documented;
- missing card numbers are documented;
- popup/form architecture is documented.

Do not change:

- page layout implementation;
- SCSS values;
- `dist`;
- reference PNG files.

Check commands:

- `Get-ChildItem -Recurse -File src\components\pages\home`
- `Get-ChildItem -File src\assets\img\cards`
- `node -e "...image-size audit..."`

### 2. Header And Static Hero

Goal: Align the existing header and hero shell with the design reference while preserving the current manual hero `<picture>`.

Changed files:

- `src/components/pages/home/home.html`;
- `src/components/pages/home/home.scss`;
- possibly `template.config.js` only if another manual picture fallback must be added to `images.optimize.sizesignore`.

Dependencies:

- stage 1 asset audit;
- existing `src/components/layout/header/header.html`;
- existing hero files in `src/assets/img/hero`.

Done when:

- `home.html` contains only page content, not duplicate `html`, `body`, `.wrapper`, `header`, `footer`, or popup;
- hero uses the existing manual `<picture>`;
- desktop/tablet/mobile images use real filenames;
- fallback hero image remains listed in `images.optimize.sizesignore`;
- title and description match the reference copy once copy is confirmed.

Do not change:

- popup implementation;
- footer;
- card slider JS;
- design-reference PNGs.

Check commands:

- `npm run build`
- inspect `dist/index.html` for a single non-nested hero `<picture>`.

### 3. Bonus Items

Goal: Add two bonus item images below/within the hero area according to the reference.

Changed files:

- `src/components/pages/home/home.html`;
- `src/components/pages/home/home.scss`;
- optionally `src/components/custom/bonus-items/bonus-items.html` and `.scss` if extracted as reusable component.

Dependencies:

- stage 2 hero structure;
- `src/assets/img/bonus-items/01.png`;
- `src/assets/img/bonus-items/02.png`.

Done when:

- both images render from `@img/bonus-items/...`;
- layout matches reference at `1920`, `1440`, `992`, `768`, and `375`;
- ordinary spacing and sizes use `adaptiveValue()` first.

Do not change:

- card assets;
- popup form validation;
- footer overlap logic unless the bonus block creates a documented mismatch.

Check commands:

- `npm run build`
- visual check against reference PNGs.

### 4. Static Slider Shell

Goal: Add a non-interactive horizontal slider shell and one reusable slide structure.

Changed files:

- `src/components/pages/home/home.html`;
- `src/components/pages/home/home.scss`;
- optionally `src/components/custom/match-slider/match-slider.html` and `.scss`.

Dependencies:

- stage 3 layout;
- cards folder confirmed complete.

Done when:

- match block title exists;
- horizontal track exists;
- slide markup is reusable and not duplicated into 71 separate components or folders;
- initial static slides render from existing card images.

Do not change:

- match timing logic;
- popup internals;
- external slider libraries for simple manual behavior.

Check commands:

- `npm run build`
- DOM inspection for one slider shell and repeated slide elements only.

### 5. Match Data Model

Goal: Create a data module with all match cards and scheduling metadata.

Changed files:

- `src/components/pages/home/matches.data.js` or `src/components/custom/match-slider/matches.data.js`;
- slider JS module near the component if needed.

Dependencies:

- complete user-provided `startAt` and `endAt` data for all `71` cards;
- confirmed timezone.

Done when:

- every card has `id`, `image`, `startAt`, `endAt`;
- optional `stage`/`priority` fields are supported;
- no time is inferred from the image pixels.

Do not change:

- card image filenames;
- visual dimensions by eye during data work;
- popup form.

Check commands:

- `npm run build`
- lightweight data validation script or console assertion that count is `71` and all images exist.

### 6. Manual Slider Navigation

Goal: Implement previous/next drag or button navigation with vanilla JS.

Changed files:

- slider JS near page/custom component;
- related HTML controls;
- focused SCSS for states.

Dependencies:

- stage 4 shell;
- stage 5 data model if slides are generated from data.

Done when:

- buttons work;
- disabled/end states are handled;
- optional elements are checked before listeners are added;
- layout does not shift when controls change state.

Do not change:

- match time status logic;
- form validation;
- popup sizing.

Check commands:

- `npm run build`
- browser check at `1920`, `1440`, `992`, `768`, `375`.

### 7. Automatic Past/Live/Upcoming State

Goal: Compute card state from current time.

Changed files:

- match slider JS;
- possibly data module for helper exports;
- SCSS for state styling.

Dependencies:

- stage 5 complete schedule;
- confirmed timezone handling.

Done when:

- `past`, `live`, and `upcoming` states are derived from `startAt`/`endAt`;
- state classes/data attributes are stable;
- edge cases at exact start/end are defined.

Do not change:

- image content;
- match dates by guessing;
- unrelated page layout.

Check commands:

- `npm run build`
- manual tests with mocked `Date` or helper function tests for before/during/after match.

### 8. Automatic Current Match Centering

Goal: On load, center the current live match, otherwise the nearest upcoming match.

Changed files:

- match slider JS.

Dependencies:

- stage 6 navigation;
- stage 7 status logic.

Done when:

- live match centers on desktop and mobile;
- if no live match exists, nearest upcoming centers;
- if all matches are past, final/last relevant card is selected;
- centering does not fight manual user interaction after first initialization.

Do not change:

- SCSS layout sizes during JS-only work;
- match data.

Check commands:

- `npm run build`
- browser checks with mocked dates or temporary debug date injection.

### 9. CTA And Existing Popup Integration

Goal: Add CTA button that opens the existing layout popup.

Changed files:

- `src/components/pages/home/home.html`;
- `src/components/pages/home/home.scss`;
- possibly `src/components/layout/popup/popup.html` only if existing hidden state/flow must be corrected.

Dependencies:

- existing FLS popup module;
- stage 4 or later page layout.

Done when:

- CTA uses `data-fls-popup-link="popup"`;
- no second popup is created in `home.html`;
- popup opens and focuses correctly;
- if `data-popup-form` remains hidden, opening flow reveals the intended form or bonus step.

Do not change:

- FLS popup core unless a confirmed bug requires it;
- form field names without backend confirmation.

Check commands:

- `npm run build`
- browser click test for CTA opening popup.

### 10. Ready Form And Validation Check

Goal: Verify registration form behavior and adapter expectations.

Changed files:

- only form JS/layout popup files if an actual defect is confirmed.

Dependencies:

- stage 9 popup opening;
- adapter contract from backend/partner.

Done when:

- invalid phone/email/password/adult checkbox show errors;
- phone mask works or gracefully degrades without `window.IMask`;
- submit blocks invalid form;
- valid submit calls `window.patrickLandingAdapter.submit`;
- missing adapter error is acceptable in local dev or replaced by real integration.

Do not change:

- visual layout sizes during validation-only work;
- hidden input names without backend confirmation.

Check commands:

- `npm run build`
- manual popup form test in browser.

### 11. Adaptive Check

Goal: Validate the completed page against design control widths and relevant low-height popup viewports.

Changed files:

- focused SCSS corrections only where a concrete mismatch is documented.

Dependencies:

- all visual stages complete.

Done when:

- checked widths: `1920`, `1440`, `992`, `768`, `375`;
- popup checked at `1490x718`, `1366x768`, `1536x864`, `1920x1080`, and one mobile viewport;
- ordinary responsive values use `adaptiveValue()`;
- height-dependent behavior uses height media queries;
- overlapping media states are avoided.

Do not change:

- JS behavior;
- data model;
- large SCSS refactors by eye.

Check commands:

- `npm run build`
- browser screenshots or visual QA at listed viewports.

### 12. Production Build

Goal: Confirm production output and image optimization behavior.

Changed files:

- none expected unless build reveals a defect.

Dependencies:

- stages 1-11 complete.

Done when:

- `npm run build` passes;
- generated `dist/index.html` has no nested generated hero `<picture>`;
- hero sources and fallback are converted to configured modern format;
- ignored responsive variants are not generated for files listed in `sizesignore`;
- no missing assets or JS runtime errors in the built page.

Do not change:

- `dist` manually;
- generated optimized assets by hand.

Check commands:

- `npm run build`
- inspect `dist/index.html`
- optionally `npm run preview`
