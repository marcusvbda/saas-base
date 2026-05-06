---
name: react
description: React development guidelines for this project. Apply when writing or reviewing React components, hooks, state management, or data fetching. Triggers on tasks involving components, useEffect, useState, Redux, React Query, or forms.
user-invocable: false
---

## Stack

- React v18
- TypeScript v5
- React Hook Form v7.56.1 + @hookform/resolvers v5.0.1 + Zod v3.24.3
- Redux Toolkit v2.5.0 + React Redux v9.2.0 + redux-persist v6.0.0
- TanStack React Query v5.90.10
- date-fns v4.1.0 + date-fns-tz v3.2.0
- Axios v1.6.8
- ECharts v5.5.0 (via echarts-for-react v3.0.2)
- jsPDF v4.2.0 + jspdf-autotable v5.0.7
- xlsx v0.18.5
- DOMPurify v3.3.1
- next-intl v4.4.0

## State Management

- **Global state**: Redux Toolkit (`@reduxjs/toolkit`) with `redux-persist`
- **Server state**: TanStack React Query for API data fetching and caching
- **Form state**: React Hook Form with Zod validation
- **Local state**: `useState` / `useReducer` for component-level state

## Rules

- Avoid unnecessary re-renders — use `useMemo`, `useCallback` only when there is a measurable need
- Sanitize HTML with `dompurify` before using `dangerouslySetInnerHTML`
- Use `date-fns` for date manipulation — do not use `moment` for new code (legacy only)
- Use Axios for HTTP requests to the Laravel API
- Use React Query for data fetching, caching, and synchronization
- Forms must use React Hook Form + Zod schemas for validation
- Do not introduce new state management libraries
- Do not introduce new date libraries
- Prefer named exports for components
