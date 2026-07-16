# 诗词字标签化设计

## 目标
每个字用 `<span class="heti-char">` 包裹，拼音用 `<ruby>` 渲染，字间距通过 CSS 可配置。

## 生成的 HTML 格式

有拼音：
```html
<span class="heti-char"><ruby>白<rt>bái</rt></ruby></span>
```

无拼音：
```html
<span class="heti-char">白</span>
```

## CSS 变量
```css
.heti { --heti-char-gap: 0.25em; }
.heti-char { margin-right: var(--heti-char-gap); }
```

## 改动清单

| 文件 | 改动 |
|------|------|
| `poem-data.ts` | `buildRubyHtml()` 每个字包裹 `<span class="heti-char">`；`parseExistingPoem()` 解析新格式 |
| `styles.css` | 添加 `.heti-char` 样式和 `--heti-char-gap` 变量 |
