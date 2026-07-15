# Task 4 Fix Report

## What Was Fixed

1. **`insertLineBreak` punctuation duplication** (`toolbar.ts:50-53`) — The regex stripped `，。！？；` but only the last character was checked for sentence-ending punctuation, causing remaining trailing punctuation to be lost or duplicated. Fixed by capturing ALL trailing punctuation with a regex match group, stripping it uniformly, and wrapping the entire captured group in `heti-hang`.

2. **`buildDecorations` widget recreation** (`toolbar.ts:88-89`) — A new `HetiToolbarWidget` and `Decoration` were created on every `update()` call. Fixed by hoisting `cachedWidget` and `cachedDeco` to the `createHetiToolbar` closure scope so they are created once and reused.

3. **`toggleVertical` missing frontmatter guard** (`toolbar.ts:78`) — `String.replace` with no match silently returned the original content, but offered no feedback. Added a regex test guard that shows a Notice if no `heti:` line exists.

4. **`createNewPoem` hardcoded path** (`main.ts:42`) — Duplicate files would overwrite or fail. Added a loop that checks `vault.adapter.exists()` and appends an incrementing counter (e.g. `新建诗词 1.md`) until a unique path is found.

5. **`insertTemplate` fragile frontmatter detection** (`toolbar.ts:37`) — `startsWith("---")` would match lines like `---note` or `---yaml`. Replaced with `content.match(/^---\s*\n/)` to ensure a valid YAML frontmatter delimiter.

## Build Verification

```
npm run build → success (no errors)
```

## Commit

- SHA: `3ff881ed8af33182072f6bdbfc8bf78b0e345193`
- Message: `fix: improve toolbar punctuation handling and add safety guards`
