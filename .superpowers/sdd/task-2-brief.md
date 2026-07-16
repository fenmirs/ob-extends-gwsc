### Task 2: 扩展数据结构和 HTML 生成

**Files:**
- Modify: `src/poem-data.ts:1-145`

**Interfaces:**
- Consumes: 无
- Produces: `PoemFormData.font`, `PoemFormData.fontSize`, 更新后的 `generatePoemHtml()`, `parseExistingPoem()`

- [ ] **Step 1: 更新 PoemFormData 接口**

```typescript
// src/poem-data.ts 顶部
export interface PoemFormData {
  title: string;
  hetiType: "poetry" | "ancient" | "vertical";
  dynasty: string;
  author: string;
  font: string;      // 字体名称，空字符串表示使用 Obsidian 默认
  fontSize: number;  // 正文字号（px），0 表示使用默认
  lines: PoemLine[];
}
```

- [ ] **Step 2: 更新 createEmptyForm()**

```typescript
export function createEmptyForm(): PoemFormData {
  return {
    title: "",
    hetiType: "poetry",
    dynasty: "",
    author: "",
    font: "",
    fontSize: 0,
    lines: [{ chars: [] }],
  };
}
```

- [ ] **Step 3: 更新 generatePoemHtml() 的 frontmatter 部分**

```typescript
export function generatePoemHtml(data: PoemFormData): string {
  // ... 现有 lines 处理逻辑不变 ...

  let frontmatter = `---\nheti: ${data.hetiType}\n`;
  if (data.dynasty) frontmatter += `朝代: "${escapeYamlValue(data.dynasty)}"\n`;
  if (data.author) frontmatter += `作者: "${escapeYamlValue(data.author)}"\n`;
  if (data.font) frontmatter += `字体: "${escapeYamlValue(data.font)}"\n`;
  if (data.fontSize > 0) frontmatter += `字号: ${data.fontSize}\n`;
  frontmatter += "---\n\n";

  // ... 现有 titleSpan 处理逻辑不变 ...

  // 构建 style 属性
  const styleParts: string[] = [];
  if (data.font) styleParts.push(`--heti-font: ${data.font}`);
  if (data.fontSize > 0) styleParts.push(`--heti-font-size: ${data.fontSize}px`);
  const styleAttr = styleParts.length > 0 ? ` style="${styleParts.join("; ")}"` : "";

  return `${frontmatter}<div class="${containerClass}"${styleAttr}>
  <h2>${escapeHtml(data.title)}${titleSpan}</h2>
  <p class="heti-x-large">
${lines}
  </p>
</div>`;
}
```

- [ ] **Step 4: 更新 parseExistingPoem()**

```typescript
export function parseExistingPoem(
  content: string,
  frontmatter: Record<string, any>
): PoemFormData {
  const fmType = frontmatter?.heti || "poetry";
  const dynasty = frontmatter?.朝代 || "";
  const author = frontmatter?.作者 || "";
  const font = frontmatter?.字体 || "";
  const fontSize = typeof frontmatter?.字号 === "number" ? frontmatter.字号 : 0;

  // ... 现有 titleMatch 和 bodyMatch 逻辑不变 ...
  // ... 现有 lines 解析逻辑不变 ...

  return {
    title,
    hetiType: fmType as PoemFormData["hetiType"],
    dynasty,
    author,
    font,
    fontSize,
    lines: lines.length > 0 ? lines : [{ chars: [] }],
  };
}
```

- [ ] **Step 5: 验证 TypeScript 编译**

Run: `npx tsc --noEmit`
Expected: 无新增错误

- [ ] **Step 6: 构建**

Run: `npm run build`
Expected: 构建成功

- [ ] **Step 7: 提交**

```bash
git add src/poem-data.ts
git commit -m "feat: extend PoemFormData with font and fontSize fields"
```
