# Obsidian Heti 中文排版增强

基于 [Heti CSS](https://sivan.github.io/heti/) 的 Obsidian 插件，为中文诗词和古文提供专业排版增强。

## 安装

### 方式一：手动安装（推荐）

1. 打开 Obsidian，进入你的 Vault
2. 导航到 `.obsidian/plugins/` 目录（如不存在则创建）
3. 将本项目整个文件夹复制到 `.obsidian/plugins/` 下，确保结构如下：

```
你的Vault/
└── .obsidian/
    └── plugins/
        └── obsidian-heti/
            ├── main.js
            ├── manifest.json
            ├── styles.css
            └── assets/
                └── heti.min.css
```

4. 重启 Obsidian
5. 进入 `设置 → 第三方插件`，启用「Heti 中文排版增强」

### 方式二：从源码构建

1. 克隆本仓库

```bash
git clone <仓库地址>
cd ob-extends
```

2. 安装依赖并构建

```bash
npm install
npm run build
```

3. 构建产物为 `main.js`，将其与 `manifest.json`、`styles.css`、`assets/` 一起复制到 Vault 的 `.obsidian/plugins/obsidian-heti/` 目录

## 使用

### 快速开始

1. 按 `Ctrl+P`（macOS 为 `Cmd+P`）打开命令面板
2. 输入「新建诗词」并回车
3. 插件会自动创建一个带 frontmatter 和 HTML 模板的新文件
4. 编辑器顶部会出现工具栏，点击按钮操作内容
5. 切换到阅读模式查看排版效果

### Frontmatter 配置

每首诗词文件的开头需要包含 frontmatter，用于控制排版类型：

```yaml
---
heti: poetry        # 排版类型（必填）
朝代: 唐            # 可选
作者: 李白          # 可选
---
```

**排版类型说明：**

| 值 | 说明 | 效果 |
|---|---|---|
| `poetry` | 诗词 | 适合五言/七言绝句、律诗等 |
| `ancient` | 古文 | 适合散文、策论等长篇古文 |
| `annotation` | 行间注 | 适合需要注音/注释的文本 |
| `vertical` | 竖排 | 传统从右到左竖排排版 |

### 编辑器工具栏

当打开一个包含 `heti` frontmatter 的文件时，编辑器顶部会自动显示工具栏：

| 按钮 | 功能 | 说明 |
|------|------|------|
| 📜 插入模板 | 插入诗词 HTML 骨架 | 如果文件没有 frontmatter 会自动生成 |
| ↵ 换行 | 插入带标点悬挂的换行 | 自动处理句末标点的悬挂效果 |
| 🔤 注音 | 为选中文字添加拼音 | 需要先选中文字 |
| ⇅ 横竖排 | 切换横排/竖排 | 修改 frontmatter 中的 heti 值 |

### 注音功能

1. 在编辑器中选中需要注音的文字（如「茱萸」）
2. 点击工具栏的「🔤 注音」按钮
3. 在弹窗中输入拼音，支持两种格式：
   - **统一拼音**：所有字使用相同拼音，输入 `zhū yú`
   - **逐字拼音**：每个字单独指定，输入 `茱:zhū,萸:yú`
4. 点击确认或按回车，选中文字会被替换为 `<ruby>` 标签

### 编辑器内直接编辑

你也可以不使用工具栏，直接在源码模式下编辑 HTML：

```markdown
---
heti: poetry
朝代: 唐
作者: 李白
---

<div class="heti heti--poetry">
  <h2>赠汪伦<span class="heti-meta heti-small">[唐]<abbr title="号青莲居士">李白</abbr></span></h2>
  <p class="heti-x-large">
    李白乘舟将欲行<span class="heti-hang">，</span><br>
    忽闻岸上踏歌声<span class="heti-hang">。</span><br>
    桃花潭水深千尺<span class="heti-hang">，</span><br>
    不及汪伦送我情<span class="heti-hang">。</span>
  </p>
</div>
```

**常用 HTML class：**

| class | 说明 |
|-------|------|
| `heti` | 基础排版样式 |
| `heti--poetry` | 诗词排版 |
| `heti--ancient` | 古文排版 |
| `heti--annotation` | 行间注排版 |
| `heti--vertical` | 竖排排版 |
| `heti-x-large` | 大字号 |
| `heti-hang` | 标点悬挂 |
| `heti-meta heti-small` | 元信息（作者、朝代等） |
| `heti-verse` | 诗节居中 |

## 嵌入复用

每首诗词是独立的 `.md` 文件，可以通过 Obsidian 的嵌入语法在其他笔记中引用：

```markdown
这是李白的诗：

![[赠汪伦]]

很棒吧！
```

嵌入的内容会自动继承 Heti 排版样式。

## 文件结构建议

建议在 Vault 中创建专门的目录管理诗词：

```
你的Vault/
├── 诗词/
│   ├── 赠汪伦.md
│   ├── 静夜思.md
│   └── 出师表.md
├── 日常笔记/
│   └── 读书笔记.md    ← 可以通过 ![[赠汪伦]] 嵌入
└── ...
```

## 常见问题

**Q: 工具栏不显示？**
A: 确保文件的 frontmatter 中包含 `heti: xxx` 字段。工具栏仅在标记为 Heti 的文件中显示。

**Q: 阅读模式下排版没有效果？**
A: 同样需要 frontmatter 中有 `heti` 字段。插件通过该字段识别需要应用排版的文件。

**Q: 如何切换横排/竖排？**
A: 点击工具栏「⇅ 横竖排」按钮，或手动修改 frontmatter 中 `heti: poetry` 为 `heti: vertical`。

**Q: 普通 Markdown 文件会受影响吗？**
A: 不会。插件仅对 frontmatter 中包含 `heti` 字段的文件生效，其他文件保持原生渲染。

## 技术细节

- 基于 [Heti CSS](https://sivan.github.io/heti/) 排版引擎
- 使用 Obsidian Plugin API（EditorView 装饰、MarkdownPostProcessor、Modal）
- 构建工具：esbuild
- TypeScript 编写

## 开源协议

MIT
