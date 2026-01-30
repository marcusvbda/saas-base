# Engineering Standards (skills.md)

## Project

**Next.js 16 + React 19 — Production-grade**

This folder defines **mandatory engineering standards** for this repository.

All **human-written and AI-generated code** MUST comply with these documents.
Violations are treated as bugs.

---

## Purpose

These standards exist to:

- Enforce clear architectural boundaries
- Maximize performance, security, and reliability
- Improve developer experience and long-term maintainability
- Ensure consistent, predictable, production-grade code quality
- Reduce ambiguity and prevent accidental complexity

---

## File Responsibilities

### architecture.md

Defines:

- System boundaries
- Layering and dependency direction
- Allowed imports and data flow rules

---

### backend.md

Defines how API Routes behave as a backend layer:

- Input validation
- Authentication and authorization
- Error handling
- HTTP contracts and response shapes

---

### frontend.md

Defines frontend standards:

- Component architecture
- UX and accessibility requirements
- Performance optimizations
- Interaction and state management rules

---

### database.md

Defines database and persistence rules:

- Raw SQL usage
- Repository boundaries
- Transaction handling
- Migrations and indexing strategy
- Data integrity guarantees

---

### domain-services.md

Defines the core business layer:

- Business rules and invariants
- Orchestration patterns
- Transaction boundaries
- Idempotency expectations

---

### performance.md

Defines performance constraints across:

- Frontend rendering
- Backend execution
- Async processing
- Database access
- System scalability

---

### security.md

Defines security standards:

- Secret handling
- Environment variables
- Trust boundaries
- Threat mitigation
- Secure-by-default practices

---

### payments-stripe.md

Defines financial and payment rules:

- Stripe integration patterns
- Webhook validation
- Idempotency guarantees
- Payment state safety

---

### theming.md

Defines design system rules:

- Design tokens
- Component consistency
- Mandatory dark/light mode support

---

### error-taxonomy.md

Defines a shared error model:

- Error classification across domain, backend, and frontend
- Deterministic error handling
- Predictable UX mapping

---

### code-review.md

Defines mandatory code review standards:

- Architecture enforcement
- Code quality expectations
- Performance and security checks
- Rules for AI-generated code

---

## Core Principles (Apply to All Layers)

- Performance, security, and maintainability first
- Explicit over clever abstractions
- Strict separation of concerns
- Fail fast, recover gracefully
- Predictability over flexibility
- Architectural violations are bugs

---

## Complexity Discipline

- No unnecessary complexity
- Avoid indirection for its own sake
- Avoid generic adapters, loaders, or context getters when:
  - A service can own its logic directly
  - Validation and side effects belong together

### Orchestration Rule

- Services own **what runs**
- Routes, jobs, and handlers remain generic
- Callers should delegate:
  - `service + action + payload`
- Orchestration lives in the domain/service layer, not at the edges

---

## Enforcement

- These documents are normative, not advisory
- Code that violates these standards must be changed
- Convenience is never a valid justification

If behavior is unclear, the system design is wrong.
