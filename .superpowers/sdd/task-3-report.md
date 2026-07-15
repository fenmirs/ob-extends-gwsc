## Task 3: 模式切换按钮 Widget

### Status: DONE

### What I Implemented
Created `src/mode-switcher.ts` exporting `createModeSwitcher(plugin)` — a CodeMirror ViewPlugin that shows three mode buttons (表单/源码/阅读) at the top of heti-enabled editor views.

### Corrections to Task Brief
1. **`off()` → `offref()`**: The brief used `plugin.app.metadataCache.off(this.cacheRef)` which requires 2 args. The correct API for unsubscribing by EventRef is `offref()`. (Same bug exists in `toolbar.ts:137`)
2. **`import("obsidian").MarkdownView` → `MarkdownView`**: The brief used dynamic `import()` in runtime `instanceof` checks. Replaced with the statically imported `MarkdownView`.

### Files Changed
- `src/mode-switcher.ts` (new, 97 lines)

### Verification
- `npx tsc --noEmit`: No errors in our file. Pre-existing errors in `node_modules/obsidian/obsidian.d.ts` (3) and `src/toolbar.ts` (1, same off() bug).

### Self-Review
- **Completeness**: All requirements met — three buttons, active state, click dispatches, conditional display (heti frontmatter), cleanup.
- **Quality**: Follows existing `toolbar.ts` patterns. Clean, focused file.
- **Discipline**: No overbuilding. Only what was requested.

### Concerns
None significant. The `recheck` closure captures `view` from constructor (same pattern as toolbar.ts) — works fine for decoration widgets.
