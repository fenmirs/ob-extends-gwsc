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
      let match: RegExpExecArray | null;
      while ((match = rubyRegex.exec(clean)) !== null) {
        if (match[1] && match[2]) {
          const text = match[1].replace(/<[^>]+>/g, "");
          const pinyin = match[2];
          text.split("").forEach((ch) =>
            chars.push({ char: ch, pinyin })
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
