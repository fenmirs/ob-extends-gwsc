# Task 6 Report: 阅读模式增强

## 实现内容
1. **竖排模式支持** — 在 PostProcessor 中，当 frontmatter `heti: vertical` 时，动态设置 `writingMode: vertical-rl` 和 `textOrientation: upright`
2. **阅读模式样式** — 添加了 `.markdown-preview-section` 下的 Heti 排版样式、竖排布局、ruby 注音样式

## 构建验证
`npm run build` 成功通过，无错误。

## 修改文件
- `src/main.ts` — 在 PostProcessor 回调中添加竖排模式特殊处理逻辑
- `src/styles.css` — 末尾追加阅读模式 Heti 样式（preview section 布局、竖排、ruby/rt）

## 问题
无
