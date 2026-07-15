import { App, Modal } from "obsidian";

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export class RubyModal extends Modal {
  private selectedText: string;
  private onSubmit: (pinyin: string) => void;

  constructor(app: App, selectedText: string, onSubmit: (pinyin: string) => void) {
    super(app);
    this.selectedText = selectedText;
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.addClass("heti-ruby-modal");
    contentEl.createEl("h3", { text: "注音" });

    contentEl.createEl("div", { cls: "heti-ruby-preview", text: this.selectedText });

    const inputContainer = contentEl.createEl("div", { cls: "heti-ruby-input-container" });
    inputContainer.createEl("label", { text: "拼音（统一: zhū yú 或 逐字: 茱:zhū,萸:yú）：" });
    inputContainer.createEl("input", {
      type: "text", cls: "heti-ruby-input",
      placeholder: "例: zhū yú 或 茱:zhū,萸:yú",
    });

    const buttonContainer = contentEl.createEl("div", { cls: "heti-ruby-buttons" });

    const cancelBtn = buttonContainer.createEl("button", { text: "取消" });
    cancelBtn.addEventListener("click", () => this.close());

    const confirmBtn = buttonContainer.createEl("button", { text: "确认", cls: "mod-cta" });
    const input = contentEl.querySelector(".heti-ruby-input") as HTMLInputElement;
    confirmBtn.addEventListener("click", () => {
      const pinyin = input.value.trim();
      if (pinyin) { this.onSubmit(pinyin); this.close(); }
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") confirmBtn.click();
    });
    input.focus();
  }

  onClose() { this.contentEl.empty(); }
}

export function buildRubyHtml(characters: string, pinyin: string): string {
  const chars = characters.split("");
  if (pinyin.includes(":")) {
    const pinyinMap = new Map<string, string>();
    pinyin.split(",").forEach((pair) => {
      const [char, pin] = pair.split(":");
      if (char && pin) pinyinMap.set(char.trim(), pin.trim());
    });
    return `<ruby>${chars.map((c) => {
      const pin = pinyinMap.get(c) || "";
      return pin ? `${c}<rt>${escapeHtml(pin)}</rt>` : c;
    }).join("")}</ruby>`;
  } else {
    return `<ruby>${chars.map((c) => `${c}<rt>${escapeHtml(pinyin)}</rt>`).join("")}</ruby>`;
  }
}
