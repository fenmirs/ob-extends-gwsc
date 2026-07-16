### Task 5: 清理调试日志

**Files:**
- Modify: `src/form-widget.ts:290-317`
- Modify: `src/mode-switcher.ts:75-81`

**Interfaces:**
- 无新增接口

- [ ] **Step 1: 移除 form-widget.ts 中的 console.log**

删除 `buildDecorations()` 和 `syncFormModeClass()` 中的所有 `console.log` 语句。

- [ ] **Step 2: 移除 mode-switcher.ts 中的 console.log**

删除 `buildDecorations()` 中的所有 `console.log` 语句。

- [ ] **Step 3: 构建**

Run: `npm run build`
Expected: 构建成功

- [ ] **Step 4: 提交**

```bash
git add src/form-widget.ts src/mode-switcher.ts
git commit -m "chore: remove debug logging"
```
