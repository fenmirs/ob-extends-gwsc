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
