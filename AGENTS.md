# Project instructions

Use the `fls-landing-builder` skill.

This is an FLS/Vite frontend project.

## Main rules

- Work only inside `src`.
- Do not edit `dist` manually.
- Before changing files, inspect:
  - `template.config.js`
  - `vite.config.js`
  - `src/index.html`
  - `src/components/pages`
  - `src/components/layout`
  - `src/components/custom`

## HTML

- Use existing template/include system.
- Page content belongs in `src/components/pages/<page>/<page>.html`.
- Do not duplicate `html`, `body`, `.wrapper`, `header`, `footer`.
- Reusable sections/components should be placed in `src/components/custom/<component-name>/`.
- Connect reusable components through `<include src="@components/custom/<component>/<component>.html" locals='{}'></include>`.

## SCSS

- Page-specific styles belong near the page component.
- Reusable component styles belong near the custom component.
- Use BEM.
- Use existing SCSS mixins and functions.
- Prefer `adaptiveValue`, `toRem`, `toEm` when appropriate.
- Do not add heavy libraries for simple layout or animation.

### Shared CSS variables

- Store all reusable project CSS custom properties in:

```text
src/styles/variables.css
```

- Before creating a variable, inspect `src/styles/variables.css` and reuse an existing token when possible.
- Do not scatter reusable global variables across page or component SCSS files.
- Add a new variable to `src/styles/variables.css` when it:
  - is reused in more than one place;
  - represents a shared color, spacing, size, radius, shadow, transition, or layout token;
  - belongs to the project design system.
- A component-local custom property may remain inside the component only when it is used exclusively by that component and has no shared design meaning.
- Do not create duplicate variables with different names for the same value.

## Adaptive implementation rules for this project

### Main tool

- For ordinary responsive properties based on viewport width, use the existing FLS mixin `adaptiveValue()` first.
- This applies to:
  - `font-size`;
  - `padding`;
  - `margin`;
  - `gap`;
  - width and height of ordinary elements;
  - distances between blocks.
- Do not replace `adaptiveValue()` with `clamp()` without a confirmed reason.

### When not to use `adaptiveValue()`

- Do not create a fluid adaptive value when the difference between the maximum and minimum values is `3px` or less.
- If the value is identical at desktop, laptop, and tablet widths and changes only on mobile:
  - keep the shared value fixed for the unchanged ranges;
  - apply the changed value only in the relevant lower viewport range;
  - use `adaptiveValue()` only between the two viewport widths where the value actually changes.
- Do not interpolate across the full desktop-to-mobile range when the design changes only near mobile.
- Prefer a fixed value plus one breakpoint when fluid interpolation gives no visible benefit.
- Before adding `adaptiveValue()`, compare the control-width values and confirm that the property genuinely changes across the selected range.

Bad:

```scss
.title {
  @include adaptiveValue("font-size", 18, 16, 0, 1920, 375);
}
```

when `18px` is used at `1920`, `1440`, `992`, and `768`, and only mobile uses `16px`.

Better:

```scss
.title {
  font-size: toRem(18);

  @media (max-width: toEm(768)) {
    @include adaptiveValue("font-size", 18, 16, 0, 768, 375);
  }
}
```

If nested media queries would overlap with the mixin output, restrict the interpolation range directly through the mixin arguments and keep the selector outside another width media query:

```scss
.title {
  @include adaptiveValue("font-size", 18, 16, 0, 768, 375);
}
```

Use the simpler version that produces non-overlapping final CSS in this project.

### When `clamp()` is allowed

- Use `clamp()`, `min()`, and `max()` only for:
  - large hero objects;
  - decorative images;
  - elements that genuinely depend on the viewport in multiple ways;
  - minimum and maximum size constraints;
  - calculations that cannot be expressed with the existing `adaptiveValue()`.
- Do not create complex `clamp(calc(...))` chains for ordinary spacing and `gap` when the project already uses `adaptiveValue()`.

### Control widths

- Check adaptive layout against the design control widths:
  - `1920`;
  - `1440`;
  - `992`;
  - `768`;
  - `375`.
- For intermediate widths, use fluid interpolation through `adaptiveValue()`.
- Do not create separate fully independent markup for each width.

### Viewport height

- When an element position depends on device height, use separate height-aware media queries:

```scss
@media (width <= toEm(768)) and (height >= toEm(830)) {
}
```

- Do not solve height-dependent layout with `adaptiveValue()`, because it calculates values from width.

### Non-overlapping states

- If two media queries set different final states for the same element, their ranges must not overlap unless there is a clear need.
- Prefer:

```scss
@media (min-width: toEm(480.02)) and (max-width: toEm(768)) {
}

@media (max-width: toEm(480)) {
}
```

- This is required because the production build can sort media queries differently than dev mode.

### Hero

- For mobile hero, a fixed design-height through a CSS variable and `min-height` is allowed.
- Desktop hero must preserve at least one viewport.
- Desktop/laptop/tablet/mobile image switching is done through the manual `<picture>`.
- Do not replace the manual `<picture>` with automatic template generation.
- For the fallback `<img>`, use `images.optimize.sizesignore` when needed to preserve WebP output and avoid a nested `<picture>`.

### Footer overlap

- For mobile footer, controlled overlap through CSS variables on `.wrapper` is allowed.
- Example architecture:

```scss
.wrapper {
	--mobile-hero-height: #{toRem(777)};
	--mobile-footer-overlap: #{toRem(224)};
	--mobile-footer-start: #{toRem(553)};
}
```

- Additional overlap values may change through height media queries.
- Do not use random coefficients in the final property, for example:

```scss
margin-top: calc(var(--mobile-footer-overlap) * -1.6);
```

- Instead, change the variable value itself in the relevant media query.


### Popup sizing on low-height desktop screens

- Treat Windows display scaling such as `125%` as a reduced CSS viewport height. Do not try to detect the operating-system scale directly.
- For wide but low-height screens, use a dedicated non-mobile media query, for example:

```scss
@media (width > toEm(768)) and (height <= toEm(760)) {
}
```

- Keep the popup overlay and wrapper covering the whole viewport:

```scss
.popup,
.popup__wrapper {
  min-height: 100vh;
  min-height: 100dvh;
}
```

- In compact desktop mode, reduce real layout dimensions rather than visually scaling the card. Adjust only the required values:
  - `width` / `max-width`;
  - block and inline padding;
  - vertical gaps and margins;
  - logo and illustration sizes;
  - form-field and button heights;
  - bonus-card size;
  - relevant typography and border radius.
- Apply the same proportional compact sizing to all related popup states, especially the registration form and bonus popup.
- Prefer shared CSS custom properties or one common media query so popup variants cannot drift apart.
- Do not use `transform: scale()` for popup resizing. It changes only visual rendering and leaves layout dimensions unchanged.
- Preserve image proportions with `height: auto` and `object-fit: contain` where appropriate.
- Keep the existing mobile adaptation unchanged.
- If an extremely low viewport still cannot contain the popup, allow vertical scrolling on the popup wrapper or content instead of clipping the card or disabling page scrolling globally.
- Validate at least `1490 × 718`, `1366 × 768`, `1536 × 864`, `1920 × 1080`, and one mobile viewport.

### Existing code priority

- The current manually corrected SCSS is the source of truth.
- For future tasks:
  - do not rewrite the current adaptive layout without an explicit request;
  - do not replace `adaptiveValue()` with `clamp()`;
  - do not change visual block sizes and positions during JS tasks;
  - before changing layout, first describe the concrete difference from the reference PNG;
  - if exact visual matching cannot be verified, do not perform a large refactor by eye.

## JS

- Use vanilla JavaScript unless the project already uses another approach.
- Check elements before adding listeners.
- Do not break build if optional elements are missing.
- Component-specific JS should stay near the component.

## Assets

- Use `@img` in HTML/SCSS when possible.
- Import images in JS when JS controls image paths.
- Do not use absolute paths to local Windows files.
- Optimize image usage and do not load unnecessary assets.

## Workflow

- First analyze the structure.
- Then explain the planned changes.
- Then edit only the necessary files.
- After changes, run build/check commands if available.

## Code style reference

If `.code-examples/` exists, use files inside it only as a style reference.

Do not copy content blindly.
Do not edit files inside `.code-examples/`.
Use examples to understand:
- BEM naming
- SCSS nesting
- adaptiveValue usage
- page/custom component structure
- vanilla JS style

## FLS image optimization and manual `<picture>`

This project uses a customized image-processing module.

### `images.optimize.sizesignore`

For images already used as the fallback `<img>` inside a manually authored `<picture>`, use the `sizesignore` list in `template.config.js`.

Example:

```js
images: {
  optimize: {
    sizes: [600, 1200],
    sizesignore: [
      "hero/hero-image-desktop.png",
    ],
  },
},
```

Paths in `sizesignore` are relative to `src/assets/img`.

Files listed in `sizesignore` must:

- still be optimized;
- still be converted to the configured modern format, such as WebP or AVIF;
- not receive automatically generated responsive variants such as `-600.webp` and `-1200.webp`;
- not be wrapped in an additional generated `<picture>`.

Example manual markup:

```html
<picture class="hero__picture">
  <source srcset="@img/hero/hero-image-mobile.png" media="(max-width: 768px)" />
  <source srcset="@img/hero/hero-image-tablet.png" media="(max-width: 992px)" />
  <source srcset="@img/hero/hero-image-laptop.png" media="(max-width: 1199.98px)" />
  <img class="hero__image" src="@img/hero/hero-image-desktop.png" alt="" />
</picture>
```

Do not add `data-fls-image-ignore` to this fallback image. That attribute excludes the image from the normal optimizer and can leave the output in PNG/JPEG instead of WebP/AVIF.

When another image needs the same behavior, add it to `sizesignore` instead of changing the image-processing module.

After changing `sizesignore`, run:

```bash
npm run build
```

Then verify in `dist/index.html` that:

- the manual `<picture>` remains single;
- there is no nested generated `<picture>`;
- all `<source>` URLs use the configured modern format;
- the fallback `<img>` also uses the configured modern format;
- ignored responsive variants were not generated.
