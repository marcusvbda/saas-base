---
name: shadcn
description: shadcn/ui component guidelines for this project. Apply when creating, modifying, or using UI components from shadcn/ui, Radix primitives, or the project's component library. Triggers on tasks involving buttons, dialogs, dropdowns, forms, or any UI primitive.
user-invocable: false
---

## Stack

- shadcn v3.2.1 (CLI)
- Radix UI primitives (via `radix-ui` v1.4.3, `@radix-ui/react-dropdown-menu` v2.1.16)
- lucide-react v0.543.0 (icon library)
- class-variance-authority v0.7.1
- clsx v2.1.1

## Configuration (`components.json`)

- Style: `default`
- RSC: enabled (`rsc: true`)
- TSX: enabled
- CSS variables: enabled
- Base color: `neutral`
- Icon library: `lucide`

## Path Aliases

- Components: `@/components`
- UI components: `@/components/ui`
- Utilities: `@/lib/utils`
- Lib: `@/lib`
- Hooks: `@/hooks`

## Rules

- Install new shadcn components via `npx shadcn@latest add <component>`
- UI primitives live in `@/components/ui/`
- Use `cn()` from `@/lib/utils` for class merging
- Use `cva()` from `class-variance-authority` for component variants
- Use `lucide-react` icons — do not mix with FontAwesome for new shadcn components
- Existing MUI components (`@mui/material` v5.16.6) coexist — do not migrate unless requested
- Existing PrimeReact components (`primereact` v10.6.3) coexist — do not migrate unless requested
- Do not change the shadcn configuration (`components.json`) unless explicitly requested
