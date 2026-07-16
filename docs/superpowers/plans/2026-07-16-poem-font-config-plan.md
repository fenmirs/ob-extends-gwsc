# 诗词字体配置实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 Heti 插件添加字体和字号配置功能，支持动态检测系统中文字体，允许用户为每个诗词文档选择独立的字体和字号。

**Architecture:** 新增 `font-detector.ts` 工具模块检测系统字体；扩展 `PoemFormData` 接口添加 `font` 和 `fontSize` 字段；在表单 UI 添加字体/字号选择控件；通过 CSS 变量应用字体和比例缩放。

**Tech Stack:** TypeScript, CM6 ViewPlugin, Obsidian API, CSS Variables

## Global Constraints

- 字体配置仅影响 `.heti` 区块，不影响其他文档
- 默认字体显示为 Obsidian 当前字体（非"无"）
- 字号仅配置正文大小，标题/作者/朝代按比例自动缩放
- 动态检测系统已安装的中文字体，结果缓存

---

## File Structure

| 文件 | 职责 |
|------|------|
| `src/font-detector.ts` | 字体检测工具：获取默认字体、检测可用中文字体 |
| `src/poem-data.ts` | 数据结构扩展：添加 `font`/`fontSize` 字段，更新 HTML 生成/解析 |
| `src/form-widget.ts` | UI 扩展：添加字体/字号下拉框 |
| `src/styles.css` | CSS 变量：添加 `--heti-font`/`--heti-font-size` 及比例缩放规则 |

---

### Task 1: 创建字体检测工具

**Files:**
- Create: `src/font-detector.ts`

**Interfaces:**
- Produces: `getDefaultFont(): string`, `getAvailableChineseFonts(): string[]`

- [ ] **Step 1: 创建 font-detector.ts**

```typescript
// src/font-detector.ts

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

let cachedFonts: string[] | null = null;

export function getDefaultFont(): string {
  const editor = document.querySelector(".cm-editor");
  if (editor) {
    const computedFont = window.getComputedStyle(editor).fontFamily;
    return computedFont.split(",")[0].trim().replace(/['"]/g, "");
  }
  return "serif";
}

function isFontAvailable(fontName: string): boolean {
  const testString = "测";
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return false;
  
  ctx.font = `12px serif`;
  const defaultWidth = ctx.measureText(testString).width;
  
  ctx.font = `12px "${fontName}", serif`;
  const targetWidth = ctx.measureText(testString).width;
  
  return defaultWidth !== targetWidth;
}

export function getAvailableChineseFonts(): string[] {
  if (cachedFonts) return cachedFonts;
  cachedFonts = CHINESE_FONTS.filter(isFontAvailable);
  return cachedFonts;
}
```

- [ ] **Step 2: 验证 TypeScript 编译**

Run: `npx tsc --noEmit`
Expected: 无新增错误

- [ ] **Step 3: 提交**

```bash
git add src/font-detector.ts
git commit -m "feat: add font detection utility"
```

---

### Task 2: 扩展数据结构和 HTML 生成

**Files:**
- Modify: `src/poem-data.ts:1-145`

**Interfaces:**
- Consumes: 无
- Produces: `PoemFormData.font`, `PoemFormData.fontSize`, 更新后的 `generatePoemHtml()`, `parseExistingPoem()`

- [ ] **Step 1: 更新 PoemFormData 接口**

```typescript
// src/poem-data.ts 顶部
export interface PoemFormData {
  title: string;
  hetiType: "poetry" | "ancient" | "vertical";
  dynasty: string;
  author: string;
  font: string;      // 字体名称，空字符串表示使用 Obsidian 默认
  fontSize: number;  // 正文字号（px），0 表示使用默认
  lines: PoemLine[];
}
```

- [ ] **Step 2: 更新 createEmptyForm()**

```typescript
export function createEmptyForm(): PoemFormData {
  return {
    title: "",
    hetiType: "poetry",
    dynasty: "",
    author: "",
    font: "",
    fontSize: 0,
    lines: [{ chars: [] }],
  };
}
```

- [ ] **Step 3: 更新 generatePoemHtml() 的 frontmatter 部分**

```typescript
export function generatePoemHtml(data: PoemFormData): string {
  // ... 现有 lines 处理逻辑不变 ...

  let frontmatter = `---\nheti: ${data.hetiType}\n`;
  if (data.dynasty) frontmatter += `朝代: "${escapeYamlValue(data.dynasty)}"\n`;
  if (data.author) frontmatter += `作者: "${escapeYamlValue(data.author)}"\n`;
  if (data.font) frontmatter += `字体: "${escapeYamlValue(data.font)}"\n`;
  if (data.fontSize > 0) frontmatter += `字号: ${data.fontSize}\n`;
  frontmatter += "---\n\n";

  // ... 现有 titleSpan 处理逻辑不变 ...

  // 构建 style 属性
  const styleParts: string[] = [];
  if (data.font) styleParts.push(`--heti-font: ${data.font}`);
  if (data.fontSize > 0) styleParts.push(`--heti-font-size: ${data.fontSize}px`);
  const styleAttr = styleParts.length > 0 ? ` style="${styleParts.join("; ")}"` : "";

  return `${frontmatter}<div class="${containerClass}"${styleAttr}>
  <h2>${escapeHtml(data.title)}${titleSpan}</h2>
  <p class="heti-x-large">
${lines}
  </p>
</div>`;
}
```

- [ ] **Step 4: 更新 parseExistingPoem()**

```typescript
export function parseExistingPoem(
  content: string,
  frontmatter: Record<string, any>
): PoemFormData {
  const fmType = frontmatter?.heti || "poetry";
  const dynasty = frontmatter?.朝代 || "";
  const author = frontmatter?.作者 || "";
  const font = frontmatter?.字体 || "";
  const fontSize = typeof frontmatter?.字号 === "number" ? frontmatter.字号 : 0;

  // ... 现有 titleMatch 和 bodyMatch 逻辑不变 ...
  // ... 现有 lines 解析逻辑不变 ...

  return {
    title,
    hetiType: fmType as PoemFormData["hetiType"],
    dynasty,
    author,
    font,
    fontSize,
    lines: lines.length > 0 ? lines : [{ chars: [] }],
  };
}
```

- [ ] **Step 5: 验证 TypeScript 编译**

Run: `npx tsc --noEmit`
Expected: 无新增错误

- [ ] **Step 6: 构建**

Run: `npm run build`
Expected: 构建成功

- [ ] **Step 7: 提交**

```bash
git add src/poem-data.ts
git commit -m "feat: extend PoemFormData with font and fontSize fields"
```

---

### Task 3: 更新表单 UI

**Files:**
- Modify: `src/form-widget.ts:101-179`

**Interfaces:**
- Consumes: `getDefaultFont()`, `getAvailableChineseFonts()` from `src/font-detector.ts`
- Produces: 字体/字号下拉框 UI

- [ ] **Step 1: 在 form-widget.ts 顶部添加导入**

```typescript
import { getDefaultFont, getAvailableChineseFonts } from "./font-detector";
```

- [ ] **Step 2: 在 renderForm() 中添加字体下拉框**

在 `typeSelect.addEventListener("change", ...)` 之后添加：

```typescript
    const fontRow = container.createEl("div", { cls: "heti-form-row" });
    fontRow.createEl("label", { cls: "heti-form-label", text: "字体" });
    const fontSelect = fontRow.createEl("select", {
      cls: "heti-form-select",
    });
    
    // 默认字体选项
    const defaultOpt = fontSelect.createEl("option", { value: "", text: "默认" });
    if (!this.formData.font) defaultOpt.selected = true;
    
    // 动态检测的字体选项
    const availableFonts = getAvailableChineseFonts();
    availableFonts.forEach((fontName) => {
      const opt = fontSelect.createEl("option", { value: fontName, text: fontName });
      if (fontName === this.formData.font) opt.selected = true;
    });
    
    fontSelect.addEventListener("change", () => {
      this.formData.font = fontSelect.value;
      this.syncToEditor();
    });
```

- [ ] **Step 3: 在 renderForm() 中添加字号下拉框**

在字体下拉框之后添加：

```typescript
    const fontSizeRow = container.createEl("div", { cls: "heti-form-row" });
    fontSizeRow.createEl("label", { cls: "heti-form-label", text: "字号" });
    const fontSizeSelect = fontSizeRow.createEl("select", {
      cls: "heti-form-select",
    });
    
    // 字号选项
    const fontSizes = [
      { value: 0, label: "默认" },
      { value: 16, label: "16px" },
      { value: 18, label: "18px" },
      { value: 20, label: "20px" },
      { value: 24, label: "24px" },
      { value: 28, label: "28px" },
      { value: 32, label: "32px" },
      { value: 36, label: "36px" },
    ];
    
    fontSizes.forEach(({ value, label }) => {
      const opt = fontSizeSelect.createEl("option", { value: String(value), text: label });
      if (value === this.formData.fontSize) opt.selected = true;
    });
    
    fontSizeSelect.addEventListener("change", () => {
      this.formData.fontSize = Number(fontSizeSelect.value);
      this.syncToEditor();
    });
```

- [ ] **Step 4: 验证 TypeScript 编译**

Run: `npx tsc --noEmit`
Expected: 无新增错误

- [ ] **Step 5: 构建**

Run: `npm run build`
Expected: 构建成功

- [ ] **Step 6: 提交**

```bash
git add src/form-widget.ts
git commit -m "feat: add font and font size selectors to form UI"
```

---

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

---

### Task 5: 清理调试日志

**Files:**
- Modify: `src/form-widget.ts:290-317`
- Modify: `src/mode-switcher.ts:75-81`

**Interfaces:**
- 无新增接口

- [ ] **Step 1: 移除 form-widget.ts 中的 console.log**

删除 `buildDecorations()` 和 `syncFormModeClass()` 中的所有 `console.log` 语句。

- [ ] **Step 2: 移除 mode-switcher.ts 中的 console.log**

删除 `buildDecorations()` 中的所有 `console.log` 语句。

- [ ] **Step 3: 构建**

Run: `npm run build`
Expected: 构建成功

- [ ] **Step 4: 提交**

```bash
git add src/form-widget.ts src/mode-switcher.ts
git commit -m "chore: remove debug logging"
```

---

## Self-Review Checklist

- [x] Spec coverage: 字体检测 ✓, 数据结构扩展 ✓, 表单 UI ✓, CSS 应用 ✓, 比例缩放 ✓
- [x] Placeholder scan: 无 TBD/TODO
- [x] Type consistency: `PoemFormData.font`/`fontSize` 在所有任务中一致
- [x] 命名一致: `getDefaultFont()`, `getAvailableChineseFonts()` 在所有任务中一致
