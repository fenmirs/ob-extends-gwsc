# 诗词表单 UI 设计

## 概述

将 Obsidian Heti 插件的编辑体验从"直接编辑 HTML 源码"改为"表单驱动"模式。编辑器支持三种视图模式：表单（默认）、源码、阅读，通过顶部按钮切换。

## 目标用户

需要在 Obsidian 中排版中文诗词的用户，不希望直接接触 HTML 源码。

## 核心需求

1. 三种模式：表单（默认）/ 源码 / 阅读
2. 顶部按钮切换模式
3. 表单包含：标题（必填）、正文逐行输入（必填，可增删行）、排版类型（必填）、朝代（可选）、作者（可选）
4. 注音：选中表单中的文字后弹出注音弹窗
5. 表单输入实时生成 HTML 写入底层文档
6. 切换到源码模式看到生成的 HTML
7. 切换到阅读模式看到渲染效果

## 架构

### 状态管理

使用 CM6 `StateField` 存储当前模式：

```typescript
type ViewMode = "form" | "source" | "preview";
const viewModeField = StateField.define<ViewMode>({
  create: () => "form",
  update: (value, tr) => {
    for (const effect of tr.effects) {
      if (effect.is(setViewMode)) return effect.value;
    }
    return value;
  }
});
```

### Widget 注入

编辑器顶部注入两个 Widget（通过 `EditorView.theme` + `Decoration.widget`）：

1. **模式切换栏**（`ModeSwitcherWidget`）
   - 三个按钮：「表单」「源码」「阅读」
   - 点击切换 `viewModeField` 的值
   - 始终显示

2. **表单区域**（`PoemFormWidget`）
   - 仅在 `viewMode === "form"` 时显示
   - 包含所有表单字段
   - 表单输入实时同步到底层文档

### 数据流

```
表单输入 → 实时生成 HTML → dispatch 到 EditorView
                                    ↓
                    viewMode="source" 时显示 HTML
                    viewMode="preview" 时 Obsidian 渲染
                    viewMode="form" 时隐藏底层文档
```

### 模式切换实现

- `form` 模式：表单 Widget 显示，底层文档通过 `EditorView.theme` 隐藏（`display: none`）
- `source` 模式：表单 Widget 隐藏，底层文档显示（原始 HTML）
- `preview` 模式：表单 Widget 隐藏，Obsidian 的阅读视图渲染底层文档

### 文件结构

```
src/
├── main.ts              # 插件入口，注册命令和扩展
├── view-mode.ts         # StateField 定义和模式切换
├── form-widget.ts       # 表单 Widget（核心 UI）
├── mode-switcher.ts     # 模式切换按钮 Widget
├── templates.ts         # HTML 模板生成（保留）
├── ruby-modal.ts        # 注音弹窗（保留）
├── toolbar.ts           # 旧工具栏（移除，功能合并到表单）
└── styles.css           # 样式
```

### 表单字段详细设计

#### 标题（必填）
- 文本输入框
- placeholder: "输入诗词标题"

#### 正文（必填，逐行输入）
- 每行一个输入框
- 底部「+ 添加一行」按钮
- 每行右侧「×」删除按钮（至少保留一行）
- 每行输入框支持选中文字后触发注音

#### 排版类型（必填）
- 下拉选择：poetry（诗词）、ancient（古文）、vertical（竖排）
- 默认值：poetry

#### 朝代（可选）
- 文本输入框
- placeholder: "如：唐、宋"

#### 作者（可选）
- 文本输入框
- placeholder: "如：李白"

### HTML 生成规则

根据表单数据生成以下格式：

```html
---
heti: {排版类型}
朝代: {朝代}
作者: {作者}
---

<div class="heti heti--{排版类型}">
  <h2>{标题}<span class="heti-meta heti-small">[{朝代}]<abbr title="{作者}">{作者}</abbr></span></h2>
  <p class="heti-x-large">
    {第1句}<span class="heti-hang">，</span><br>
    {第2句}<span class="heti-hang">。</span><br>
    ...
  </p>
</div>
```

### 注音集成

在表单模式下：
1. 用户选中正文输入框中的文字
2. 点击工具栏的「注音」按钮（或右键菜单）
3. 弹出 RubyModal（复用现有组件）
4. 确认后，将选中文字替换为 `<ruby>` 标签
5. 重新生成 HTML

### 新建诗词命令

修改 `createNewPoem`：
- 创建新文件后自动打开
- 默认进入表单模式
- 表单为空，等待用户填写

## 样式

```css
.heti-mode-switcher {
  display: flex;
  gap: 4px;
  padding: 6px 12px;
  border-bottom: 1px solid var(--background-modifier-border);
}
.heti-mode-btn {
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  background: transparent;
  border: none;
  color: var(--text-muted);
}
.heti-mode-btn.active {
  background: var(--interactive-accent);
  color: var(--text-on-accent);
}
.heti-poem-form {
  padding: 16px;
  max-height: 60vh;
  overflow-y: auto;
}
.heti-form-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.heti-form-label {
  min-width: 60px;
  font-weight: 500;
}
.heti-form-input {
  flex: 1;
  padding: 6px 8px;
}
.heti-form-lines {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.heti-form-line {
  display: flex;
  gap: 4px;
}
.heti-form-line input {
  flex: 1;
}
.heti-form-line .clickable-icon {
  cursor: pointer;
}
```

## 移除的旧功能

- `toolbar.ts` 中的 `HetiToolbarWidget`（插入模板、换行、横竖排按钮）
- 这些功能整合到表单 UI 中

## 保留的旧功能

- `ruby-modal.ts`（注音弹窗）
- `templates.ts`（HTML 模板生成，供表单调用）
- 阅读模式 PostProcessor（frontmatter → CSS class）

## 已有文件解析

打开已有的 heti 文件时，需要将 HTML 反向解析填充表单：

1. 解析 frontmatter 获取：heti 类型、朝代、作者
2. 解析 `<h2>` 标签获取标题（去掉 `<span>` 元素）
3. 解析 `<p class="heti-x-large">` 内容，按 `<br>` 分割为各行
4. 每行去掉 `<span class="heti-hang">` 标点和 HTML 标签，得到纯文本
5. 如果行内有 `<ruby>` 标签，保留原始 HTML（注音在源码模式可见，表单模式下显示纯文本）

解析函数：`parseExistingPoem(html: string, frontmatter: Record<string, any>): PoemFormData`

## 注音在表单中的实现

表单模式下，每行正文输入后自动拆分为单字卡片：

1. 用户在输入框中输入一行文字（如 "床前明月光"）
2. 输入框失焦或按回车后，文字自动拆分为单字卡片
3. 每个卡片显示：汉字 + 拼音（如有）
4. 点击卡片弹出拼音键盘，用点击方式输入拼音和声调
5. 悬停卡片右上角显示 × 按钮，点击删除该字

### 拼音键盘设计

点击单字卡片后，在卡片下方展开拼音键盘（内联展开，非弹窗）：

```
┌─────┐
│ 床  │ ← 选中状态
│chuáng│
└─────┘
┌─────────────────────────────────┐
│ 声母: b p m f d t n l g k h j q x zh ch sh r z c s y w  │
│ 韵母: a o e i u ü ai ei ao ou an en ang eng ong ia ie     │
│       iu iao ian in iang ing iong ua uo uai ui uan un uang │
│       üe üan ün                                           │
│ 声调: ˉ  ˊ  ˇ  ˋ                                         │
│                                    [确认]  [清除]          │
└─────────────────────────────────┘
```

拼音键盘布局：
- 第一行：声母按钮（zh/ch/sh 为组合键）
- 第二、三行：韵母按钮
- 第四行：四个声调按钮 + 确认/清除按钮
- 拼音输入区：实时预览当前拼写的拼音（如 "chuáng"）

使用流程：
1. 点击声母（如 zh）
2. 点击韵母（如 uang）
3. 点击声调（如 ˊ）
4. 预览区显示 "chuáng"
5. 点击确认，拼音应用到该字

数据结构：每行正文存储 `{ chars: Array<{ char: string; pinyin?: string }> }`。

## 边界情况

1. **空标题**：阻止切换到源码/阅读模式，显示提示
2. **空正文**：至少保留一行输入框
3. **已有内容的文件**：打开时解析 frontmatter 和 HTML，填充表单
4. **非 heti 文件**：不显示模式切换栏和表单，保持正常编辑器行为
5. **多行注音**：支持选中跨行文字注音（通过 RubyModal 的逐字模式）
6. **手动编辑源码后切回表单**：重新解析 HTML 填充表单（可能丢失无法解析的格式）
