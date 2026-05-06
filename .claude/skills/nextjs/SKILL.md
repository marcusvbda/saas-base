---
name: nextjs
description: Next.js development guidelines for this project. Apply when working with routing, pages, layouts, API routes, server components, middleware, images, or build configuration. Triggers on tasks involving App Router, server/client components, next.config, or deployment.
user-invocable: false
---

## Stack

- Next.js v14.1.4 (App Router)
- next-intl v4.4.0 (internationalization)
- @sentry/nextjs v8.38.0 (error monitoring — production only)
- @next/third-parties v15.0.0
- next-nprogress-bar v2.3.15
- sharp v0.33.5 (image optimization)

## Configuration (`next.config.mjs`)

- Base path: configurable via `NEXT_PUBLIC_BASE_PATH`
- React strict mode: disabled
- ESLint: ignored during builds
- i18n: via `next-intl` plugin
- Sentry: enabled in production only
- Images: AVIF + WebP formats, remote patterns allow all hosts
- Dev port: 3002

## Content Paths

- `app/` — App Router pages and layouts
- `pages/` — Pages Router (legacy, coexists)
- `pages-content/` — Page content components
- `components/` — Shared components
- `src/` — Source directory

## Rules

- Use App Router (`app/`) for new routes
- Existing Pages Router (`pages/`) routes must not be migrated unless requested
- Mark client components explicitly with `'use client'`
- Server Components are the default — keep them server-side when possible
- Use `next/image` for images with sharp optimization
- Use `next-intl` for any user-facing text that needs localization
- Environment variables prefixed with `NEXT_PUBLIC_` are client-exposed
- Do not modify `next.config.mjs` unless explicitly requested
- Do not change the Sentry configuration unless explicitly requested
- Build command: `next build` — test command: `vitest`
