# Task 5: 单字卡片组件 — 完成报告

## 实现内容

创建了 `src/char-card.ts`，实现 `CharCard` 类，完全按照 task brief 指定的代码。

### 功能：
- 显示单个汉字 (`heti-char`) 和拼音 (`heti-char-pinyin`)
- 点击卡片切换拼音键盘（`PinyinKeyboard`）的显示/隐藏
- 通过回调通知外部拼音更新 (`onUpdate`) 和删除 (`onDelete`)
- Hover 状态样式支持（`hovered` class）
- 活跃状态样式支持（`active` class）
- 删除按钮带 `stopPropagation` 防止误触
- 键盘打开时自动回填已有拼音（`setPinyin`）

## 测试结果

`npx tsc --noEmit` 运行结果：
- 4 个预存错误（全部在 `obsidian.d.ts` 和 `toolbar.ts` 中，与本次改动无关）
- **新增文件零错误**

## 变更文件

| 操作 | 文件 |
|------|------|
| 新建 | `src/char-card.ts` |

## Self-Review

- **完整性**：完全按照 task brief 实现，无遗漏
- **代码质量**：命名清晰，结构简洁，单一职责
- **YAGNI**：未添加任何额外功能
- **提交**：`2d63452` feat: add character card component
