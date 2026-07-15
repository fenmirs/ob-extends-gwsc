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
