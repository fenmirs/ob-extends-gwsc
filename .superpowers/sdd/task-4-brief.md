### Task 4: 添加 CSS 变量和比例缩放

**Files:**
- Modify: `src/styles.css`
- Copy: `src/styles.css` → `styles.css`

**Interfaces:**
- Consumes: CSS 变量 `--heti-font`, `--heti-font-size`

- [ ] **Step 1: 在 styles.css 末尾添加 CSS 规则**

```css
/* 诗词字体和字号配置 */
.heti {
  font-family: var(--heti-font, inherit);
}
.heti .heti-x-large {
  font-size: var(--heti-font-size, inherit);
}
.heti h2 {
  font-size: calc(var(--heti-font-size, 24px) * 1.5);
}
.heti .heti-meta {
  font-size: calc(var(--heti-font-size, 24px) * 0.75);
}
```

- [ ] **Step 2: 复制到插件根目录**

Run: `Copy-Item src/styles.css styles.css -Force`

- [ ] **Step 3: 构建**

Run: `npm run build`
Expected: 构建成功

- [ ] **Step 4: 提交**

```bash
git add src/styles.css styles.css
git commit -m "feat: add CSS variables for font and proportional scaling"
```
