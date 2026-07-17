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
  private previewText: HTMLElement;
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

    this.previewText = document.createElement("div");
    this.previewText.className = "heti-pinyin-preview";
    this.container.appendChild(this.previewText);

    this.buildInitialRow();
    this.buildFinalRows();
    this.buildToneRow();
    this.buildActions();
    this.updatePreview();
  }

  getElement(): HTMLElement {
    return this.container;
  }

  setPinyin(pinyin: string) {
    this.initial = "";
    this.final = pinyin;
    this.tone = "";
    this.updatePreview();
  }

  private buildInitialRow() {
    const row = document.createElement("div");
    row.className = "heti-pinyin-row";
    const label = document.createElement("span");
    label.className = "heti-pinyin-label";
    label.textContent = "声母:";
    row.appendChild(label);
    INITIALS.forEach((ini) => {
      const btn = document.createElement("button");
      btn.className = "heti-pinyin-btn";
      btn.textContent = ini;
      btn.addEventListener("click", () => {
        this.initial = ini;
        this.updatePreview();
      });
      row.appendChild(btn);
    });
    this.container.appendChild(row);
  }

  private buildFinalRows() {
    const row1 = document.createElement("div");
    row1.className = "heti-pinyin-row";
    const label = document.createElement("span");
    label.className = "heti-pinyin-label";
    label.textContent = "韵母:";
    row1.appendChild(label);
    FINALS.slice(0, 15).forEach((fin) => {
      const btn = document.createElement("button");
      btn.className = "heti-pinyin-btn";
      btn.textContent = fin;
      btn.addEventListener("click", () => {
        this.final = fin;
        this.updatePreview();
      });
      row1.appendChild(btn);
    });
    this.container.appendChild(row1);

    const row2 = document.createElement("div");
    row2.className = "heti-pinyin-row heti-pinyin-row-indent";
    FINALS.slice(15).forEach((fin) => {
      const btn = document.createElement("button");
      btn.className = "heti-pinyin-btn";
      btn.textContent = fin;
      btn.addEventListener("click", () => {
        this.final = fin;
        this.updatePreview();
      });
      row2.appendChild(btn);
    });
    this.container.appendChild(row2);
  }

  private buildToneRow() {
    const row = document.createElement("div");
    row.className = "heti-pinyin-row";
    const label = document.createElement("span");
    label.className = "heti-pinyin-label";
    label.textContent = "声调:";
    row.appendChild(label);
    TONE_LABELS.forEach((labelText, i) => {
      const btn = document.createElement("button");
      btn.className = "heti-pinyin-btn";
      btn.textContent = labelText;
      btn.addEventListener("click", () => {
        this.tone = TONES[i];
        this.updatePreview();
      });
      row.appendChild(btn);
    });
    this.container.appendChild(row);
  }

  private buildActions() {
    const actions = document.createElement("div");
    actions.className = "heti-pinyin-actions";

    const clearBtn = document.createElement("button");
    clearBtn.className = "heti-pinyin-btn heti-pinyin-clear";
    clearBtn.textContent = "清除";
    clearBtn.addEventListener("click", () => {
      this.initial = "";
      this.final = "";
      this.tone = "";
      this.onClear();
      this.updatePreview();
    });
    actions.appendChild(clearBtn);

    const confirmBtn = document.createElement("button");
    confirmBtn.className = "heti-pinyin-btn heti-pinyin-confirm mod-cta";
    confirmBtn.textContent = "确认";
    confirmBtn.addEventListener("click", () => {
      const pinyin = this.getPinyin();
      if (pinyin) this.onConfirm(pinyin);
    });
    actions.appendChild(confirmBtn);

    const closeBtn = document.createElement("button");
    closeBtn.className = "heti-pinyin-btn heti-pinyin-close";
    closeBtn.textContent = "关闭";
    closeBtn.addEventListener("click", () => this.onClose());
    actions.appendChild(closeBtn);

    this.container.appendChild(actions);
  }

  private getPinyin(): string {
    if (!this.final) return "";
    const base = this.initial + this.final;
    return applyTone(base, this.tone);
  }

  private updatePreview() {
    const pinyin = this.getPinyin();
    if (pinyin) {
      this.previewText.textContent = pinyin;
    } else if (this.initial || this.final) {
      this.previewText.textContent = this.initial + this.final;
    } else {
      this.previewText.textContent = "点击选择声母、韵母、声调";
    }
  }
}
