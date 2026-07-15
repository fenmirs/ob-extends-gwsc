import { App, Modal } from "obsidian";

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
    contentEl.createEl("h3", { text: "注音（Task 5 实现）" });
    const input = contentEl.createEl("input", { type: "text" });
    const btn = contentEl.createEl("button", { text: "确认" });
    btn.addEventListener("click", () => {
      this.onSubmit(input.value);
      this.close();
    });
  }

  onClose() { this.contentEl.empty(); }
}

export function buildRubyHtml(characters: string, pinyin: string): string {
  return `<ruby>${characters}<rt>${pinyin}</rt></ruby>`;
}
