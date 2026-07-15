# 诗词表单 UI 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 Heti 插件从"直接编辑 HTML 源码"改为"表单驱动"模式，支持表单/源码/阅读三种视图切换。

**Architecture:** 使用 CM6 StateField 管理视图模式，通过 Widget 注入模式切换栏和表单区域。表单数据实时生成 HTML 写入底层文档，切换到源码/阅读模式时显示对应内容。

**Tech Stack:** TypeScript, CodeMirror 6 (StateField, ViewPlugin, WidgetType), Obsidian API (Plugin, Modal, MarkdownView)

## Global Constraints

- Obsidian 插件 API（minAppVersion: 0.15.0）
- CM6 外部依赖通过 esbuild external 处理
- 样式通过 `styles.css` 加载（Obsidian 自动读取插件根目录）
- 不引入额外 npm 依赖

---

## 文件结构

```
src/
├── main.ts              # 插件入口（修改）
├── view-mode.ts         # StateField 定义和模式切换（新建）
├── mode-switcher.ts     # 模式切换按钮 Widget（新建）
├── form-widget.ts       # 表单 Widget（新建）
├── char-card.ts         # 单字卡片组件（新建）
├── pinyin-keyboard.ts   # 拼音键盘组件（新建）
├── poem-data.ts         # 数据结构和解析（新建）
├── templates.ts         # HTML 生成（修改）
├── ruby-modal.ts        # 注音弹窗（保留）
├── toolbar.ts           # 旧工具栏（删除）
└── styles.css           # 样式（修改）
```

---

### Task 1: 数据结构和 HTML 生成

**Files:**
- Create: `src/poem-data.ts`
- Modify: `src/templates.ts:1-53`

**Interfaces:**
- Produces: `PoemLine`, `PoemFormData`, `generatePoemHtml()`, `parseExistingPoem()`

- [ ] **Step 1: 创建数据结构文件**

```typescript
// src/poem-data.ts
export interface CharData {
  char: string;
  pinyin?: string;
}

export interface PoemLine {
  chars: CharData[];
}

export interface PoemFormData {
  title: string;
  hetiType: "poetry" | "ancient" | "vertical";
  dynasty: string;
  author: string;
  lines: PoemLine[];
}

export function createEmptyForm(): PoemFormData {
  return {
    title: "",
    hetiType: "poetry",
    dynasty: "",
    author: "",
    lines: [{ chars: [] }],
  };
}

export function textToChars(text: string): CharData[] {
  return text.split("").map((char) => ({ char }));
}

export function charsToText(chars: CharData[]): string {
  return chars.map((c) => c.char).join("");
}

export function textToLine(text: string): PoemLine {
  return { chars: textToChars(text) };
}
```

- [ ] **Step 2: 添加 HTML 生成函数**

在 `src/poem-data.ts` 末尾追加：

```typescript
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeYamlValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function buildRubyHtml(chars: CharData[]): string {
  return chars
    .map((c) => {
      if (c.pinyin) {
        return `${escapeHtml(c.char)}<rt>${escapeHtml(c.pinyin)}</rt>`;
      }
      return escapeHtml(c.char);
    })
    .join("");
}

export function generatePoemHtml(data: PoemFormData): string {
  const lines = data.lines
    .filter((line) => line.chars.length > 0)
    .map((line, i, arr) => {
      const content = buildRubyHtml(line.chars);
      const punct = i % 2 === 0 ? "，" : "。";
      return `    ${content}<span class="heti-hang">${punct}</span>`;
    })
    .join("<br>\n");

  const containerClass =
    data.hetiType === "vertical"
      ? "heti heti--vertical"
      : `heti heti--${data.hetiType}`;

  let frontmatter = `---\nheti: ${data.hetiType}\n`;
  if (data.dynasty) frontmatter += `朝代: "${escapeYamlValue(data.dynasty)}"\n`;
  if (data.author) frontmatter += `作者: "${escapeYamlValue(data.author)}"\n`;
  frontmatter += "---\n\n";

  const titleSpan = data.dynasty || data.author
    ? `<span class="heti-meta heti-small">[${escapeHtml(data.dynasty)}]<abbr title="${escapeHtml(data.author)}">${escapeHtml(data.author)}</abbr></span>`
    : "";

  return `${frontmatter}<div class="${containerClass}">
  <h2>${escapeHtml(data.title)}${titleSpan}</h2>
  <p class="heti-x-large">
${lines}
  </p>
</div>`;
}
```

- [ ] **Step 3: 添加 HTML 解析函数**

在 `src/poem-data.ts` 末尾追加：

```typescript
export function parseExistingPoem(
  content: string,
  frontmatter: Record<string, any>
): PoemFormData {
  const fmType = frontmatter?.heti || "poetry";
  const dynasty = frontmatter?.朝代 || "";
  const author = frontmatter?.作者 || "";

  const titleMatch = content.match(/<h2>(.*?)<span/);
  const title = titleMatch
    ? titleMatch[1].replace(/<[^>]+>/g, "")
    : "";

  const bodyMatch = content.match(
    /<p class="heti-x-large">([\s\S]*?)<\/p>/
  );
  const body = bodyMatch ? bodyMatch[1] : "";
  const rawLines = body.split(/<br\s*\/?>/);

  const lines: PoemLine[] = rawLines
    .map((raw) => {
      const clean = raw
        .replace(/<span class="heti-hang">[^<]*<\/span>/g, "")
        .trim();
      if (!clean) return null;
      const chars: CharData[] = [];
      const rubyRegex = /<ruby>(.*?)<rt>(.*?)<\/rt><\/ruby>|./g;
      let match;
      while ((match = rubyRegex.exec(clean)) !== null) {
        if (match[1] && match[2]) {
          const text = match[1].replace(/<[^>]+>/g, "");
          text.split("").forEach((ch) =>
            chars.push({ char: ch, pinyin: match[2] })
          );
        } else if (match[0]) {
          chars.push({ char: match[0] });
        }
      }
      return chars.length > 0 ? { chars } : null;
    })
    .filter((l): l is PoemLine => l !== null);

  return {
    title,
    hetiType: fmType as PoemFormData["hetiType"],
    dynasty,
    author,
    lines: lines.length > 0 ? lines : [{ chars: [] }],
  };
}
```

- [ ] **Step 4: 更新 templates.ts**

删除 `src/templates.ts` 中的 `generatePoemTemplate` 和 `generateFrontmatter` 函数，保留文件但改为空导出（或直接删除文件，在后续任务中移除引用）。

- [ ] **Step 5: 运行类型检查**

Run: `npx tsc --noEmit`
Expected: 无错误（或仅已知的 obsidian 类型警告）

- [ ] **Step 6: 提交**

```bash
git add src/poem-data.ts src/templates.ts
git commit -m "feat: add poem data structures and HTML generation"
```

---

### Task 2: 视图模式 StateField

**Files:**
- Create: `src/view-mode.ts`

**Interfaces:**
- Produces: `viewModeField`, `setViewMode`, `ViewMode`

- [ ] **Step 1: 创建 StateField**

```typescript
// src/view-mode.ts
import { StateField, StateEffect } from "@codemirror/state";

export type ViewMode = "form" | "source" | "preview";

export const setViewMode = StateEffect.define<ViewMode>();

export const viewModeField = StateField.define<ViewMode>({
  create: () => "form",
  update(value, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setViewMode)) return effect.value;
    }
    return value;
  },
});
```

- [ ] **Step 2: 运行类型检查**

Run: `npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 3: 提交**

```bash
git add src/view-mode.ts
git commit -m "feat: add view mode state field"
```

---

### Task 3: 模式切换按钮 Widget

**Files:**
- Create: `src/mode-switcher.ts`

**Interfaces:**
- Consumes: `viewModeField`, `setViewMode` from `src/view-mode.ts`
- Produces: `createModeSwitcher()`

- [ ] **Step 1: 创建模式切换 Widget**

```typescript
// src/mode-switcher.ts
import { EditorView, ViewPlugin, ViewUpdate, Decoration, DecorationSet, WidgetType } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { Plugin } from "obsidian";
import { viewModeField, setViewMode, ViewMode } from "./view-mode";

class ModeSwitcherWidget extends WidgetType {
  private plugin: Plugin;
  constructor(plugin: Plugin) {
    super();
    this.plugin = plugin;
  }

  toDOM(view: EditorView): HTMLElement {
    const container = document.createElement("div");
    container.className = "heti-mode-switcher";

    const modes: { key: ViewMode; label: string }[] = [
      { key: "form", label: "表单" },
      { key: "source", label: "源码" },
      { key: "preview", label: "阅读" },
    ];

    const currentMode = view.state.field(viewModeField);

    modes.forEach(({ key, label }) => {
      const btn = document.createElement("button");
      btn.className = `heti-mode-btn${currentMode === key ? " active" : ""}`;
      btn.textContent = label;
      btn.addEventListener("click", () => {
        view.dispatch({ effects: setViewMode.of(key) });
      });
      container.appendChild(btn);
    });

    return container;
  }

  eq(other: ModeSwitcherWidget): boolean {
    return false;
  }
}

export function createModeSwitcher(plugin: Plugin) {
  const emptyDeco = Decoration.set([]);

  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      private widget = new ModeSwitcherWidget(plugin);
      private deco = Decoration.widget({ widget: this.widget, side: -1 });
      private cacheRef: import("obsidian").EventRef | null = null;

      constructor(view: EditorView) {
        this.decorations = this.buildDecorations(view);
        const recheck = () => {
          this.decorations = this.buildDecorations(view);
          view.dispatch({});
        };
        this.cacheRef = plugin.app.metadataCache.on("changed", recheck);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged || update.startState.field(viewModeField) !== update.state.field(viewModeField)) {
          this.decorations = this.buildDecorations(update.view);
        }
      }

      destroy() {
        if (this.cacheRef) {
          plugin.app.metadataCache.off(this.cacheRef);
          this.cacheRef = null;
        }
      }

      buildDecorations(view: EditorView): DecorationSet {
        const file = getFileForView(plugin, view);
        if (!file) return emptyDeco;
        const cache = plugin.app.metadataCache.getFileCache(file);
        if (!cache?.frontmatter?.heti) return emptyDeco;
        return Decoration.set([{ from: 0, to: 0, value: this.deco }]);
      }
    },
    { decorations: (v) => v.decorations }
  );
}

function getFileForView(plugin: Plugin, editorView: EditorView) {
  const leaves = plugin.app.workspace.getLeavesOfType("markdown");
  for (const leaf of leaves) {
    const view = leaf.view;
    if (view instanceof import("obsidian").MarkdownView && view.editor) {
      const cm = (view.editor as any).cm || (view.editor as any).editor;
      if (cm === editorView) return view.file;
    }
  }
  const activeView = plugin.app.workspace.getActiveViewOfType(import("obsidian").MarkdownView);
  return activeView?.file ?? null;
}
```

- [ ] **Step 2: 运行类型检查**

Run: `npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 3: 提交**

```bash
git add src/mode-switcher.ts
git commit -m "feat: add mode switcher widget"
```

---

### Task 4: 拼音键盘组件

**Files:**
- Create: `src/pinyin-keyboard.ts`

**Interfaces:**
- Consumes: `CharData` from `src/poem-data.ts`
- Produces: `PinyinKeyboard`, `PINYIN_DATA`

- [ ] **Step 1: 创建拼音数据和键盘组件**

```typescript
// src/pinyin-keyboard.ts
import { CharData } from "./poem-data";

export const INITIALS = [
  "b", "p", "m", "f", "d", "t", "n", "l",
  "g", "k", "h", "j", "q", "x",
  "zh", "ch", "sh", "r", "z", "c", "s", "y", "w",
];

export const FINALS = [
  "a", "o", "e", "i", "u", "ü",
  "ai", "ei", "ao", "ou", "an", "en", "ang", "eng", "ong",
  "ia", "ie", "iu", "iao", "ian", "in", "iang", "ing", "iong",
  "ua", "uo", "uai", "ui", "uan", "un", "uang",
  "üe", "üan", "ün",
];

export const TONES = ["\u0304", "\u0301", "\u030C", "\u0300"];

export const TONE_LABELS = ["ˉ", "ˊ", "ˇ", "ˋ"];

const TONE_MAP: Record<string, string> = {
  "\u0304": "",
  "\u0301": "",
  "\u030C": "",
  "\u0300": "",
};

export function applyTone(vowel: string, tone: string): string {
  const toneIndex = TONES.indexOf(tone);
  if (toneIndex === -1) return vowel;
  const baseVowels = "aeiouü";
  const toned = [
    ["ā", "á", "ǎ", "à"],
    ["ē", "é", "ě", "è"],
    ["ī", "í", "ǐ", "ì"],
    ["ō", "ó", "ǒ", "ò"],
    ["ū", "ú", "ǔ", "ù"],
    ["ǖ", "ǘ", "ǚ", "ǜ"],
  ];
  for (let i = 0; i < baseVowels.length; i++) {
    if (vowel.includes(baseVowels[i])) {
      return vowel.replace(baseVowels[i], toned[i][toneIndex]);
    }
  }
  return vowel;
}

export class PinyinKeyboard {
  private container: HTMLElement;
  private previewEl: HTMLElement;
  private initial = "";
  private final = "";
  private tone = "";
  private onConfirm: (pinyin: string) => void;
  private onClear: () => void;

  constructor(
    onConfirm: (pinyin: string) => void,
    onClear: () => void
  ) {
    this.onConfirm = onConfirm;
    this.onClear = onClear;
    this.container = document.createElement("div");
    this.container.className = "heti-pinyin-keyboard";
    this.build();
    this.previewEl = this.container.querySelector(".heti-pinyin-preview")!;
  }

  getElement(): HTMLElement {
    return this.container;
  }

  private build() {
    const preview = this.container.createEl("div", {
      cls: "heti-pinyin-preview",
    });
    preview.createEl("span", { cls: "heti-pinyin-text", text: "点击选择声母、韵母、声调" });

    const initialRow = this.container.createEl("div", {
      cls: "heti-pinyin-row",
    });
    initialRow.createEl("span", { cls: "heti-pinyin-label", text: "声母:" });
    INITIALS.forEach((ini) => {
      const btn = initialRow.createEl("button", {
        cls: "heti-pinyin-btn",
        text: ini,
      });
      btn.addEventListener("click", () => {
        this.initial = ini;
        this.updatePreview();
      });
    });

    const finalRow1 = this.container.createEl("div", {
      cls: "heti-pinyin-row",
    });
    finalRow1.createEl("span", { cls: "heti-pinyin-label", text: "韵母:" });
    FINALS.slice(0, 15).forEach((fin) => {
      const btn = finalRow1.createEl("button", {
        cls: "heti-pinyin-btn",
        text: fin,
      });
      btn.addEventListener("click", () => {
        this.final = fin;
        this.updatePreview();
      });
    });

    const finalRow2 = this.container.createEl("div", {
      cls: "heti-pinyin-row heti-pinyin-row-indent",
    });
    FINALS.slice(15).forEach((fin) => {
      const btn = finalRow2.createEl("button", {
        cls: "heti-pinyin-btn",
        text: fin,
      });
      btn.addEventListener("click", () => {
        this.final = fin;
        this.updatePreview();
      });
    });

    const toneRow = this.container.createEl("div", {
      cls: "heti-pinyin-row",
    });
    toneRow.createEl("span", { cls: "heti-pinyin-label", text: "声调:" });
    TONE_LABELS.forEach((label, i) => {
      const btn = toneRow.createEl("button", {
        cls: "heti-pinyin-btn",
        text: label,
      });
      btn.addEventListener("click", () => {
        this.tone = TONES[i];
        this.updatePreview();
      });
    });

    const actions = this.container.createEl("div", {
      cls: "heti-pinyin-actions",
    });
    const clearBtn = actions.createEl("button", {
      cls: "heti-pinyin-btn heti-pinyin-clear",
      text: "清除",
    });
    clearBtn.addEventListener("click", () => {
      this.initial = "";
      this.final = "";
      this.tone = "";
      this.onClear();
      this.updatePreview();
    });

    const confirmBtn = actions.createEl("button", {
      cls: "heti-pinyin-btn heti-pinyin-confirm mod-cta",
      text: "确认",
    });
    confirmBtn.addEventListener("click", () => {
      const pinyin = this.getPinyin();
      if (pinyin) this.onConfirm(pinyin);
    });
  }

  private getPinyin(): string {
    if (!this.final) return "";
    const base = this.initial + this.final;
    return applyTone(base, this.tone);
  }

  private updatePreview() {
    const text = this.previewEl.querySelector(".heti-pinyin-text");
    const pinyin = this.getPinyin();
    if (text) {
      text.textContent = pinyin || "点击选择声母、韵母、声调";
    }
  }

  setPinyin(pinyin: string) {
    this.initial = "";
    this.final = pinyin;
    this.tone = "";
    this.updatePreview();
  }
}
```

- [ ] **Step 2: 运行类型检查**

Run: `npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 3: 提交**

```bash
git add src/pinyin-keyboard.ts
git commit -m "feat: add pinyin keyboard component"
```

---

### Task 5: 单字卡片组件

**Files:**
- Create: `src/char-card.ts`

**Interfaces:**
- Consumes: `CharData` from `src/poem-data.ts`, `PinyinKeyboard` from `src/pinyin-keyboard.ts`
- Produces: `CharCard`

- [ ] **Step 1: 创建单字卡片组件**

```typescript
// src/char-card.ts
import { CharData } from "./poem-data";
import { PinyinKeyboard } from "./pinyin-keyboard";

export class CharCard {
  private container: HTMLElement;
  private charEl: HTMLElement;
  private pinyinEl: HTMLElement;
  private deleteBtn: HTMLElement;
  private keyboardContainer: HTMLElement;
  private keyboard: PinyinKeyboard | null = null;
  private data: CharData;
  private onUpdate: (data: CharData) => void;
  private onDelete: () => void;
  private isActive = false;

  constructor(
    data: CharData,
    onUpdate: (data: CharData) => void,
    onDelete: () => void
  ) {
    this.data = data;
    this.onUpdate = onUpdate;
    this.onDelete = onDelete;

    this.container = document.createElement("div");
    this.container.className = "heti-char-card";

    this.charEl = this.container.createEl("div", {
      cls: "heti-char",
      text: data.char,
    });

    this.pinyinEl = this.container.createEl("div", {
      cls: "heti-char-pinyin",
      text: data.pinyin || "",
    });

    this.deleteBtn = this.container.createEl("div", {
      cls: "heti-char-delete",
      text: "×",
    });
    this.deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.onDelete();
    });

    this.keyboardContainer = document.createElement("div");
    this.keyboardContainer.className = "heti-char-keyboard-container";

    this.container.addEventListener("click", () => this.toggleKeyboard());

    this.container.addEventListener("mouseenter", () => {
      this.container.classList.add("hovered");
    });
    this.container.addEventListener("mouseleave", () => {
      this.container.classList.remove("hovered");
    });
  }

  getElement(): HTMLElement {
    return this.container;
  }

  getKeyboardElement(): HTMLElement {
    return this.keyboardContainer;
  }

  getData(): CharData {
    return this.data;
  }

  private toggleKeyboard() {
    if (this.isActive) {
      this.closeKeyboard();
    } else {
      this.openKeyboard();
    }
  }

  openKeyboard() {
    this.isActive = true;
    this.container.classList.add("active");

    this.keyboard = new PinyinKeyboard(
      (pinyin) => {
        this.data.pinyin = pinyin;
        this.pinyinEl.textContent = pinyin;
        this.onUpdate(this.data);
        this.closeKeyboard();
      },
      () => {
        this.data.pinyin = undefined;
        this.pinyinEl.textContent = "";
        this.onUpdate(this.data);
      }
    );

    if (this.data.pinyin) {
      this.keyboard.setPinyin(this.data.pinyin);
    }

    this.keyboardContainer.empty();
    this.keyboardContainer.appendChild(this.keyboard.getElement());
    this.keyboardContainer.style.display = "block";
  }

  closeKeyboard() {
    this.isActive = false;
    this.container.classList.remove("active");
    this.keyboardContainer.style.display = "none";
    this.keyboardContainer.empty();
    this.keyboard = null;
  }
}
```

- [ ] **Step 2: 运行类型检查**

Run: `npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 3: 提交**

```bash
git add src/char-card.ts
git commit -m "feat: add character card component"
```

---

### Task 6: 表单 Widget

**Files:**
- Create: `src/form-widget.ts`

**Interfaces:**
- Consumes: `PoemFormData`, `textToLine`, `charsToText`, `generatePoemHtml`, `parseExistingPoem` from `src/poem-data.ts`, `CharCard` from `src/char-card.ts`, `viewModeField`, `setViewMode` from `src/view-mode.ts`
- Produces: `createFormWidget()`

- [ ] **Step 1: 创建表单 Widget**

```typescript
// src/form-widget.ts
import { EditorView, ViewPlugin, ViewUpdate, Decoration, DecorationSet, WidgetType } from "@codemirror/view";
import { Plugin, MarkdownView, TFile } from "obsidian";
import {
  PoemFormData,
  createEmptyForm,
  textToLine,
  charsToText,
  generatePoemHtml,
  parseExistingPoem,
  PoemLine,
} from "./poem-data";
import { CharCard } from "./char-card";
import { viewModeField, setViewMode } from "./view-mode";

class PoemFormWidget extends WidgetType {
  private plugin: Plugin;
  private formData: PoemFormData = createEmptyForm();
  private charCards: CharCard[][] = [[]];
  private formContainer: HTMLElement | null = null;

  constructor(plugin: Plugin) {
    super();
    this.plugin = plugin;
  }

  toDOM(view: EditorView): HTMLElement {
    const container = document.createElement("div");
    container.className = "heti-poem-form";
    this.formContainer = container;

    this.loadExistingContent(view);
    this.renderForm(container, view);
    return container;
  }

  eq(): boolean {
    return false;
  }

  private loadExistingContent(view: EditorView) {
    const file = this.getFileForView(view);
    if (!file) return;

    const cache = this.plugin.app.metadataCache.getFileCache(file);
    if (!cache?.frontmatter?.heti) return;

    const content = view.state.doc.toString();
    this.formData = parseExistingPoem(content, cache.frontmatter);
    this.rebuildCharCards();
  }

  private getFileForView(view: EditorView): TFile | null {
    const leaves = this.plugin.app.workspace.getLeavesOfType("markdown");
    for (const leaf of leaves) {
      const v = leaf.view;
      if (v instanceof MarkdownView && v.editor) {
        const cm = (v.editor as any).cm || (v.editor as any).editor;
        if (cm === view) return v.file;
      }
    }
    const activeView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
    return activeView?.file ?? null;
  }

  private rebuildCharCards() {
    this.charCards = this.formData.lines.map((line) =>
      line.chars.map((char, charIndex) => {
        const card = new CharCard(
          char,
          (updated) => {
            line.chars[charIndex] = updated;
            this.syncToEditor();
          },
          () => {
            line.chars.splice(charIndex, 1);
            this.rebuildForm();
            this.syncToEditor();
          }
        );
        return card;
      })
    );
  }

  private renderForm(container: HTMLElement, view: EditorView) {
    container.empty();

    const titleRow = container.createEl("div", { cls: "heti-form-row" });
    titleRow.createEl("label", { cls: "heti-form-label", text: "标题" });
    const titleInput = titleRow.createEl("input", {
      cls: "heti-form-input",
      type: "text",
      placeholder: "输入诗词标题",
    });
    titleInput.value = this.formData.title;
    titleInput.addEventListener("input", () => {
      this.formData.title = titleInput.value;
      this.syncToEditor();
    });

    const typeRow = container.createEl("div", { cls: "heti-form-row" });
    typeRow.createEl("label", { cls: "heti-form-label", text: "类型" });
    const typeSelect = typeRow.createEl("select", {
      cls: "heti-form-select",
    });
    [
      { value: "poetry", label: "诗词" },
      { value: "ancient", label: "古文" },
      { value: "vertical", label: "竖排" },
    ].forEach(({ value, label }) => {
      const opt = typeSelect.createEl("option", { value, text: label });
      if (value === this.formData.hetiType) opt.selected = true;
    });
    typeSelect.addEventListener("change", () => {
      this.formData.hetiType = typeSelect.value as PoemFormData["hetiType"];
      this.syncToEditor();
    });

    const dynastyRow = container.createEl("div", { cls: "heti-form-row" });
    dynastyRow.createEl("label", { cls: "heti-form-label", text: "朝代" });
    const dynastyInput = dynastyRow.createEl("input", {
      cls: "heti-form-input",
      type: "text",
      placeholder: "如：唐、宋",
    });
    dynastyInput.value = this.formData.dynasty;
    dynastyInput.addEventListener("input", () => {
      this.formData.dynasty = dynastyInput.value;
      this.syncToEditor();
    });

    const authorRow = container.createEl("div", { cls: "heti-form-row" });
    authorRow.createEl("label", { cls: "heti-form-label", text: "作者" });
    const authorInput = authorRow.createEl("input", {
      cls: "heti-form-input",
      type: "text",
      placeholder: "如：李白",
    });
    authorInput.value = this.formData.author;
    authorInput.addEventListener("input", () => {
      this.formData.author = authorInput.value;
      this.syncToEditor();
    });

    const linesContainer = container.createEl("div", {
      cls: "heti-form-lines",
    });

    this.formData.lines.forEach((line, lineIndex) => {
      this.renderLine(linesContainer, line, lineIndex, view);
    });

    const addLineBtn = container.createEl("button", {
      cls: "heti-form-add-line",
      text: "+ 添加一行",
    });
    addLineBtn.addEventListener("click", () => {
      this.formData.lines.push({ chars: [] });
      this.charCards.push([]);
      this.renderForm(container, view);
      this.syncToEditor();
    });
  }

  private renderLine(
    container: HTMLElement,
    line: PoemLine,
    lineIndex: number,
    view: EditorView
  ) {
    const lineEl = container.createEl("div", { cls: "heti-form-line" });

    const inputEl = lineEl.createEl("input", {
      cls: "heti-form-input",
      type: "text",
      placeholder: `第 ${lineIndex + 1} 句`,
    });
    inputEl.value = charsToText(line.chars);

    inputEl.addEventListener("blur", () => {
      const newText = inputEl.value;
      const newLine = textToLine(newText);
      this.formData.lines[lineIndex] = newLine;
      this.rebuildCharCards();
      this.renderForm(this.formContainer!, view);
      this.syncToEditor();
    });

    inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        inputEl.blur();
      }
    });

    const charContainer = lineEl.createEl("div", {
      cls: "heti-char-container",
    });

    const cards = this.charCards[lineIndex] || [];
    cards.forEach((card) => {
      charContainer.appendChild(card.getElement());
      charContainer.appendChild(card.getKeyboardElement());
    });

    if (this.formData.lines.length > 1) {
      const deleteBtn = lineEl.createEl("button", {
        cls: "heti-form-line-delete",
        text: "×",
      });
      deleteBtn.addEventListener("click", () => {
        this.formData.lines.splice(lineIndex, 1);
        this.charCards.splice(lineIndex, 1);
        this.renderForm(this.formContainer!, view);
        this.syncToEditor();
      });
    }
  }

  private syncToEditor() {
    const view = this.getActiveView();
    if (!view) return;

    const html = generatePoemHtml(this.formData);
    const currentContent = view.editor.getValue();

    if (currentContent !== html) {
      view.editor.setValue(html);
    }
  }

  private getActiveView(): MarkdownView | null {
    return this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
  }
}

export function createFormWidget(plugin: Plugin) {
  const emptyDeco = Decoration.set([]);

  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      private widget = new PoemFormWidget(plugin);
      private deco = Decoration.widget({ widget: this.widget, side: -1 });
      private cacheRef: import("obsidian").EventRef | null = null;

      constructor(view: EditorView) {
        this.decorations = this.buildDecorations(view);
        const recheck = () => {
          this.decorations = this.buildDecorations(view);
          view.dispatch({});
        };
        this.cacheRef = plugin.app.metadataCache.on("changed", recheck);
      }

      update(update: ViewUpdate) {
        if (
          update.docChanged ||
          update.viewportChanged ||
          update.startState.field(viewModeField) !==
            update.state.field(viewModeField)
        ) {
          this.decorations = this.buildDecorations(update.view);
        }
      }

      destroy() {
        if (this.cacheRef) {
          plugin.app.metadataCache.off(this.cacheRef);
          this.cacheRef = null;
        }
      }

      buildDecorations(view: EditorView): DecorationSet {
        const mode = view.state.field(viewModeField);
        if (mode !== "form") return emptyDeco;

        const file = this.getFileForView(view);
        if (!file) return emptyDeco;
        const cache = plugin.app.metadataCache.getFileCache(file);
        if (!cache?.frontmatter?.heti) return emptyDeco;

        return Decoration.set([{ from: 0, to: 0, value: this.deco }]);
      }

      private getFileForView(view: EditorView): TFile | null {
        const leaves = plugin.app.workspace.getLeavesOfType("markdown");
        for (const leaf of leaves) {
          const v = leaf.view;
          if (v instanceof MarkdownView && v.editor) {
            const cm = (v.editor as any).cm || (v.editor as any).editor;
            if (cm === view) return v.file;
          }
        }
        const activeView =
          plugin.app.workspace.getActiveViewOfType(MarkdownView);
        return activeView?.file ?? null;
      }
    },
    { decorations: (v) => v.decorations }
  );
}
```

- [ ] **Step 2: 运行类型检查**

Run: `npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 3: 提交**

```bash
git add src/form-widget.ts
git commit -m "feat: add poem form widget"
```

---

### Task 7: 集成到 main.ts

**Files:**
- Modify: `src/main.ts:1-66`

**Interfaces:**
- Consumes: `createModeSwitcher` from `src/mode-switcher.ts`, `createFormWidget` from `src/form-widget.ts`, `viewModeField`, `setViewMode` from `src/view-mode.ts`

- [ ] **Step 1: 更新 main.ts**

```typescript
// src/main.ts
import { Plugin, MarkdownView } from "obsidian";
import { createModeSwitcher } from "./mode-switcher";
import { createFormWidget } from "./form-widget";
import { viewModeField, setViewMode } from "./view-mode";

const TYPE_MAP: Record<string, string> = {
  poetry: "heti--poetry",
  ancient: "heti--ancient",
  annotation: "heti--annotation",
  vertical: "heti--vertical",
};

export { TYPE_MAP };

export default class HetiPlugin extends Plugin {
  async onload() {
    console.log("Heti 插件已加载");

    this.registerMarkdownPostProcessor((el, ctx) => {
      const cache = this.app.metadataCache.getFileCache(
        this.app.vault.getAbstractFileByPath(ctx.sourcePath) as any
      );
      const hetiType = cache?.frontmatter?.heti;
      if (!hetiType) return;
      el.addClass("heti");
      if (TYPE_MAP[hetiType]) el.addClass(TYPE_MAP[hetiType]);

      if (hetiType === "vertical") {
        el.style.writingMode = "vertical-rl";
        el.style.textOrientation = "upright";
      }
    });

    this.registerEditorExtension(createModeSwitcher(this));
    this.registerEditorExtension(createFormWidget(this));

    this.addCommand({
      id: "new-poem",
      name: "新建诗词",
      callback: () => this.createNewPoem(),
    });
  }

  async createNewPoem() {
    const leaf = this.app.workspace.getLeaf();
    const folderPath = "诗词";
    if (!(await this.app.vault.adapter.exists(folderPath))) {
      await this.app.vault.createFolder(folderPath);
    }
    const baseName = `${folderPath}/新建诗词`;
    let filePath = `${baseName}.md`;
    let counter = 1;
    while (await this.app.vault.adapter.exists(filePath)) {
      filePath = `${baseName} ${counter}.md`;
      counter++;
    }
    const file = await this.app.vault.create(
      filePath,
      '---\nheti: poetry\n朝代: \n作者: \n---\n\n<div class="heti heti--poetry">\n  <h2>标题<span class="heti-meta heti-small">[朝代]<abbr title="">作者</abbr></span></h2>\n  <p class="heti-x-large">\n    \n  </p>\n</div>'
    );
    await leaf.openFile(file);
  }

  onunload() {
    console.log("Heti 插件已卸载");
  }
}
```

- [ ] **Step 2: 删除旧工具栏引用**

确保 `src/main.ts` 中不再引用 `./toolbar`。

- [ ] **Step 3: 运行构建**

Run: `npm run build`
Expected: 构建成功，main.js 更新

- [ ] **Step 4: 提交**

```bash
git add src/main.ts
git commit -m "feat: integrate form UI into plugin"
```

---

### Task 8: 样式

**Files:**
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: class names from `form-widget.ts`, `char-card.ts`, `pinyin-keyboard.ts`, `mode-switcher.ts`

- [ ] **Step 1: 更新样式文件**

```css
/* 模式切换栏 */
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
  transition: background 0.15s, color 0.15s;
}
.heti-mode-btn:hover {
  background: var(--background-modifier-hover);
  color: var(--text-normal);
}
.heti-mode-btn.active {
  background: var(--interactive-accent);
  color: var(--text-on-accent);
}

/* 表单区域 */
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
  font-size: 14px;
}
.heti-form-input {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid var(--background-modifier-border);
  border-radius: 4px;
  background: var(--background-primary);
  color: var(--text-normal);
}
.heti-form-select {
  padding: 6px 8px;
  border: 1px solid var(--background-modifier-border);
  border-radius: 4px;
  background: var(--background-primary);
  color: var(--text-normal);
}
.heti-form-lines {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}
.heti-form-line {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  border: 1px solid var(--background-modifier-border);
  border-radius: 4px;
}
.heti-form-line input {
  flex: 1;
}
.heti-form-line-delete {
  align-self: flex-end;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 16px;
  padding: 2px 6px;
}
.heti-form-line-delete:hover {
  color: var(--text-error);
}
.heti-form-add-line {
  margin-top: 8px;
  padding: 8px;
  background: var(--background-secondary);
  border: 1px dashed var(--background-modifier-border);
  border-radius: 4px;
  cursor: pointer;
  color: var(--text-muted);
}
.heti-form-add-line:hover {
  background: var(--background-modifier-hover);
  color: var(--text-normal);
}

/* 单字卡片容器 */
.heti-char-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  min-height: 40px;
}

/* 单字卡片 */
.heti-char-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 8px;
  border: 1px solid var(--background-modifier-border);
  border-radius: 4px;
  cursor: pointer;
  min-width: 40px;
  transition: border-color 0.15s, background 0.15s;
}
.heti-char-card:hover {
  border-color: var(--interactive-accent);
  background: var(--background-secondary);
}
.heti-char-card.active {
  border-color: var(--interactive-accent);
  background: var(--interactive-accent-hover);
}
.heti-char {
  font-size: 18px;
  font-weight: 500;
}
.heti-char-pinyin {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
}
.heti-char-delete {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--background-modifier-hover);
  color: var(--text-muted);
  font-size: 12px;
  display: none;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  line-height: 1;
}
.heti-char-card.hovered .heti-char-delete {
  display: flex;
}
.heti-char-delete:hover {
  background: var(--text-error);
  color: var(--text-on-accent);
}

/* 拼音键盘容器 */
.heti-char-keyboard-container {
  display: none;
  width: 100%;
}

/* 拼音键盘 */
.heti-pinyin-keyboard {
  padding: 8px;
  border: 1px solid var(--background-modifier-border);
  border-radius: 4px;
  background: var(--background-secondary);
  margin-top: 4px;
}
.heti-pinyin-preview {
  padding: 8px;
  text-align: center;
  font-size: 18px;
  font-weight: 500;
  border-bottom: 1px solid var(--background-modifier-border);
  margin-bottom: 8px;
}
.heti-pinyin-text {
  color: var(--text-normal);
}
.heti-pinyin-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 6px;
  align-items: center;
}
.heti-pinyin-row-indent {
  padding-left: 44px;
}
.heti-pinyin-label {
  min-width: 40px;
  font-size: 13px;
  color: var(--text-muted);
}
.heti-pinyin-btn {
  padding: 4px 8px;
  border: 1px solid var(--background-modifier-border);
  border-radius: 4px;
  background: var(--background-primary);
  color: var(--text-normal);
  cursor: pointer;
  font-size: 13px;
  transition: background 0.1s;
}
.heti-pinyin-btn:hover {
  background: var(--background-modifier-hover);
}
.heti-pinyin-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--background-modifier-border);
}
.heti-pinyin-confirm {
  background: var(--interactive-accent);
  color: var(--text-on-accent);
}
.heti-pinyin-confirm:hover {
  opacity: 0.9;
}
```

- [ ] **Step 2: 复制样式到插件根目录**

Run: `Copy-Item src/styles.css styles.css`

- [ ] **Step 3: 运行构建**

Run: `npm run build`
Expected: 构建成功

- [ ] **Step 4: 提交**

```bash
git add src/styles.css styles.css
git commit -m "feat: add form UI styles"
```

---

### Task 9: 清理和最终构建

**Files:**
- Delete: `src/toolbar.ts`（可选，或保留但不再引用）

**Interfaces:**
- 无新增接口

- [ ] **Step 1: 移除旧工具栏**

如果 `src/toolbar.ts` 不再被任何文件引用，可以删除或注释掉。

- [ ] **Step 2: 确认构建成功**

Run: `npm run build`
Expected: 构建成功，无错误

- [ ] **Step 3: 确认类型检查通过**

Run: `npx tsc --noEmit`
Expected: 无错误（或仅已知的 obsidian 类型警告）

- [ ] **Step 4: 最终提交**

```bash
git add -A
git commit -m "feat: complete poem form UI implementation"
```
