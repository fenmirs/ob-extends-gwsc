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
    if (!content.match(/^---\s*\n/)) {
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
    const trailingPunctMatch = line.match(/([，。！？；]+)$/);
    const trailingPunct = trailingPunctMatch ? trailingPunctMatch[1] : "";
    const strippedLine = line.replace(/[，。！？；]+$/, "");
    const hangPunct = trailingPunct ? `<span class="heti-hang">${trailingPunct}</span>` : "";
    const newLine = strippedLine + hangPunct + "<br>\n";
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
    if (/^heti:.*$/m.test(content)) {
      view.editor.setValue(content.replace(/^heti:.*$/m, `heti: ${newType}`));
    } else {
      new Notice("文档中未找到 heti 字段，请手动添加 frontmatter");
    }
  }
}

export function createHetiToolbar(plugin: Plugin) {
  const cachedWidget = new HetiToolbarWidget(plugin);
  const cachedDeco = Decoration.widget({ widget: cachedWidget, side: -1 });
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      constructor(view: EditorView) { this.decorations = this.buildDecorations(); }
      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = this.buildDecorations();
        }
      }
      buildDecorations(): DecorationSet {
        return Decoration.set([[cachedDeco, 0, 0]]);
      }
    },
    { decorations: (v) => v.decorations }
  );
}
