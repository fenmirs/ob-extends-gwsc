## Task 2: 扩展数据结构和 HTML 生成

**Status:** DONE

### What I Implemented
Extended `PoemFormData` interface with `font` (string) and `fontSize` (number) fields. Updated all related functions:
- `createEmptyForm()` — defaults `font: ""`, `fontSize: 0`
- `generatePoemHtml()` — outputs `字体`/`字号` in frontmatter and CSS custom properties (`--heti-font`, `--heti-font-size`) as inline style on the container div
- `parseExistingPoem()` — reads `字体`/`字号` from frontmatter into the form data

### Files Changed
- `src/poem-data.ts` — interface + 3 functions updated (+16 lines)

### Verification
- `npx tsc --noEmit` — pre-existing obsidian type errors only, no new errors
- `npm run build` — build succeeded cleanly

### Commit
- `c67d864` feat: extend PoemFormData with font and fontSize fields

### Self-Review
All 7 steps from the task brief implemented. Code follows existing patterns (YAML frontmatter keys in Chinese, CSS custom property convention). No over-engineering.
