# Task 1: 数据结构和 HTML 生成 — Report

## What I Implemented

Created `src/poem-data.ts` with:
- **Data interfaces:** `CharData`, `PoemLine`, `PoemFormData`
- **Utility functions:** `createEmptyForm()`, `textToChars()`, `charsToText()`, `textToLine()`
- **HTML generation:** `escapeHtml()`, `escapeYamlValue()`, `buildRubyHtml()`, `generatePoemHtml()` — produces full frontmatter + HTML from `PoemFormData`
- **HTML parsing:** `parseExistingPoem()` — extracts `PoemFormData` from existing rendered HTML + frontmatter

Emptied `src/templates.ts` (removed `generatePoemTemplate`, `generateFrontmatter`, `escapeHtml`, `generateLines`, `escapeYamlValue`, `PoemTemplateOptions`).

Updated `src/toolbar.ts` to import from `poem-data.ts` instead of `templates.ts`, and adapted `insertTemplate()` to use `generatePoemHtml(createEmptyForm())`.

## Files Changed

| File | Action |
|------|--------|
| `src/poem-data.ts` | Created — 144 lines |
| `src/templates.ts` | Emptied — 3 lines (deprecation comment + empty export) |
| `src/toolbar.ts` | Modified — import + `insertTemplate()` updated |

## Typecheck Results

`npx tsc --noEmit` output:
- 3 pre-existing obsidian type definition errors (HistoryHandler) — not from this change
- 1 pre-existing error in `toolbar.ts:137` (`metadataCache.off()` args) — not from this change
- **0 new errors introduced**

## Self-Review

**Completeness:** All items in the task brief implemented — data structures, generation, parsing, templates.ts cleanup.

**Quality:** 
- `parseExistingPoem` uses a regex to parse ruby tags; the regex handles the `|.` fallback for non-ruby characters correctly
- `generatePoemHtml` includes frontmatter + HTML in a single output, matching the original combined behavior
- Escape functions handle the required characters (HTML entities, YAML backslash/quote escaping)

**Concerns:**
- `parseExistingPoem` regex `/<ruby>(.*?)<rt>(.*?)<\/rt><\/ruby>|./g` processes one character at a time for non-ruby content, which is correct but may be slow for very long texts (not a real concern for poems)
- The `toolbar.ts` `insertTemplate` uses a regex to strip frontmatter from `generatePoemHtml` output when content already has frontmatter — this works but is fragile; later tasks should refactor this flow
