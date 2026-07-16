# 诗词字体配置设计文档

## 概述

为 Heti 插件添加字体配置功能，允许用户为每个诗词文档选择独立的字体，应用于整个 `.heti` 区块（标题、正文、注音），不影响其他文档。

## 设计决策

### 存储方式
- **Frontmatter 字段**：`字体: "楷体"`
- 每个文档独立配置，不影响其他文档
- 遵循现有 frontmatter 模式（`heti`、`朝代`、`作者`）

### UI 交互
- **表单模式下拉框**：在类型选择下方添加字体和字号选择
- **动态字体检测**：自动检测系统已安装的中文字体
- **默认字体**：显示当前 Obsidian 使用的字体（而非"无"）
- **字号配置**：仅配置正文大小，标题/作者/朝代按比例自动适配

### CSS 应用
- 使用 CSS 变量 `--heti-font` 应用字体
- 使用 CSS 变量 `--heti-font-size` 应用正文字号
- 在 `.heti` 元素上设置 `font-family: var(--heti-font, inherit)` 和 `font-size: var(--heti-font-size, inherit)`
- 通过内联样式传递字体和字号值
- 标题、作者、朝代等按比例自动缩放

## 数据结构

### PoemFormData 扩展
```typescript
export interface PoemFormData {
  title: string;
  hetiType: "poetry" | "ancient" | "vertical";
  dynasty: string;
  author: string;
  font: string;      // 新增：字体名称，空字符串表示使用 Obsidian 默认
  fontSize: number;  // 新增：正文字号（px），0 表示使用默认
  lines: PoemLine[];
}
```

### Frontmatter 示例
```yaml
---
heti: poetry
朝代: 唐
作者: 李白
字体: "楷体"
字号: 24
---
```

## 代码变更

### 1. src/font-detector.ts（新增）
动态检测系统已安装的中文字体，并获取 Obsidian 默认字体：
```typescript
// 获取 Obsidian 默认字体
export function getDefaultFont(): string {
  const editor = document.querySelector(".cm-editor");
  if (editor) {
    const computedFont = window.getComputedStyle(editor).fontFamily;
    return computedFont.split(",")[0].trim().replace(/['"]/g, "");
  }
  return "serif";
}

// 常见中文字体列表
const CHINESE_FONTS = [
  "SimSun", "SimHei", "KaiTi", "FangSong",
  "Microsoft YaHei", "STSong", "STHeiti", "STKaiti", "STFangsong",
  "LiSu", "YouYuan", "PMingLiU", "MingLiU",
  // ... 更多字体
];

// 检测字体是否可用
function isFontAvailable(fontName: string): boolean {
  const testString = "测";
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return false;
  
  // 使用默认字体测量
  ctx.font = `12px serif`;
  const defaultWidth = ctx.measureText(testString).width;
  
  // 使用目标字体测量
  ctx.font = `12px "${fontName}", serif`;
  const targetWidth = ctx.measureText(testString).width;
  
  return defaultWidth !== targetWidth;
}

// 获取所有可用的中文字体
export function getAvailableChineseFonts(): string[] {
  return CHINESE_FONTS.filter(isFontAvailable);
}
```

### 2. src/poem-data.ts
- `createEmptyForm()`：添加 `font: ""` 和 `fontSize: 0` 字段
- `generatePoemHtml()`：在 frontmatter 中添加 `字体` 和 `字号` 字段
- `generatePoemHtml()`：在 `.heti` div 上添加 `style="--heti-font: ...; --heti-font-size: ..."` 属性
- `parseExistingPoem()`：解析 `字体` 和 `字号` 字段

### 3. src/form-widget.ts
- `renderForm()`：在类型选择下方添加字体下拉框
- 字体下拉框选项来自 `getAvailableChineseFonts()` 动态检测
- 字体变更时调用 `syncToEditor()`

### 4. src/styles.css
- 添加 CSS 变量 `--heti-font` 和 `--heti-font-size` 的默认值
- 添加标题、作者、朝代等元素的比例缩放规则

## 字体检测

### 检测原理
使用 Canvas API 测量文字宽度，比较默认字体和目标字体的渲染结果。如果宽度不同，说明目标字体可用。

### 检测的字体列表
```typescript
const CHINESE_FONTS = [
  // Windows 常见字体
  "SimSun", "SimHei", "KaiTi", "FangSong",
  "Microsoft YaHei", "Microsoft YaHei Light",
  
  // macOS 常见字体
  "STSong", "STHeiti", "STKaiti", "STFangsong",
  "PingFang SC", "Hiragino Sans GB",
  
  // 其他中文字体
  "LiSu", "YouYuan", "PMingLiU", "MingLiU",
  "NSimSun", "FZXiaoBiaoSong-B05S",
];
```

### 检测时机
- 插件加载时检测一次
- 结果缓存，避免重复检测
- 下拉框显示时使用缓存结果
- 第一个选项为 Obsidian 默认字体（显示为"默认"）

## 生成的 HTML 示例

### 无字体/字号配置
```html
<div class="heti heti--poetry">
  <h2>静夜思</h2>
  <p class="heti-x-large">...</p>
</div>
```

### 有字体和字号配置
```html
<div class="heti heti--poetry" style="--heti-font: KaiTi, '楷体'; --heti-font-size: 24px">
  <h2>静夜思</h2>
  <p class="heti-x-large">...</p>
</div>
```

### CSS 比例缩放规则
```css
.heti h2 {
  font-size: calc(var(--heti-font-size, inherit) * 1.5);
}
.heti .heti-meta {
  font-size: calc(var(--heti-font-size, inherit) * 0.75);
}
.heti .heti-x-large {
  font-size: var(--heti-font-size, inherit);
}
```

## 边界情况

1. **字体不存在**：浏览器会回退到默认字体，不会报错
2. **frontmatter 无字体/字号字段**：使用 Obsidian 默认值，保持现有行为
3. **切换字体/字号后刷新**：frontmatter 已保存，重新加载后正确应用
4. **阅读模式**：CSS 变量在阅读模式下同样生效
5. **字号为 0**：表示使用默认字号，不添加 CSS 变量
6. **比例缩放**：标题为正文字号的 1.5 倍，作者/朝代为 0.75 倍

## 测试要点

1. 新建诗词文件，选择字体和字号，验证 frontmatter 正确写入
2. 打开已有诗词文件，验证字体/字号下拉框显示当前值
3. 切换字体/字号，验证编辑器和阅读模式都正确应用
4. 验证标题、作者、朝代等按比例自动缩放
5. 验证普通 markdown 文档不受影响
6. 验证默认字体显示为 Obsidian 当前字体
