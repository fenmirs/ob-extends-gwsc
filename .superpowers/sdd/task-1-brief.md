### Task 1: 数据结构和 HTML 生成

**Files:**
- Create: `src/poem-data.ts`
- Modify: `src/templates.ts:1-53`

**Interfaces:**
- Produces: `PoemLine`, `PoemFormData`, `generatePoemHtml()`, `parseExistingPoem()`

- [ ] **Step 1: 创建数据结构文件**

```typescript
// src/poem-data.ts
export interface CharData {
  char: string;
  pinyin?: string;
}

export interface PoemLine {
  chars: CharData[];
}

export interface PoemFormData {
  title: string;
  hetiType: "poetry" | "ancient" | "vertical";
  dynasty: string;
  author: string;
  lines: PoemLine[];
}

export function createEmptyForm(): PoemFormData {
  return {
    title: "",
    hetiType: "poetry",
    dynasty: "",
    author: "",
    lines: [{ chars: [] }],
  };
}

export function textToChars(text: string): CharData[] {
  return text.split("").map((char) => ({ char }));
}

export function charsToText(chars: CharData[]): string {
  return chars.map((c) => c.char).join("");
}

export function textToLine(text: string): PoemLine {
  return { chars: textToChars(text) };
}
```

- [ ] **Step 2: 添加 HTML 生成函数**

在 `src/poem-data.ts` 末尾追加：

```typescript
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeYamlValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function buildRubyHtml(chars: CharData[]): string {
  return chars
    .map((c) => {
      if (c.pinyin) {
        return `${escapeHtml(c.char)}<rt>${escapeHtml(c.pinyin)}</rt>`;
      }
      return escapeHtml(c.char);
    })
    .join("");
}

export function generatePoemHtml(data: PoemFormData): string {
  const lines = data.lines
    .filter((line) => line.chars.length > 0)
    .map((line, i, arr) => {
      const content = buildRubyHtml(line.chars);
      const punct = i % 2 === 0 ? "，" : "。";
      return `    ${content}<span class="heti-hang">${punct}</span>`;
    })
    .join("<br>\n");

  const containerClass =
    data.hetiType === "vertical"
      ? "heti heti--vertical"
      : `heti heti--${data.hetiType}`;

  let frontmatter = `---\nheti: ${data.hetiType}\n`;
  if (data.dynasty) frontmatter += `朝代: "${escapeYamlValue(data.dynasty)}"\n`;
  if (data.author) frontmatter += `作者: "${escapeYamlValue(data.author)}"\n`;
  frontmatter += "---\n\n";

  const titleSpan = data.dynasty || data.author
    ? `<span class="heti-meta heti-small">[${escapeHtml(data.dynasty)}]<abbr title="${escapeHtml(data.author)}">${escapeHtml(data.author)}</abbr></span>`
    : "";

  return `${frontmatter}<div class="${containerClass}">
  <h2>${escapeHtml(data.title)}${titleSpan}</h2>
  <p class="heti-x-large">
${lines}
  </p>
</div>`;
}
```

- [ ] **Step 3: 添加 HTML 解析函数**

在 `src/poem-data.ts` 末尾追加：

```typescript
export function parseExistingPoem(
  content: string,
  frontmatter: Record<string, any>
): PoemFormData {
  const fmType = frontmatter?.heti || "poetry";
  const dynasty = frontmatter?.朝代 || "";
  const author = frontmatter?.作者 || "";

  const titleMatch = content.match(/<h2>(.*?)<span/);
  const title = titleMatch
    ? titleMatch[1].replace(/<[^>]+>/g, "")
    : "";

  const bodyMatch = content.match(
    /<p class="heti-x-large">([\s\S]*?)<\/p>/
  );
  const body = bodyMatch ? bodyMatch[1] : "";
  const rawLines = body.split(/<br\s*\/?>/);

  const lines: PoemLine[] = rawLines
    .map((raw) => {
      const clean = raw
        .replace(/<span class="heti-hang">[^<]*<\/span>/g, "")
        .trim();
      if (!clean) return null;
      const chars: CharData[] = [];
      const rubyRegex = /<ruby>(.*?)<rt>(.*?)<\/rt><\/ruby>|./g;
      let match;
      while ((match = rubyRegex.exec(clean)) !== null) {
        if (match[1] && match[2]) {
          const text = match[1].replace(/<[^>]+>/g, "");
          text.split("").forEach((ch) =>
            chars.push({ char: ch, pinyin: match[2] })
          );
        } else if (match[0]) {
          chars.push({ char: match[0] });
        }
      }
      return chars.length > 0 ? { chars } : null;
    })
    .filter((l): l is PoemLine => l !== null);

  return {
    title,
    hetiType: fmType as PoemFormData["hetiType"],
    dynasty,
    author,
    lines: lines.length > 0 ? lines : [{ chars: [] }],
  };
}
```

- [ ] **Step 4: 更新 templates.ts**

删除 `src/templates.ts` 中的 `generatePoemTemplate` 和 `generateFrontmatter` 函数，保留文件但改为空导出（或直接删除文件，在后续任务中移除引用）。

- [ ] **Step 5: 运行类型检查**

Run: `npx tsc --noEmit`
Expected: 无错误（或仅已知的 obsidian 类型警告）

- [ ] **Step 6: 提交**

```bash
git add src/poem-data.ts src/templates.ts
git commit -m "feat: add poem data structures and HTML generation"
```
