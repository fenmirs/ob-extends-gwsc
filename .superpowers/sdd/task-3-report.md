# Task 3 Report: 模板生成器 (Template Generator)

## What I Implemented
Created `src/templates.ts` with two exported functions:
- **`generatePoemTemplate(options)`** — Generates HTML markup for a poem block using heti CSS classes. Supports `title`, `dynasty`, `author`, `lines` count, and `hetiType` (poetry/ancient/annotation/vertical).
- **`generateFrontmatter(dynasty?, author?)`** — Generates YAML frontmatter with `heti: poetry` and optional dynasty/author fields.

Also includes internal helpers: `escapeHtml` for XSS safety and `generateLines` for placeholder line generation with alternating punctuation.

## Build Verification
- `npm run build` — **passed** (exit 0)

## Files Created
- `src/templates.ts` (49 lines)

## Issues Encountered
None. Build succeeded on first attempt. Only a line-ending warning from git (CRLF/LF).
