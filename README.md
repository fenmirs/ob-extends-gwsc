# Obsidian Heti 中文排版增强

基于 [Heti CSS](https://sivan.github.io/heti/) 的 Obsidian 插件，为中文诗词和古文提供专业排版增强。

## 功能
- 编辑器工具栏：插入模板、换行、注音、横竖排切换
- 阅读模式自动应用 Heti 排版
- 每首诗词独立文件，便于管理和复用
- 支持嵌入到其他笔记中

## 使用
1. `Ctrl+P` → "新建诗词"
2. 编辑器顶部工具栏操作
3. 注音：选中文字 → 点击注音 → 输入拼音

## Frontmatter
```yaml
---
heti: poetry  # poetry | ancient | annotation | vertical
朝代: 唐
作者: 李白
---
```

## 嵌入复用
其他笔记可以通过 Obsidian 的嵌入语法引用诗词：
```markdown
![[赠汪伦]]
```