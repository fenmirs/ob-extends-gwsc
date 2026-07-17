import { PoemFormData, generatePoemHtml } from "./poem-data";
import { Notice } from "obsidian";

const POEM_CSS = `
.heti { max-width: 100%; padding: 16px; font-family: var(--heti-font, inherit); }
.heti h2 { font-size: calc(var(--heti-font-size, 24px) * 1.5); margin: 0 0 0.25em; }
.poetry-title, .ancient-title { text-align: center; padding-bottom: 0.5em; }
.heti .heti-x-large { font-size: var(--heti-font-size, 20px); line-height: 1.8; }
.heti--ancient .heti-x-large { line-height: 2.5; }
.heti--vertical .heti-x-large { line-height: 1.8; }
.heti .heti-meta { font-size: calc(var(--heti-font-size, 24px) * 0.75); margin-left: 0.5em; color: #888; }
.heti--ancient .heti-meta { display: block; text-align: center; margin-left: 0; margin-top: 0.25em; }
.heti--vertical { writing-mode: vertical-rl; text-orientation: upright; max-height: 80vh; overflow-x: auto; }
.heti-vertical-header { text-align: center; }
.heti-vertical-title { font-size: calc(var(--heti-font-size, 24px) * 1.5); font-weight: bold; }
.heti-vertical-meta { flex-direction: row; display: inline-flex; gap: 0.5em; font-size: calc(var(--heti-font-size, 24px) * 0.75); color: #888; }
.heti-vertical-dynasty { writing-mode: sideways-rl; }
.heti--vertical .heti-line { display: block; text-indent: 2.5em; margin-left: 1em; }
.heti--ancient .heti-line { display: block; text-indent: 2.5em; margin-bottom: 1em; }
.heti--poetry .heti-line { display: block; margin-bottom: 0.5em; }
.heti ruby { ruby-align: center; }
.heti rt { font-size: 0.6em; padding-bottom: 4px; }
.heti { --heti-char-gap: 0.15em; }
.heti-char { margin-right: var(--heti-char-gap); }
`;

function getInlineVars(data: PoemFormData): string {
  const parts: string[] = [];
  if (data.font) parts.push(`--heti-font: ${data.font}`);
  if (data.fontSize > 0) parts.push(`--heti-font-size: ${data.fontSize}px`);
  if (data.charGap > 0) parts.push(`--heti-char-gap: ${data.charGap}em`);
  return parts.join("; ");
}

function buildFullHtml(data: PoemFormData, bodyHtml: string): string {
  const vars = getInlineVars(data);
  const styleAttr = vars ? ` style="${vars}"` : "";
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>${data.title || "诗词"}</title>
<style>
body { margin: 0; padding: 40px; display: flex; justify-content: center; font-family: "PingFang SC", "Microsoft YaHei", "SimSun", serif; background: #fff; }
${POEM_CSS}
</style>
</head>
<body>
<div${styleAttr}>${bodyHtml}</div>
</body>
</html>`;
}

export async function exportAsHtml(data: PoemFormData) {
  const html = generatePoemHtml(data);
  const fullHtml = buildFullHtml(data, html);

  const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${data.title || "诗词"}.html`;
  a.click();
  URL.revokeObjectURL(url);
  new Notice("已导出 HTML 文件");
}
