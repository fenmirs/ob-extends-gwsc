# Task 3 Fix Report

## Fixes Applied

1. **`escapeHtml` — missing quote escaping** (`src/templates.ts:10`)
   - Added `.replace(/"/g, "&quot;").replace(/'/g, "&#39;")`
   - Prevents XSS/injection when poem titles or author names contain quotes.

2. **`generateFrontmatter` — unescaped YAML values** (`src/templates.ts:45-46`)
   - Added `escapeYamlValue()` helper to escape `\` and `"` characters.
   - Wrapped `dynasty` and `author` values in double quotes in the YAML output.

## Build Verification

`npm run build` completed successfully with no errors.

## Commit

SHA: `00cb502` — "fix: improve HTML and YAML escaping in template generator"
