# Obsidian Heti 插件设计文档

## 概述

一款基于 [Heti CSS](https://sivan.github.io/heti/) 的 Obsidian 插件，为中文诗词和古文提供专业的排版增强。每个诗词/古文独立为一个 `.md` 文件，通过 frontmatter 标记类型，编辑器内工具栏自动生成格式化的 Heti HTML，阅读模式自动应用排版样式。

## 核心原则

- **一个诗词一个文件**：每首诗词是独立的 `.md`，干净隔离，便于管理和嵌入复用
- **零侵入**：只有带有 `heti` frontmatter 的文件受影响，普通 Markdown 文件完全不受干扰
- **用户友好**：编辑器工具栏让使用者无需手写 HTML，点击按钮即可生成正确格式

## 文件格式

```yaml
---
heti: poetry          # 类型: poetry | ancient | annotation | vertical
朝代: 唐              # 可选
作者: 李白            # 可选
---
```

`heti` 字段值决定阅读模式下应用的 CSS 类名：

| frontmatter 值 | CSS 类名 | 用途 |
|----------------|---------|------|
| `poetry` | `heti heti--poetry` | 诗词（默认） |
| `ancient` | `heti heti--ancient` | 古文 |
| `annotation` | `heti heti--annotation` | 行间注（含注音） |
| `vertical` | `heti heti--vertical` | 竖排排版 |

## 架构设计

### 插件文件结构

```
obsidian-heti/
├── main.ts              # 插件入口，注册命令、视图、事件
├── styles.css           # 插件自身样式（工具栏等）
├── assets/
│   ├── heti.min.css     # Heti CSS（从 unpkg 打包）
│   └── heti-addon.js    # Heti 增强脚本（可选，标点挤压等）
├── toolbar.ts           # 编辑器工具栏（EditorView 装饰）
├── ruby-modal.ts        # 注音输入弹窗（Modal API）
├── templates.ts         # 诗词 HTML 模板生成器
├── reading-view.ts      # 阅读模式样式注入
└── package.json         # Obsidian 插件清单
```

### 模块职责

#### 1. `main.ts` — 插件入口

- 检测当前编辑文件的 frontmatter 是否含 `heti` 字段
- 注册编辑器扩展（工具栏）
- 注册阅读模式视图处理器
- 注册命令：新建诗词、插入模板、添加注音

#### 2. `toolbar.ts` — 编辑器工具栏

使用 Obsidian `EditorView` 装饰，在编辑器内容区顶部插入固定按钮栏。

**显示条件**：当前文件 frontmatter 含 `heti` 字段时显示，否则隐藏。

**按钮列表**：

| 按钮 | 图标 | 功能 | 生成内容 |
|------|------|------|---------|
| 插入模板 | 📜 | 插入完整诗词骨架 | 见下方模板 |
| 标题 | 📌 | 在容器内插入/编辑标题 | `<h2>标题<span class="heti-meta heti-small">[朝代]<abbr title="号">作者</abbr></span></h2>` |
| 换行 | ↵ | 插入带标点悬挂的换行 | `<span class="heti-hang">。</span><br>` |
| 注音 | 🔤 | 选中文字后弹窗输入拼音 | `<ruby>字<rt>pīn</rt></ruby>` |
| 横竖排 | ⇅ | 切换 frontmatter 中 heti 值 | 切换 `poetry` ↔ `vertical` |

#### 3. `ruby-modal.ts` — 注音弹窗

继承 Obsidian `Modal`，流程：
1. 用户在编辑器中选中文字
2. 点击「注音」按钮
3. 弹出 Modal，显示选中文字
4. 输入拼音（支持多音字：`字1:pin1,字2:pin2` 格式）
5. 确认后在编辑器中替换选中文字为 `<ruby>` 标签

#### 4. `templates.ts` — 模板生成器

生成诗词 HTML 骨架：

```html
<div class="heti heti--poetry">
  <h2>标题<span class="heti-meta heti-small">[朝代]<abbr title="号">作者</abbr></span></h2>
  <p class="heti-x-large">
    第一句<span class="heti-hang">，</span><br>
    第二句<span class="heti-hang">。</span><br>
    第三句<span class="heti-hang">，</span><br>
    第四句<span class="heti-hang">。</span>
  </p>
</div>
```

#### 5. `reading-view.ts` — 阅读模式注入

- 拦截 Markdown 渲染后的 DOM
- 检测文件 frontmatter 中的 `heti` 字段值
- 在文章容器上添加对应的 `class="heti heti--{type}"`
- 仅对含 `heti` frontmatter 的文件生效，普通笔记完全不受影响

#### 6. `styles.css` — 工具栏样式

工具栏样式（固定在编辑器顶部）：
- 高度约 40px
- 按钮水平排列
- 背景色跟随 Obsidian 主题
- hover 效果

### 嵌入复用

其他笔记通过 Obsidian 原生语法嵌入诗词：

```markdown
这是李白的诗：

![[赠汪伦]]

很棒吧！
```

嵌入内容会继承 Heti 样式，无需额外配置。

## 使用场景示例

### 新建诗词

1. 新建笔记 `赠汪伦.md`
2. 添加 frontmatter：
   ```yaml
   ---
   heti: poetry
   朝代: 唐
   作者: 李白
   ---
   ```
3. 编辑器顶部自动出现工具栏
4. 点击「插入模板」，生成骨架
5. 替换标题、作者、诗句内容
6. 切换到阅读模式查看排版效果

### 添加注音

1. 在阅读模式的诗词中选中「茱萸」
2. 点击工具栏「注音」按钮
3. 弹窗中输入 `zhū yú`
4. 确认后源码变为 `<ruby>茱萸<rt>zhū yú</rt></ruby>`

## 技术依赖

- **Obsidian API**：`Plugin`, `EditorView`, `Modal`, `MarkdownPostProcessor`
- **Heti CSS**：`heti.min.css`（打包到插件目录）
- **Heti 增强脚本**（可选）：`heti-addon.min.js`（标点挤压、中西文混排优化）

## 范围排除

- 不涉及自动注音（需外部 API，复杂度高）
- 不涉及诗词搜索/推荐功能
- 不涉及多栏排版（Heti 支持但不在工具栏中暴露）
