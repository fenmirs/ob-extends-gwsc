export const INITIALS = [
  "b", "p", "m", "f", "d", "t", "n", "l",
  "g", "k", "h", "j", "q", "x",
  "zh", "ch", "sh", "r", "z", "c", "s", "y", "w",
];

export const FINALS = [
  "a", "o", "e", "i", "u", "\u00fc",
  "ai", "ei", "ao", "ou", "an", "en", "ang", "eng", "ong",
  "ia", "ie", "iu", "iao", "ian", "in", "iang", "ing", "iong",
  "ua", "uo", "uai", "ui", "uan", "un", "uang",
  "\u00fce", "\u00fcan", "\u00fcn",
];

export const TONES = ["\u0304", "\u0301", "\u030C", "\u0300"];
export const TONE_LABELS = ["\u02c9", "\u00b4", "\u02c7", "\u0060"];

export function applyTone(vowel: string, tone: string): string {
  const toneIndex = TONES.indexOf(tone);
  if (toneIndex === -1) return vowel;
  const baseVowels = "aeiou\u00fc";
  const toned = [
    ["\u0101", "\u00e1", "\u01ce", "\u00e0"],
    ["\u0113", "\u00e9", "\u011b", "\u00e8"],
    ["\u012b", "\u00ed", "\u01d0", "\u00ec"],
    ["\u014d", "\u00f3", "\u01d2", "\u00f2"],
    ["\u016b", "\u00fa", "\u01d4", "\u00f9"],
    ["\u01d6", "\u01d8", "\u01da", "\u01dc"],
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
    label.textContent = "\u58f0\u6bcd:";
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
    label.textContent = "\u97f5\u6bcd:";
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
    label.textContent = "\u58f0\u8c03:";
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
    clearBtn.textContent = "\u6e05\u9664";
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
    confirmBtn.textContent = "\u786e\u8ba4";
    confirmBtn.addEventListener("click", () => {
      const pinyin = this.getPinyin();
      if (pinyin) this.onConfirm(pinyin);
    });
    actions.appendChild(confirmBtn);

    const closeBtn = document.createElement("button");
    closeBtn.className = "heti-pinyin-btn heti-pinyin-close";
    closeBtn.textContent = "\u5173\u95ed";
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
      this.previewText.textContent = "\u70b9\u51fb\u9009\u62e9\u58f0\u6bcd\u3001\u97f5\u6bcd\u3001\u58f0\u8c03";
    }
  }
}
