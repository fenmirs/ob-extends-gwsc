# Task 2 Report: 集成 Heti CSS

## What was implemented
- Downloaded `heti.min.css` (18,922 bytes) from unpkg to `assets/heti.min.css`
- Modified `src/main.ts` to register a `MarkdownPostProcessor` that:
  - Reads the `heti` frontmatter key from each note
  - Adds the `heti` base class to the rendered element
  - Maps frontmatter values (`poetry`, `ancient`, `annotation`, `vertical`) to corresponding Heti modifier classes

## Build verification
- `npm run build` — succeeded with no errors

## Files changed
| File | Action |
|---|---|
| `assets/heti.min.css` | Created (downloaded) |
| `src/main.ts` | Modified (added PostProcessor) |

## Issues
- None. Download and build both completed cleanly.
