# Task 4: 添加 CSS 变量和比例缩放

**Status:** DONE

## What was implemented
Appended CSS variable rules to `src/styles.css` and copied to root `styles.css`:
- `.heti` uses `--heti-font` with inherit fallback
- `.heti .heti-x-large` uses `--heti-font-size` with inherit fallback
- `.heti h2` scales `--heti-font-size` by 1.5x
- `.heti .heti-meta` scales `--heti-font-size` by 0.75x

## Files changed
- `src/styles.css` — appended CSS rules
- `styles.css` — copied from src

## Test results
- Build succeeded (`npm run build`)

## Self-review
- Follows exact spec from task brief
- No over-engineering; CSS only
