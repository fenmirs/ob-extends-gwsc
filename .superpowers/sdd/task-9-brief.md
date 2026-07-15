### Task 9: 清理和最终构建

**Files:**
- Delete: `src/toolbar.ts`

- [ ] **Step 1: 删除旧文件**

Run: `Remove-Item src/toolbar.ts`

- [ ] **Step 2: 确认无引用**

Run: `rg -n "toolbar" src/`

- [ ] **Step 3: TypeScript 检查**

Run: `npx tsc --noEmit`
Expected: 无新错误（可有预存错误）

- [ ] **Step 4: 完整构建**

Run: `npm run build`
Expected: 构建成功

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "chore: cleanup old toolbar and verify build"
```

- [ ] **Step 6: 请用户在 Obsidian 中测试**

告知用户完成测试步骤：
1. 启用插件
2. 编辑诗词文件
3. 点击顶部按钮切换模式
4. 表单模式下填写信息、点击字添加拼音
5. 源码模式下编辑 HTML
