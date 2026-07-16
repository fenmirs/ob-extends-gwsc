### Task 3: 更新表单 UI

**Files:**
- Modify: `src/form-widget.ts:101-179`

**Interfaces:**
- Consumes: `getDefaultFont()`, `getAvailableChineseFonts()` from `src/font-detector.ts`
- Produces: 字体/字号下拉框 UI

- [ ] **Step 1: 在 form-widget.ts 顶部添加导入**

```typescript
import { getDefaultFont, getAvailableChineseFonts } from "./font-detector";
```

- [ ] **Step 2: 在 renderForm() 中添加字体下拉框**

在 `typeSelect.addEventListener("change", ...)` 之后添加：

```typescript
    const fontRow = container.createEl("div", { cls: "heti-form-row" });
    fontRow.createEl("label", { cls: "heti-form-label", text: "字体" });
    const fontSelect = fontRow.createEl("select", {
      cls: "heti-form-select",
    });
    
    // 默认字体选项
    const defaultOpt = fontSelect.createEl("option", { value: "", text: "默认" });
    if (!this.formData.font) defaultOpt.selected = true;
    
    // 动态检测的字体选项
    const availableFonts = getAvailableChineseFonts();
    availableFonts.forEach((fontName) => {
      const opt = fontSelect.createEl("option", { value: fontName, text: fontName });
      if (fontName === this.formData.font) opt.selected = true;
    });
    
    fontSelect.addEventListener("change", () => {
      this.formData.font = fontSelect.value;
      this.syncToEditor();
    });
```

- [ ] **Step 3: 在 renderForm() 中添加字号下拉框**

在字体下拉框之后添加：

```typescript
    const fontSizeRow = container.createEl("div", { cls: "heti-form-row" });
    fontSizeRow.createEl("label", { cls: "heti-form-label", text: "字号" });
    const fontSizeSelect = fontSizeRow.createEl("select", {
      cls: "heti-form-select",
    });
    
    // 字号选项
    const fontSizes = [
      { value: 0, label: "默认" },
      { value: 16, label: "16px" },
      { value: 18, label: "18px" },
      { value: 20, label: "20px" },
      { value: 24, label: "24px" },
      { value: 28, label: "28px" },
      { value: 32, label: "32px" },
      { value: 36, label: "36px" },
    ];
    
    fontSizes.forEach(({ value, label }) => {
      const opt = fontSizeSelect.createEl("option", { value: String(value), text: label });
      if (value === this.formData.fontSize) opt.selected = true;
    });
    
    fontSizeSelect.addEventListener("change", () => {
      this.formData.fontSize = Number(fontSizeSelect.value);
      this.syncToEditor();
    });
```

- [ ] **Step 4: 验证 TypeScript 编译**

Run: `npx tsc --noEmit`
Expected: 无新增错误

- [ ] **Step 5: 构建**

Run: `npm run build`
Expected: 构建成功

- [ ] **Step 6: 提交**

```bash
git add src/form-widget.ts
git commit -m "feat: add font and font size selectors to form UI"
```
