import { CharData } from "./poem-data";

export const INITIALS = [
  "b", "p", "m", "f", "d", "t", "n", "l",
  "g", "k", "h", "j", "q", "x",
  "zh", "ch", "sh", "r", "z", "c", "s", "y", "w",
];

export const FINALS = [
  "a", "o", "e", "i", "u", "ü",
  "ai", "ei", "ao", "ou", "an", "en", "ang", "eng", "ong",
  "ia", "ie", "iu", "iao", "ian", "in", "iang", "ing", "iong",
  "ua", "uo", "uai", "ui", "uan", "un", "uang",
  "üe", "üan", "ün",
];

export const TONES = ["\u0304", "\u0301", "\u030C", "\u0300"];

export const TONE_LABELS = ["ˉ", "ˊ", "ˇ", "ˋ"];

export function applyTone(vowel: string, tone: string): string {
  const toneIndex = TONES.indexOf(tone);
  if (toneIndex === -1) return vowel;
  const baseVowels = "aeiouü";
  const toned = [
    ["ā", "á", "ǎ", "à"],
    ["ē", "é", "ě", "è"],
    ["ī", "í", "ǐ", "ì"],
    ["ō", "ó", "ǒ", "ò"],
    ["ū", "ú", "ǔ", "ù"],
    ["ǖ", "ǘ", "ǚ", "ǜ"],
  ];
  for (let i = 0; i < baseVowels.length; i++) {
    if (vowel.includes(baseVowels[i])) {
      return vowel.replace(baseVowels[i], toned[i][toneIndex]);
    }
  }
  return vowel;
}

export class PinyinKeyboard {
  private container: HTMLElement;
  private previewEl: HTMLElement;
  private initial = "";
  private final = "";
  private tone = "";
  private onConfirm: (pinyin: string) => void;
  private onClear: () => void;
  private onClose: () => void;

  constructor(
    onConfirm: (pinyin: string) => void,
    onClear: () => void,
    onClose: () => void
  ) {
    this.onConfirm = onConfirm;
    this.onClear = onClear;
    this.onClose = onClose;
    this.container = document.createElement("div");
    this.container.className = "heti-pinyin-keyboard";
    this.build();
    this.previewEl = this.container.querySelector(".heti-pinyin-preview")!;
  }

  getElement(): HTMLElement {
    return this.container;
  }

  private build() {
    const preview = this.container.createEl("div", {
      cls: "heti-pinyin-preview",
    });
    preview.createEl("span", { cls: "heti-pinyin-text", text: "点击选择声母、韵母、声调" });

    const initialRow = this.container.createEl("div", {
      cls: "heti-pinyin-row",
    });
    initialRow.createEl("span", { cls: "heti-pinyin-label", text: "声母:" });
    INITIALS.forEach((ini) => {
      const btn = initialRow.createEl("button", {
        cls: "heti-pinyin-btn",
        text: ini,
      });
      btn.addEventListener("click", () => {
        this.initial = ini;
        this.updatePreview();
      });
    });

    const finalRow1 = this.container.createEl("div", {
      cls: "heti-pinyin-row",
    });
    finalRow1.createEl("span", { cls: "heti-pinyin-label", text: "韵母:" });
    FINALS.slice(0, 15).forEach((fin) => {
      const btn = finalRow1.createEl("button", {
        cls: "heti-pinyin-btn",
        text: fin,
      });
      btn.addEventListener("click", () => {
        this.final = fin;
        this.updatePreview();
      });
    });

    const finalRow2 = this.container.createEl("div", {
      cls: "heti-pinyin-row heti-pinyin-row-indent",
    });
    FINALS.slice(15).forEach((fin) => {
      const btn = finalRow2.createEl("button", {
        cls: "heti-pinyin-btn",
        text: fin,
      });
      btn.addEventListener("click", () => {
        this.final = fin;
        this.updatePreview();
      });
    });

    const toneRow = this.container.createEl("div", {
      cls: "heti-pinyin-row",
    });
    toneRow.createEl("span", { cls: "heti-pinyin-label", text: "声调:" });
    TONE_LABELS.forEach((label, i) => {
      const btn = toneRow.createEl("button", {
        cls: "heti-pinyin-btn",
        text: label,
      });
      btn.addEventListener("click", () => {
        this.tone = TONES[i];
        this.updatePreview();
      });
    });

    const actions = this.container.createEl("div", {
      cls: "heti-pinyin-actions",
    });
    const clearBtn = actions.createEl("button", {
      cls: "heti-pinyin-btn heti-pinyin-clear",
      text: "清除",
    });
    clearBtn.addEventListener("click", () => {
      this.initial = "";
      this.final = "";
      this.tone = "";
      this.onClear();
      this.updatePreview();
    });

    const confirmBtn = actions.createEl("button", {
      cls: "heti-pinyin-btn heti-pinyin-confirm mod-cta",
      text: "确认",
    });
    confirmBtn.addEventListener("click", () => {
      const pinyin = this.getPinyin();
      if (pinyin) this.onConfirm(pinyin);
    });

    const closeBtn = actions.createEl("button", {
      cls: "heti-pinyin-btn heti-pinyin-close",
      text: "关闭",
    });
    closeBtn.addEventListener("click", () => this.onClose());
  }

  private getPinyin(): string {
    if (!this.final) return "";
    const base = this.initial + this.final;
    return applyTone(base, this.tone);
  }

  private updatePreview() {
    const text = this.previewEl.querySelector(".heti-pinyin-text");
    const pinyin = this.getPinyin();
    if (text) {
      if (pinyin) {
        text.textContent = pinyin;
      } else if (this.initial || this.final) {
        text.textContent = this.initial + this.final;
      } else {
        text.textContent = "点击选择声母、韵母、声调";
      }
    }
  }

  setPinyin(pinyin: string) {
    this.initial = "";
    this.final = pinyin;
    this.tone = "";
    this.updatePreview();
  }
}
