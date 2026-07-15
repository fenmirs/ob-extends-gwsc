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
