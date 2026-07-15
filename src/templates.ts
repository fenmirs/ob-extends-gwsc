export interface PoemTemplateOptions {
  title?: string;
  dynasty?: string;
  author?: string;
  lines?: number;
  hetiType?: "poetry" | "ancient" | "annotation" | "vertical";
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function generateLines(count: number): string {
  const lines: string[] = [];
  for (let i = 0; i < count; i++) {
    const punct = i % 2 === 0 ? "，" : "。";
    lines.push(`    第${i + 1}句<span class="heti-hang">${punct}</span>`);
  }
  return lines.join("<br>\n");
}

export function generatePoemTemplate(options: PoemTemplateOptions = {}): string {
  const {
    title = "标题",
    dynasty = "朝代",
    author = "作者",
    lines = 4,
    hetiType = "poetry",
  } = options;

  const containerClass = hetiType === "vertical"
    ? "heti heti--vertical"
    : `heti heti--${hetiType}`;

  return `<div class="${containerClass}">
  <h2>${escapeHtml(title)}<span class="heti-meta heti-small">[${escapeHtml(dynasty)}]<abbr title="">${escapeHtml(author)}</abbr></span></h2>
  <p class="heti-x-large">
${generateLines(lines)}
  </p>
</div>`;
}

export function generateFrontmatter(dynasty?: string, author?: string): string {
  let fm = "---\nheti: poetry\n";
  if (dynasty) fm += `朝代: ${dynasty}\n`;
  if (author) fm += `作者: ${author}\n`;
  fm += "---\n\n";
  return fm;
}
