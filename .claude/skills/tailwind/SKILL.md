---
name: tailwind
description: Tailwind CSS styling guidelines for this project. Apply when writing or reviewing styles, class names, or UI layout. Triggers on tasks involving CSS classes, responsive design, dark mode, animations, or component styling.
user-invocable: false
---

## Stack

- Tailwind CSS v3.4.9
- tailwindcss-animate v1.0.7
- tailwind-merge v3.3.1
- Dark mode: `class` strategy
- PostCSS + Autoprefixer

## Custom Design Tokens

Use the project's custom colors defined in `tailwind.config.js`:

### Surfaces
- `surface-primary` — main background (dark)
- `surface-primary-dark` — darker variant
- `surface-primary-darkest` — darkest variant
- `surface-secondary` — secondary background
- `surface-secondary-bg` — light secondary background
- `surface-tertiary` — light tertiary
- `surface-quartertiary` — blue-dark quaternary
- `surface-primary2` — light neutral surface
- `surface-error` — error background
- `surface-success` — success background

### Text & Brand
- `brand` — gold/brand color (rgb 186, 149, 95)
- `text-error` — error text
- `text-success` — success text
- `text-accent` — blue accent text
- `color-neutral` — neutral muted text
- `secondary-wallet` — wallet secondary text

### Borders
- `border-subtle` — subtle dark border
- `border-subtle-wallet` — subtle light border
- `border-hovered` — hovered state border
- `border-strong` — strong light border
- `border-md-darker` — medium darker border

### Buttons & Interactive
- `button-surface-primary` — primary button background
- `button-surface-tertiary` — tertiary button background
- `chips-background-selected` — selected chip background

### Status
- `error` — error red
- `bg-success` — success background (light)
- `soft-success` — soft green
- `good-green` — positive green
- `olive` — olive green accent

### Other
- `accent-blue` — light blue accent
- `theme-brown` — brown accent
- `primary-resting` — resting state

## Fonts

- `font-nunito` — Nunito (via CSS variable `--font-nunito`)
- `font-figtree` — Figtree (via CSS variable `--font-figtree`)

## Rules

- Use `tailwind-merge` (via `cn()` utility) to merge conditional classes
- Use `clsx` for conditional class composition
- Prefer Tailwind utility classes over custom CSS
- Use responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`) for responsive layouts
- Use `dark:` prefix for dark mode variants
- Use `tailwindcss-animate` classes for animations
- Do not add new colors to `tailwind.config.js` unless explicitly requested
- Content paths: `./app/**`, `./pages/**`, `./pages-content/**`, `./components/**`, `./src/**`
