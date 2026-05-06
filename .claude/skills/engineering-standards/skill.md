---
name: engineering-standards
description: Engineering standards and principles for this project. Apply when writing, reviewing, or refactoring any code. Triggers on all tasks to enforce scope control, security, and production-first mindset.
user-invocable: false
---

# Engineering Standards

## Project Context

- Next.js (App Router) consuming a third-party Laravel API
- Production-grade environment
- This project prioritizes stability, security, performance, and predictability
- Assume active production usage at all times

## Core Principles

- All code must be written in English
- Do not add comments unless explicitly requested
- Do not modify anything outside the explicit scope of the request
- No implicit refactors or convenience improvements
- Preserve existing behavior

## Mindset Expectations

- Stability over elegance
- Predictability over cleverness
- Minimal change surface
- Respect legacy decisions
- Production-first thinking

## Scope Control

- Never change unrelated files
- Never rename variables, functions, components, or files unless requested
- Never adjust behavior unless explicitly required
- Avoid cascading changes

## Security Awareness

- Never trust client-side data
- Avoid exposing sensitive information
- Do not log sensitive data
- Follow basic web security best practices
- Treat the Laravel API as untrusted input

## Performance Awareness

- Avoid unnecessary re-renders
- Avoid premature optimization
- Be mindful of bundle size
- Prefer simple and explicit solutions

## Code Quality Philosophy

- Simple code over clever abstractions
- Readability over abstraction
- Avoid overengineering
- Avoid introducing new patterns without need

## Non-Goals

- No refactoring without request
- No optimization without clear need
- No dependency changes
- No stylistic rewrites

## Final Rule

If it was not explicitly requested, do not do it.
