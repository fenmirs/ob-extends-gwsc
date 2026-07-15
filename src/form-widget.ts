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

  private rebuildForm() {
    if (this.formContainer) {
      const view = this.getEditorView();
      if (view) {
        this.renderForm(this.formContainer, view);
      }
    }
  }

  private getEditorView(): EditorView | null {
    const view = this.getActiveView();
    if (!view) return null;
    const cm = (view.editor as any).cm || (view.editor as any).editor;
    return cm ?? null;
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
      private changedRef: import("obsidian").EventRef | null = null;

      constructor(view: EditorView) {
        this.decorations = this.buildDecorations(view);
        this.syncFormModeClass(view);
        const recheck = () => {
          this.decorations = this.buildDecorations(view);
          this.syncFormModeClass(view);
          view.dispatch({});
        };
        this.cacheRef = plugin.app.metadataCache.on("resolved", recheck);
        this.changedRef = plugin.app.metadataCache.on("changed", recheck);
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
        this.syncFormModeClass(update.view);
      }

      destroy() {
        if (this.cacheRef) {
          plugin.app.metadataCache.offref(this.cacheRef);
          this.cacheRef = null;
        }
        if (this.changedRef) {
          plugin.app.metadataCache.offref(this.changedRef);
          this.changedRef = null;
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

      private syncFormModeClass(view: EditorView) {
        const isForm = this.decorations !== emptyDeco;
        const editorEl = (view as any).dom?.closest?.(".cm-editor");
        if (editorEl) {
          editorEl.classList.toggle("heti-form-mode", isForm);
        }
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
