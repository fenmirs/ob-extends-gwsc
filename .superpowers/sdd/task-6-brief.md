# Task 6: 阅读模式增强

## Goal
完善阅读模式的 PostProcessor，添加竖排支持和阅读模式样式。

## Files to Modify
- Modify: `src/main.ts` (添加竖排支持)
- Modify: `src/styles.css` (添加阅读模式样式)

## Steps

### Step 1: 完善 main.ts PostProcessor — 竖排支持

在 registerMarkdownPostProcessor 回调末尾（在 `el.addClass` 之后）添加：

```typescript
// 竖排模式特殊处理
if (hetiType === "vertical") {
  el.style.writingMode = "vertical-rl";
  el.style.textOrientation = "upright";
}
```

### Step 2: 添加阅读模式样式到 src/styles.css

在文件末尾添加：

```css
.markdown-preview-section .heti { max-width: 100%; padding: 16px; }
.markdown-preview-section .heti--vertical {
  writing-mode: vertical-rl;
  text-orientation: upright;
  max-height: 80vh;
  overflow-x: auto;
}
.markdown-preview-section .heti ruby { ruby-align: center; }
.markdown-preview-section .heti rt { font-size: 0.5em; }
```

### Step 3: 验证构建
```bash
npm run build
```

### Step 4: Commit
```bash
git add -A
git commit -m "feat: enhance reading view with vertical mode and ruby styling"
```

## Verification
- main.ts 中包含竖排模式的特殊处理逻辑
- styles.css 中包含阅读模式的 Heti 样式
- `npm run build` 成功
