# Task 2 Fix Report

## What was fixed

1. **Removed unused import** — `MarkdownView` was imported from `obsidian` but never used. Removed it from the import statement (`src/main.ts:1`).

2. **Moved `typeMap` to module-level constant** — The 4-entry `typeMap` object was being recreated on every PostProcessor callback invocation. Moved it to a `TYPE_MAP` module-level constant, instantiated once at load time.

## Build verification

`npm run build` completed successfully with no errors.

## Commit

`06f7cc9` — fix: clean up unused import and optimize typeMap placement
