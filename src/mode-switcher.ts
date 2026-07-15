import { EditorView, ViewPlugin, ViewUpdate, Decoration, DecorationSet, WidgetType } from "@codemirror/view";
import { Plugin, MarkdownView, TFile } from "obsidian";
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
      private container: HTMLElement | null = null;

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
          this.updateButtonStates(update.view);
        }
      }

      destroy() {
        if (this.cacheRef) {
          plugin.app.metadataCache.offref(this.cacheRef);
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

      private updateButtonStates(view: EditorView) {
        const mode = view.state.field(viewModeField);
        const switcher = document.querySelector(".heti-mode-switcher");
        if (!switcher) return;
        const btns = switcher.querySelectorAll(".heti-mode-btn");
        const modes: ViewMode[] = ["form", "source"];
        btns.forEach((btn, i) => {
          btn.classList.toggle("active", modes[i] === mode);
        });
      }
    },
    { decorations: (v) => v.decorations }
  );
}

function getFileForView(plugin: Plugin, editorView: EditorView): TFile | null {
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
