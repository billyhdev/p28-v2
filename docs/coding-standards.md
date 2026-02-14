# Coding Standards — React Native, Expo, Supabase

This document defines coding practices and tooling for **p28-v2**: a React Native (Expo) app with Supabase backend. Goals: consistent style, fewer bugs, and maintainable architecture.

---

## 1. Formatting & Linting

### Prettier

- **Config:** `.prettierrc` at project root.
- **Rules:** Single quotes, semicolons, 2-space indent, trailing commas (ES5), 100-character print width.
- **Commands:**
  - `npm run format` — format all supported files.
  - `npm run format:check` — CI check (no writes).

### ESLint

- **Config:** `eslint.config.js` (flat config, Expo SDK 53+).
- **Stack:** `eslint-config-expo`, `eslint-plugin-prettier`, `eslint-config-prettier`.
- **Commands:**
  - `npm run lint` — report issues.
  - `npm run lint:fix` — auto-fix where possible (e.g. import order).

**Conventions enforced:**

- Imports at top of file; no code between import groups.
- Prettier handles style; ESLint focuses on correctness and patterns.
- Test files: `require()` allowed; Jest globals supported via `/* eslint-env jest */` in `.js` tests if needed.

---

## 2. TypeScript

- **Strict mode:** Enabled in `tsconfig.json` (`"strict": true`).
- **Paths:** Use `@/*` for app code (e.g. `@/lib/api`, `@/components/primitives`).
- **Types:** Prefer `interface` for object shapes; use `type` for unions/utility types. Export types from `lib/api/contracts` and DTOs; keep implementation types internal where possible.

---

## 3. React & React Native

- **Components:** Prefer function components and hooks. Default export for screens; named exports for reusable components.
- **State:** Local state with `useState`; cross-screen/auth with context (e.g. `AuthContext`, `PendingSignUpContext`). Avoid prop drilling; use context or composition.
- **Imports:** Group: 1) external (React, RN, Expo, third-party), 2) internal (`@/…`). Alphabetize within groups when it helps readability.
- **JSX:** Use natural text; apostrophes in strings are fine (e.g. `"We'll"`, `"doesn't"`).
- **Styles:** `StyleSheet.create` for screen/component styles. Shared design tokens from `@/theme/tokens` (colors, spacing, typography). Avoid inline styles except for dynamic values (e.g. insets).
- **Accessibility:** Set `accessibilityLabel` (and `accessibilityHint` where helpful) on interactive elements.

---

## 4. Expo & File-based Routing

- **Router:** Expo Router (file-based). Use `router.push()`, `router.replace()` from `expo-router` for navigation.
- **Layouts:** Use `_layout.tsx` for nested layout and auth guards; keep layout logic in one place per segment.
- **Platform:** Use `Platform.OS` or platform-specific files (`.ios.tsx`, `.android.tsx`) when behavior must differ.

---

## 5. Supabase & API Layer

- **Contract-based API:** App code depends on `lib/api/contracts`, not Supabase types. Adapters in `lib/api/adapters/supabase` implement contracts and map to/from Supabase.
- **Auth:** Use the shared `auth` facade from `@/lib/api`. Handle errors via `getUserFacingError()` and contract error types (`ApiError`).
- **Data:** Same pattern: contracts in `lib/api/contracts`, implementation in adapters. Use RPC or typed client wrappers rather than raw Supabase calls in UI.
- **Errors:** Map Supabase/network errors to a single API error shape; surface user-facing messages in UI.

---

## 6. Testing

- **Runner:** Jest (`npm run test:unit`).
- **Placement:** `__tests__` next to source (e.g. `app/auth/__tests__/sign-in.test.ts`).
- **Paths:** Jest `moduleNameMapper` mirrors `@/*` to `<rootDir>/*`.
- **Style:** Prefer `describe`/`it`; use `require()` in tests only when needed (e.g. mocks); ESLint allows it in test files.

---

## 7. Project Structure (Conventions)

- **`app/`** — Expo Router screens and layouts.
- **`components/`** — Shared UI; `primitives/` for buttons, inputs, etc.
- **`contexts/`** — React context providers (auth, locale, pending sign-up).
- **`hooks/`** — Reusable hooks (e.g. `useAuth`).
- **`lib/`** — API facade, contracts, adapters, errors; no UI.
- **`theme/`** — Design tokens and theme wiring.
- **`docs/`** — Project knowledge (this file, architecture notes).

---

## 8. Quality Checklist

Before committing:

1. `npm run lint` — no errors (warnings acceptable with justification).
2. `npm run format:check` — or run `npm run format` and commit formatted files.
3. `npm run test` — unit tests and verifies pass.
4. New UI: accessibility labels and error states considered.
5. New API usage: goes through contracts/adapters and uses shared error handling.

---

## References

- [Expo ESLint guide](https://docs.expo.dev/guides/using-eslint/)
- [React Native best practices](https://reactnative.dev/docs/performance)
- [Supabase JS client](https://supabase.com/docs/reference/javascript/introduction)
- Project: `lib/api/contracts`, `lib/errors.ts`, `theme/tokens.ts`
