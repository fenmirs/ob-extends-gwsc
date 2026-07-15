import { StateField, StateEffect } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

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
  provide: (f) =>
    EditorView.editorAttributes.compute([f], (state) => {
      const mode = state.field(f);
      return { class: mode === "form" ? "heti-form-mode" : "" };
    }),
});
