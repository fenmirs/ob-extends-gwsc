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
  font: string;
  fontSize: number;
  charGap: number;
  lines: PoemLine[];
}

export function createEmptyForm(): PoemFormData {
  return {
    title: "",
    hetiType: "poetry",
    dynasty: "",
    author: "",
    font: "",
    fontSize: 0,
    charGap: 0,
    lines: [{ chars: [] }],
  };
}

export function toJSON(data: PoemFormData): string {
  return JSON.stringify(data, null, 2);
}

export function fromJSON(json: string): PoemFormData {
  try {
    const parsed = JSON.parse(json);
    return {
      title: parsed.title || "",
      hetiType: parsed.hetiType || "poetry",
      dynasty: parsed.dynasty || "",
      author: parsed.author || "",
      font: parsed.font || "",
      fontSize: parsed.fontSize || 0,
      charGap: parsed.charGap || 0,
      lines:
        Array.isArray(parsed.lines) && parsed.lines.length > 0
          ? parsed.lines.map((l: any) => ({
              chars: Array.isArray(l.chars)
                ? l.chars.map((c: any) => ({
                    char: c.char || "",
                    pinyin: c.pinyin || undefined,
                  }))
                : [],
            }))
          : [{ chars: [] }],
    };
  } catch {
    return createEmptyForm();
  }
}

export function textToChars(text: string): CharData[] {
  return text.split("").map((char) => ({ char }));
}

export function charsToText(chars: CharData[]): string {
  return chars.map((c) => c.char).join("");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildRubyHtml(chars: CharData[]): string {
  return chars
    .map((c) => {
      if (c.pinyin) {
        return `<span class="heti-char"><ruby>${escapeHtml(c.char)}<rt>${escapeHtml(c.pinyin)}</rt></ruby></span>`;
      }
      return `<span class="heti-char">${escapeHtml(c.char)}</span>`;
    })
    .join("");
}

export function generatePoemHtml(data: PoemFormData): string {
  const lines = data.lines
    .filter((line) => line.chars.length > 0)
    .map((line) => buildRubyHtml(line.chars))
    .join("<br>\n");

  const containerClass =
    data.hetiType === "vertical"
      ? "heti heti--vertical"
      : `heti heti--${data.hetiType}`;

  let titleHtml = "";
  if (data.title) {
    if (data.hetiType === "ancient") {
      const metaParts: string[] = [];
      if (data.dynasty) metaParts.push(`（${escapeHtml(data.dynasty)}）`);
      if (data.author) metaParts.push(escapeHtml(data.author));
      const meta =
        metaParts.length > 0
          ? `\n  <div class="heti-meta">${metaParts.join(" ")}</div>`
          : "";
      titleHtml = `<h2 class="ancient-title">${escapeHtml(data.title)}</h2>${meta}`;
    } else if (data.hetiType === "vertical") {
      const metaParts: string[] = [];
      if (data.dynasty)
        metaParts.push(
          `<span class="heti-dynasty-bracket">（${escapeHtml(data.dynasty)}）</span>`
        );
      if (data.author) metaParts.push(escapeHtml(data.author));
      const meta =
        metaParts.length > 0
          ? `<span class="heti-meta">${metaParts.join(" ")}</span>`
          : "";
      titleHtml = `<h2>${escapeHtml(data.title)}${meta}</h2>`;
    } else {
      const metaParts: string[] = [];
      if (data.dynasty) metaParts.push(`[${escapeHtml(data.dynasty)}]`);
      if (data.author) metaParts.push(escapeHtml(data.author));
      const meta =
        metaParts.length > 0
          ? `<span class="heti-meta">${metaParts.join(" ")}</span>`
          : "";
      titleHtml = `<h2 class="poetry-title">${escapeHtml(data.title)}${meta}</h2>`;
    }
  }

  const styleParts: string[] = [];
  if (data.font) styleParts.push(`--heti-font: ${data.font}`);
  if (data.fontSize > 0)
    styleParts.push(`--heti-font-size: ${data.fontSize}px`);
  if (data.charGap > 0)
    styleParts.push(`--heti-char-gap: ${data.charGap}em`);
  const styleAttr =
    styleParts.length > 0 ? ` style="${styleParts.join("; ")}"` : "";

  return `<div class="${containerClass}"${styleAttr}>
  ${titleHtml}
  <p class="heti-x-large">
${lines}
  </p>
</div>`;
}
