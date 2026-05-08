# CLAUDE.md

## Form Validation

All forms must use **Zod + react-hook-form**. Never use raw `useState` for form field values or rely solely on HTML5 validation attributes.

### Required pattern

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({ name: z.string().min(2).max(50) });
type FormValues = z.infer<typeof schema>;

const {
	register,
	handleSubmit,
	formState: { errors, isSubmitting },
} = useForm<FormValues>({
	resolver: zodResolver(schema),
});
```

- Display field errors inline using `errors.<field>.message`
- For password fields use `<PasswordInput>` from `@/components/ui/password-input` (includes show/hide toggle)
- For confirm-password, use `.refine()` on the schema to validate match
- For controlled components (Select, etc.) use `Controller` from react-hook-form

---

## Data Fetching & Mutations

Always use **React Query** (via tRPC hooks) for all server state. Never manage HTTP loading, error, or data state with `useState`.

- Queries: `trpc.<router>.<procedure>.useQuery()`
- Mutations: `trpc.<router>.<procedure>.useMutation()` — covers POST, PUT, DELETE
- Loading state comes from `query.isLoading` or `mutation.isPending`, never a manual `useState` flag
- Never use third-party HTTP libraries (axios, ky, got, etc.) — use native `fetch` for any raw HTTP calls outside tRPC

---

## HTTP Requests Outside tRPC

When a raw `fetch` is needed (e.g. external APIs), always use the native `fetch`. Never import axios or similar libs.

---

## Component Rules

### Reusability

- Components must be reusable where possible. If a component will be used in more than one file, extract it to its own file.
- Large components that are not needed on initial render must be imported with `dynamic` and a skeleton fallback:

```tsx
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const HeavyComponent = dynamic(() => import('@/components/heavy-component'), {
	loading: () => <Skeleton className="h-40 w-full" />,
});
```

### File structure

- Each file must have exactly **one default export**, which is the main component of that file.
- Helper components used only within the same file may be defined as `const` arrow functions in that file.
- Never define more than one component in a file if any of them will be imported elsewhere.

```tsx
const InternalHelper = () => {
	return <div>...</div>;
};

export default function MainComponent() {
	return <InternalHelper />;
}
```

---

## Security

- Never expose environment variables or credentials in client-side code.
- Only `NEXT_PUBLIC_` prefixed variables may be used on the client — and only non-sensitive ones.
- Never log or render sensitive values (tokens, keys, passwords).

---

## Performance & Memoization

- Avoid `memo`, `useMemo`, and `useCallback` unless there is a measured, concrete performance problem. The React compiler handles most optimizations automatically in this project.
- Do not add memoization "just in case."
