import { ItemView, TFile, WorkspaceLeaf } from "obsidian";
import {
  PoemFormData,
  PoemLine,
  createEmptyForm,
  fromJSON,
  toJSON,
  textToChars,
  charsToText,
  generatePoemHtml,
} from "./poem-data";
import { CharCard } from "./char-card";
import { PinyinKeyboard } from "./pinyin-keyboard";
import { getAvailableChineseFonts } from "./font-detector";
import { exportAsHtml } from "./export";

export const SC_VIEW_TYPE = "heti-sc-view";

export class ScView extends ItemView {
  private formData: PoemFormData = createEmptyForm();
  private charCards: CharCard[][] = [[]];
  private keyboardContainer: HTMLElement | null = null;
  private sharedKeyboard: PinyinKeyboard | null = null;
  private activeCard: CharCard | null = null;
  private formEl: HTMLElement | null = null;
  private previewEl: HTMLElement | null = null;
  private exportBar: HTMLElement | null = null;
  private mode: "edit" | "preview" = "edit";
  private file: TFile | null = null;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType(): string {
    return SC_VIEW_TYPE;
  }

  getDisplayText(): string {
    return this.file?.basename || "古文诗词";
  }

  getIcon(): string {
    return "scroll-text";
  }

  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass("sc-view-container");

    const toolbar = container.createEl("div", { cls: "sc-toolbar" });

    const editBtn = toolbar.createEl("button", {
      cls: "sc-toolbar-btn active",
      text: "编辑",
    });
    const previewBtn = toolbar.createEl("button", {
      cls: "sc-toolbar-btn",
      text: "预览",
    });

    editBtn.addEventListener("click", () => {
      this.mode = "edit";
      editBtn.addClass("active");
      previewBtn.removeClass("active");
      this.showEdit();
    });
    previewBtn.addEventListener("click", () => {
      this.mode = "preview";
      previewBtn.addClass("active");
      editBtn.removeClass("active");
      this.showPreview();
    });

    this.formEl = container.createEl("div", { cls: "sc-form-wrapper" });

    this.exportBar = container.createEl("div", { cls: "sc-export-bar" });
    this.exportBar.style.display = "none";
    this.exportBar.createEl("button", {
      cls: "sc-toolbar-btn",
      text: "导出 HTML",
    }).addEventListener("click", () => exportAsHtml(this.formData));

    this.previewEl = container.createEl("div", {
      cls: "sc-preview-wrapper",
    });
    this.previewEl.style.display = "none";

    this.keyboardContainer = container.createEl("div", {
      cls: "sc-keyboard-container",
    });
    this.keyboardContainer.style.display = "none";
  }

  async onClose() {
    this.closeKeyboard();
  }

  async setState(state: any, result: any) {
    await super.setState(state, result);
    if (state?.file) {
      const abstract = this.app.vault.getAbstractFileByPath(state.file);
      if (abstract instanceof TFile) {
        this.file = abstract;
        const content = await this.app.vault.read(abstract);
        this.formData = fromJSON(content);
        this.rebuildCharCards();
        this.renderForm();
      }
    }
  }

  async loadFile() {
    const state = this.leaf.getViewState();
    const stateFile = (state as any)?.state?.file;
    let file: TFile | null = null;

    if (stateFile) {
      const abstract = this.app.vault.getAbstractFileByPath(stateFile);
      if (abstract instanceof TFile) file = abstract;
    }
    if (!file) file = this.app.workspace.getActiveFile();
    if (!file) file = this.file;

    if (!file || file.extension !== "sc") return;
    this.file = file;

    const content = await this.app.vault.read(file);
    this.formData = fromJSON(content);
    this.rebuildCharCards();
    this.renderForm();
  }

  private showEdit() {
    if (this.formEl) this.formEl.style.display = "";
    if (this.exportBar) this.exportBar.style.display = "none";
    if (this.previewEl) this.previewEl.style.display = "none";
  }

  private showPreview() {
    if (this.formEl) this.formEl.style.display = "none";
    if (this.exportBar) this.exportBar.style.display = "";
    if (this.keyboardContainer) {
      this.keyboardContainer.style.display = "none";
      this.keyboardContainer.empty();
    }
    if (this.previewEl) {
      this.previewEl.style.display = "";
      this.previewEl.innerHTML = generatePoemHtml(this.formData);
    }
  }

  private rebuildCharCards() {
    this.charCards = this.formData.lines.map((line, lineIndex) => {
      return line.chars.map((charData, charIndex) => {
        const card = new CharCard(
          charData,
          (updated) => {
            this.formData.lines[lineIndex].chars[charIndex] = updated;
            this.syncToFile();
          },
          () => {
            const activeEl = document.activeElement as HTMLElement;
            const focusLine = activeEl?.closest?.(".sc-form-line") as HTMLElement;
            const focusIndex = focusLine
              ? Array.from(focusLine.parentElement!.children).indexOf(focusLine)
              : -1;
            this.formData.lines[lineIndex].chars.splice(charIndex, 1);
            this.rebuildCharCards();
            this.renderForm();
            this.syncToFile();
            if (focusIndex >= 0) {
              const lines = this.formEl!.querySelectorAll(".sc-form-line");
              const input = lines[focusIndex]?.querySelector("input");
              if (input)
                requestAnimationFrame(() => (input as HTMLInputElement).focus());
            }
          }
        );
        card.setOnCardClick(() =>
          this.openKeyboard(card, lineIndex, charIndex)
        );
        return card;
      });
    });
  }

  private openKeyboard(card: CharCard, lineIndex: number, charIndex: number) {
    if (this.activeCard === card) {
      this.closeKeyboard();
      return;
    }

    this.closeKeyboard();
    this.activeCard = card;
    card.setActive(true);

    this.sharedKeyboard = new PinyinKeyboard(
      (pinyin) => {
        card.updatePinyin(pinyin);
        this.formData.lines[lineIndex].chars[charIndex].pinyin = pinyin;
        this.syncToFile();
        this.closeKeyboard();
      },
      () => {
        card.clearPinyin();
        this.formData.lines[lineIndex].chars[charIndex].pinyin = undefined;
        this.syncToFile();
      },
      () => this.closeKeyboard()
    );

    if (card.getData().pinyin) {
      this.sharedKeyboard.setPinyin(card.getData().pinyin!);
    }

    this.keyboardContainer!.empty();
    this.keyboardContainer!.appendChild(this.sharedKeyboard.getElement());
    this.keyboardContainer!.style.display = "";
  }

  private closeKeyboard() {
    if (this.activeCard) {
      this.activeCard.setActive(false);
      this.activeCard = null;
    }
    if (this.keyboardContainer) {
      this.keyboardContainer.style.display = "none";
      this.keyboardContainer.empty();
    }
    this.sharedKeyboard = null;
  }

  private renderForm() {
    if (!this.formEl) return;
    this.formEl.empty();
    this.closeKeyboard();

    this.renderMetaFields();
    this.renderLines();
    this.renderAddButton();
  }

  private renderMetaFields() {
    const container = this.formEl!;

    const titleRow = container.createEl("div", { cls: "sc-form-row" });
    titleRow.createEl("label", { cls: "sc-form-label", text: "标题" });
    const titleInput = titleRow.createEl("input", {
      cls: "sc-form-input",
      type: "text",
      placeholder: "输入古文诗词标题",
    });
    titleInput.value = this.formData.title;
    titleInput.addEventListener("input", () => {
      this.formData.title = titleInput.value;
      this.syncToFile();
    });

    const typeRow = container.createEl("div", { cls: "sc-form-row" });
    typeRow.createEl("label", { cls: "sc-form-label", text: "类型" });
    const typeSelect = typeRow.createEl("select", { cls: "sc-form-select" });
    (
      [
        { value: "poetry", label: "诗词" },
        { value: "ancient", label: "古文" },
        { value: "vertical", label: "竖排" },
      ] as const
    ).forEach(({ value, label }) => {
      const opt = typeSelect.createEl("option", { value, text: label });
      if (value === this.formData.hetiType) opt.selected = true;
    });
    typeSelect.addEventListener("change", () => {
      this.formData.hetiType = typeSelect.value as PoemFormData["hetiType"];
      this.syncToFile();
    });

    const fontRow = container.createEl("div", { cls: "sc-form-row" });
    fontRow.createEl("label", { cls: "sc-form-label", text: "字体" });
    const fontSelect = fontRow.createEl("select", { cls: "sc-form-select" });
    const defaultOpt = fontSelect.createEl("option", {
      value: "",
      text: "默认",
    });
    if (!this.formData.font) defaultOpt.selected = true;
    getAvailableChineseFonts().forEach((fontName) => {
      const opt = fontSelect.createEl("option", {
        value: fontName,
        text: fontName,
      });
      if (fontName === this.formData.font) opt.selected = true;
    });
    fontSelect.addEventListener("change", () => {
      this.formData.font = fontSelect.value;
      this.syncToFile();
    });

    const sizeRow = container.createEl("div", { cls: "sc-form-row" });
    sizeRow.createEl("label", { cls: "sc-form-label", text: "字号" });
    const sizeSelect = sizeRow.createEl("select", { cls: "sc-form-select" });
    (
      [
        { value: 0, label: "默认" },
        { value: 16, label: "16px" },
        { value: 18, label: "18px" },
        { value: 20, label: "20px" },
        { value: 24, label: "24px" },
        { value: 28, label: "28px" },
        { value: 32, label: "32px" },
        { value: 36, label: "36px" },
      ] as const
    ).forEach(({ value, label }) => {
      const opt = sizeSelect.createEl("option", {
        value: String(value),
        text: label,
      });
      if (value === this.formData.fontSize) opt.selected = true;
    });
    sizeSelect.addEventListener("change", () => {
      this.formData.fontSize = Number(sizeSelect.value);
      this.syncToFile();
    });

    const gapRow = container.createEl("div", { cls: "sc-form-row" });
    gapRow.createEl("label", { cls: "sc-form-label", text: "字距" });
    const gapSelect = gapRow.createEl("select", { cls: "sc-form-select" });
    (
      [
        { value: 0, label: "默认" },
        { value: 0.1, label: "0.1em" },
        { value: 0.15, label: "0.15em" },
        { value: 0.2, label: "0.2em" },
        { value: 0.25, label: "0.25em" },
        { value: 0.3, label: "0.3em" },
        { value: 0.4, label: "0.4em" },
        { value: 0.5, label: "0.5em" },
      ] as const
    ).forEach(({ value, label }) => {
      const opt = gapSelect.createEl("option", {
        value: String(value),
        text: label,
      });
      if (value === this.formData.charGap) opt.selected = true;
    });
    gapSelect.addEventListener("change", () => {
      this.formData.charGap = Number(gapSelect.value);
      this.syncToFile();
    });

    const dynastyRow = container.createEl("div", { cls: "sc-form-row" });
    dynastyRow.createEl("label", {
      cls: "sc-form-label",
      text: "时期",
    });
    const dynastyInput = dynastyRow.createEl("input", {
      cls: "sc-form-input",
      type: "text",
      placeholder: "如：唐、宋、公元前369～公元前286年",
    });
    dynastyInput.value = this.formData.dynasty;
    dynastyInput.addEventListener("input", () => {
      this.formData.dynasty = dynastyInput.value;
      this.syncToFile();
    });

    const authorRow = container.createEl("div", { cls: "sc-form-row" });
    authorRow.createEl("label", {
      cls: "sc-form-label",
      text: "作者",
    });
    const authorInput = authorRow.createEl("input", {
      cls: "sc-form-input",
      type: "text",
      placeholder: "如：李白、诸葛亮",
    });
    authorInput.value = this.formData.author;
    authorInput.addEventListener("input", () => {
      this.formData.author = authorInput.value;
      this.syncToFile();
    });
  }

  private renderLines() {
    const linesContainer = this.formEl!.createEl("div", {
      cls: "sc-form-lines",
    });

    this.formData.lines.forEach((line, lineIndex) => {
      this.renderLine(linesContainer, line, lineIndex);
    });
  }

  private renderLine(
    container: HTMLElement,
    line: PoemLine,
    lineIndex: number
  ) {
    const lineEl = container.createEl("div", { cls: "sc-form-line" });

    const inputEl = lineEl.createEl("input", {
      cls: "sc-form-input",
      type: "text",
      placeholder: `第 ${lineIndex + 1} 句`,
    });
    inputEl.value = charsToText(line.chars);

    inputEl.addEventListener("input", () => {
      const newText = inputEl.value;
      const oldChars = this.formData.lines[lineIndex].chars;
      const newChars = textToChars(newText);
      this.formData.lines[lineIndex] = {
        chars: newChars.map((nc, i) => ({
          char: nc.char,
          pinyin:
            oldChars[i]?.char === nc.char ? oldChars[i].pinyin : undefined,
        })),
      };
      this.rebuildCharCards();
      this.renderForm();
      this.syncToFile();
    });

    const charContainer = lineEl.createEl("div", { cls: "sc-char-container" });
    const cards = this.charCards[lineIndex] || [];
    cards.forEach((card) => {
      charContainer.appendChild(card.getElement());
    });

    if (this.formData.lines.length > 1) {
      const deleteBtn = lineEl.createEl("button", {
        cls: "sc-form-line-delete",
        text: "\u00d7",
      });
      deleteBtn.addEventListener("click", () => {
        this.formData.lines.splice(lineIndex, 1);
        this.charCards.splice(lineIndex, 1);
        this.renderForm();
        this.syncToFile();
      });
    }
  }

  private renderAddButton() {
    const btn = this.formEl!.createEl("button", {
      cls: "sc-form-add-line",
      text: "+ 添加一行",
    });
    btn.addEventListener("click", () => {
      this.formData.lines.push({ chars: [] });
      this.charCards.push([]);
      this.renderForm();
      this.syncToFile();
    });
  }

  private syncToFile() {
    if (!this.file) return;
    const json = toJSON(this.formData);
    this.app.vault.modify(this.file, json);
  }
}
