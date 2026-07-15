import { EditorView, ViewPlugin, ViewUpdate, Decoration, DecorationSet, WidgetType } from "@codemirror/view";
import { Plugin, MarkdownView, Notice, TFile } from "obsidian";
import { createEmptyForm, generatePoemHtml } from "./poem-data";
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
    const fullOutput = generatePoemHtml(createEmptyForm());
    const content = editor.getValue();
    if (!content.match(/^---\s*\n/)) {
      editor.replaceRange(fullOutput, { line: 0, ch: 0 }, { line: 0, ch: 0 });
    } else {
      const htmlPart = fullOutput.replace(/^---\n[\s\S]*?---\n\n/, "");
      editor.replaceRange("\n\n" + htmlPart, editor.getCursor());
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
    const match = content.match(/^heti:.*$/m);
    if (match && match.index !== undefined) {
      const startPos = view.editor.posToOffset({ line: 0, ch: 0 });
      const matchLine = content.substring(0, match.index).split("\n").length - 1;
      const matchCh = match[0].length;
      view.editor.replaceRange(`heti: ${newType}`, { line: matchLine, ch: 0 }, { line: matchLine, ch: matchCh });
    } else {
      new Notice("文档中未找到 heti 字段，请手动添加 frontmatter");
    }
  }
}

function findFileForView(plugin: Plugin, editorView: EditorView): TFile | null {
  const leaves = plugin.app.workspace.getLeavesOfType("markdown");
  for (const leaf of leaves) {
    const view = leaf.view;
    if (view instanceof MarkdownView && view.editor) {
      const cm = (view.editor as any).cm || (view.editor as any).editor;
      if (cm === editorView) return view.file;
    }
  }
  const activeView = plugin.app.workspace.getActiveViewOfType(MarkdownView);
  return activeView?.file ?? null;
}

function isHetiFile(plugin: Plugin, editorView: EditorView): boolean {
  const file = findFileForView(plugin, editorView);
  if (!file) return false;
  const cache = plugin.app.metadataCache.getFileCache(file);
  return !!cache?.frontmatter?.heti;
}

export function createHetiToolbar(plugin: Plugin) {
  const emptyDeco = Decoration.set([]);
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      private widget = new HetiToolbarWidget(plugin);
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
        if (update.docChanged || update.viewportChanged) {
          this.decorations = this.buildDecorations(update.view);
        }
      }

      destroy() {
        if (this.cacheRef) { plugin.app.metadataCache.off(this.cacheRef); this.cacheRef = null; }
      }

      buildDecorations(view: EditorView): DecorationSet {
        if (!isHetiFile(plugin, view)) return emptyDeco;
        return Decoration.set([{ from: 0, to: 0, value: this.deco }]);
      }
    },
    { decorations: (v) => v.decorations }
  );
}
