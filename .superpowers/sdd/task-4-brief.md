# Task 4: 编辑器工具栏

## Goal
创建编辑器工具栏，提供插入模板、换行、注音、横竖排切换按钮。同时修改 main.ts 注册工具栏和命令。

## Files to Create/Modify
- Create: `src/toolbar.ts`
- Modify: `src/main.ts`

## Important Dependency Note

Task 4's toolbar code imports from `./ruby-modal` which is created in Task 5. For Task 4 to compile, you MUST create a minimal stub for `src/ruby-modal.ts` with the required exports:

```typescript
// src/ruby-modal.ts - STUB for Task 4 compilation
import { App, Modal } from "obsidian";

export class RubyModal extends Modal {
  private selectedText: string;
  private onSubmit: (pinyin: string) => void;

  constructor(app: App, selectedText: string, onSubmit: (pinyin: string) => void) {
    super(app);
    this.selectedText = selectedText;
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h3", { text: "注音（Task 5 实现）" });
    const input = contentEl.createEl("input", { type: "text" });
    const btn = contentEl.createEl("button", { text: "确认" });
    btn.addEventListener("click", () => {
      this.onSubmit(input.value);
      this.close();
    });
  }

  onClose() { this.contentEl.empty(); }
}

export function buildRubyHtml(characters: string, pinyin: string): string {
  return `<ruby>${characters}<rt>${pinyin}</rt></ruby>`;
}
```

## Steps

### Step 1: 创建 src/ruby-modal.ts (stub for compilation)
Use the stub code above.

### Step 2: 创建 src/toolbar.ts
```typescript
import { EditorView, ViewPlugin, ViewUpdate, Decoration, DecorationSet, WidgetType } from "@codemirror/view";
import { Plugin, MarkdownView, Notice } from "obsidian";
import { generatePoemTemplate, generateFrontmatter } from "./templates";
import { RubyModal, buildRubyHtml } from "./ruby-modal";

class HetiToolbarWidget extends WidgetType {
  private plugin: Plugin;
  constructor(plugin: Plugin) { super(); this.plugin = plugin; }

  toDOM() {
    const toolbar = document.createElement("div");
    toolbar.className = "heti-toolbar";
    const buttons = [
      { label: "📜 插入模板", action: () => this.insertTemplate() },
      { label: "↵ 换行", action: () => this.insertLineBreak() },
      { label: "🔤 注音", action: () => this.openRubyModal() },
      { label: "⇅ 横竖排", action: () => this.toggleVertical() },
    ];
    buttons.forEach((btn) => {
      const el = document.createElement("button");
      el.className = "heti-toolbar-btn";
      el.textContent = btn.label;
      el.addEventListener("click", btn.action);
      toolbar.appendChild(el);
    });
    return toolbar;
  }

  eq() { return true; }

  private insertTemplate() {
    const view = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) return;
    const editor = view.editor;
    const template = generatePoemTemplate();
    const content = editor.getValue();
    if (!content.startsWith("---")) {
      editor.setValue(generateFrontmatter() + template);
    } else {
      editor.replaceRange("\n\n" + template, editor.getCursor());
    }
  }

  private insertLineBreak() {
    const view = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) return;
    const editor = view.editor;
    const cursor = editor.getCursor();
    const line = editor.getLine(cursor.line);
    const lastChar = line.trim().slice(-1);
    const punct = ["。", "？", "！"].includes(lastChar) ? "" : lastChar;
    const hangPunct = punct ? `<span class="heti-hang">${punct}</span>` : "";
    const newLine = line.replace(/[，。！？；]+$/, "") + hangPunct + "<br>\n";
    editor.replaceRange(newLine, { line: cursor.line, ch: 0 }, { line: cursor.line, ch: line.length });
  }

  private openRubyModal() {
    const view = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) return;
    const editor = view.editor;
    const selection = editor.getSelection();
    if (!selection) {
      new Notice("请先选中需要注音的文字");
      return;
    }
    new RubyModal(this.plugin.app, selection, (pinyin) => {
      editor.replaceSelection(buildRubyHtml(selection, pinyin));
    }).open();
  }

  private toggleVertical() {
    const view = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view || !view.file) return;
    const cache = this.plugin.app.metadataCache.getFileCache(view.file);
    const currentType = cache?.frontmatter?.heti;
    const newType = currentType === "vertical" ? "poetry" : "vertical";
    const content = view.editor.getValue();
    view.editor.setValue(content.replace(/^heti:.*$/m, `heti: ${newType}`));
  }
}

export function createHetiToolbar(plugin: Plugin) {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      constructor(view: EditorView) { this.decorations = this.buildDecorations(view); }
      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = this.buildDecorations(update.view);
        }
      }
      buildDecorations(view: EditorView): DecorationSet {
        const widget = new HetiToolbarWidget(plugin);
        const deco = Decoration.widget({ widget, side: -1 });
        return Decoration.set([[deco, 0, 0]]);
      }
    },
    { decorations: (v) => v.decorations }
  );
}
```

### Step 3: 修改 src/main.ts — 注册工具栏和命令
```typescript
import { Plugin, MarkdownView } from "obsidian";
import { createHetiToolbar } from "./toolbar";
import { TYPE_MAP } from "./main"; // Note: TYPE_MAP should be defined in main.ts

export default class HetiPlugin extends Plugin {
  async onload() {
    console.log("Heti 插件已加载");

    // 阅读模式 PostProcessor
    this.registerMarkdownPostProcessor((el, ctx) => {
      const cache = this.app.metadataCache.getFileCache(
        this.app.vault.getAbstractFileByPath(ctx.sourcePath) as any
      );
      const hetiType = cache?.frontmatter?.heti;
      if (!hetiType) return;
      el.addClass("heti");
      if (TYPE_MAP[hetiType]) el.addClass(TYPE_MAP[hetiType]);
    });

    // 编辑器工具栏
    this.registerEditorExtension(createHetiToolbar(this));

    // 命令：新建诗词
    this.addCommand({
      id: "new-poem",
      name: "新建诗词",
      callback: () => this.createNewPoem(),
    });
  }

  async createNewPoem() {
    const leaf = this.app.workspace.getLeaf();
    const file = await this.app.vault.create(
      "诗词/新建诗词.md",
      "---\nheti: poetry\n朝代: \n作者: \n---\n\n<div class=\"heti heti--poetry\">\n  <h2>标题<span class=\"heti-meta heti-small\">[朝代]<abbr title=\"\">作者</abbr></span></h2>\n  <p class=\"heti-x-large\">\n    \n  </p>\n</div>"
    );
    await leaf.openFile(file);
  }

  onunload() { console.log("Heti 插件已卸载"); }
}
```

**Note:** The main.ts should also export TYPE_MAP as a module-level constant (from Task 2's fix).

### Step 4: 验证构建
```bash
npm run build
```

### Step 5: Commit
```bash
git add -A
git commit -m "feat: add editor toolbar with template, line break, vertical toggle"
```

## Verification
- `src/toolbar.ts` 文件存在
- `src/ruby-modal.ts` stub 文件存在（Task 5 会替换为完整实现）
- `npm run build` 成功
- main.ts 中注册了工具栏和命令
