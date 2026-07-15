# Task 4 Report: 编辑器工具栏

## What Was Implemented
- **Editor toolbar widget** (`src/toolbar.ts`): A CodeMirror 6 `ViewPlugin` that injects a toolbar at the top of the editor with 4 buttons:
  - 插入模板: Inserts poem template with frontmatter
  - 换行: Inserts HTML line break with proper punctuation handling (`heti-hang`)
  - 注音: Opens RubyModal for pinyin annotation
  - 横竖排: Toggles frontmatter `heti` field between vertical/poetry
- **RubyModal stub** (`src/ruby-modal.ts`): Minimal stub with `RubyModal` class and `buildRubyHtml` helper for compilation (Task 5 will replace with full implementation)
- **Updated main.ts**: Registers editor extension and adds "新建诗词" command

## Build Verification
- `npm run build` completed successfully with no errors or warnings.

## Files Created/Modified
- **Created**: `src/toolbar.ts`
- **Created**: `src/ruby-modal.ts` (stub)
- **Modified**: `src/main.ts` — added imports for toolbar, `TYPE_MAP` export, editor extension registration, and command registration

## Issues Encountered
None.
