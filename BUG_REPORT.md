# Brickify – Bug, Issue, and Vulnerability Report

## 1) Production build fails due to SCSS syntax error

**Title –** Unbalanced braces in `GeneratorComponent.scss` break production build

**Description –** The stylesheet ends with `}}` instead of a single closing brace. Sass fails to parse the file, which blocks `vite build` and prevents producing deployable assets.

**Steps to Reproduce –**
1. Install dependencies (`npm install`).
2. Run `npm run build`.
3. Observe Sass parser failure pointing at `src/Generator/components/GeneratorComponent.scss:596`.

**Expected Behavior –** Build completes successfully and outputs production bundle.

**Actual Behavior –** Build fails with `expected "}"` from Sass parser.

**Environment (if applicable) –** Node.js v22.21.1, Vite v7.3.1, Dart Sass (from local dependency).

**Severity Level –** **Critical**

**Suggested Fix (optional) –** Remove the extra closing brace and run build again. Add CI build validation to prevent regressions.

---

## 2) Runtime crashes from undefined logger in CSS analysis path

**Title –** `logger` used without import in multiple modules

**Description –** Several files call `logger.warn/error(...)` without importing `logger`. When error paths execute, a `ReferenceError` is thrown, masking the original error and interrupting processing.

**Steps to Reproduce –**
1. Open app and trigger CSS parsing with malformed CSS (or run code path directly).
2. Ensure execution reaches catch block in `CssMatcher` or `CssProcessor`.
3. Observe `ReferenceError: logger is not defined`.

**Expected Behavior –** Parser should log error cleanly and continue with fallback behavior.

**Actual Behavior –** Secondary exception (`logger is not defined`) is thrown.

**Environment (if applicable) –** Browser runtime and/or test environment; confirmed by `npm run lint`.

**Severity Level –** **High**

**Suggested Fix (optional) –** Import logger consistently (`import logger from '@lib/logger'` or named export form) in all files that use it.

---

## 3) Tooltip IDs are non-deterministic and re-generated on every render

**Title –** `Math.random()` used during render causes unstable tooltip linkage

**Description –** Tooltip component generates IDs with `Math.random()` inside render. Re-renders can change IDs, causing mismatches between trigger and tooltip, hydration instability, and accessibility inconsistencies.

**Steps to Reproduce –**
1. Render `<Tooltip>` without passing explicit `id`.
2. Cause parent component to re-render.
3. Inspect `data-tooltip-id` / `aria-describedby` and resulting tooltip behavior.

**Expected Behavior –** Tooltip ID remains stable across renders unless component unmounts.

**Actual Behavior –** ID can change on render, risking broken association.

**Environment (if applicable) –** React runtime, especially noticeable under frequent updates.

**Severity Level –** **Medium**

**Suggested Fix (optional) –** Use `useId()` (React 18+) or `useRef`-backed one-time ID generation.

---

## 4) Reverse tabnabbing risk on external link(s)

**Title –** External link with `target="_blank"` missing `rel="noopener noreferrer"`

**Description –** At least one external link opens a new tab without `rel="noopener noreferrer"`. This allows the opened page to access `window.opener` and potentially redirect/tabnab the origin page.

**Steps to Reproduce –**
1. Open UI panel with WhatsApp link.
2. Click the link that uses `target="_blank"`.
3. Inspect DOM attributes and observe missing `rel` safeguards.

**Expected Behavior –** Every external `_blank` link includes `rel="noopener noreferrer"`.

**Actual Behavior –** Missing `rel` on at least one external link in UI.

**Environment (if applicable) –** Browser.

**Severity Level –** **Medium**

**Suggested Fix (optional) –** Add `rel="noopener noreferrer"` to all `_blank` links.

---

## 5) Environment-incompatible Node/CommonJS usage in ESM code paths

**Title –** `require`/`global` usage in ESM-oriented code creates portability issues

**Description –** `DomParser` uses `require('jsdom')` and mutates `global.Node`. In strict ESM/browser builds this is brittle and flagged by lint. It can fail in non-Node runtimes and complicates bundling.

**Steps to Reproduce –**
1. Run static analysis (`npm run lint`).
2. Observe `require is not defined` and `global is not defined` in `DomParser.js`.
3. Use this module in environments where CJS globals are unavailable.

**Expected Behavior –** Runtime-appropriate parsing strategy without CJS globals in ESM source.

**Actual Behavior –** Lint/runtime compatibility issues; potential runtime failure depending on environment.

**Environment (if applicable) –** ESM tooling, browsers, strict build setups.

**Severity Level –** **Medium**

**Suggested Fix (optional) –** Use dynamic `import('jsdom')` in Node-only branches or isolate Node parser into server-specific module.

---

## 6) High lint debt indicates latent runtime and maintainability defects

**Title –** 149 lint errors across app/tests/config reduce reliability

**Description –** Lint run reports extensive issues (`no-undef`, `no-unused-vars`, hook warnings, config globals, etc.). While not every lint warning is a production bug, this density indicates fragile code paths and elevated regression risk.

**Steps to Reproduce –**
1. Run `npm run lint`.
2. Review reported 149 errors / 4 warnings.

**Expected Behavior –** Lint should pass (or fail on a minimal, triaged set of known exceptions).

**Actual Behavior –** Large unresolved error backlog.

**Environment (if applicable) –** ESLint local configuration and project source tree.

**Severity Level –** **High**

**Suggested Fix (optional) –** Prioritize by category: undefined symbols first, then React hooks correctness, then cleanup unused vars; enforce lint in CI.
