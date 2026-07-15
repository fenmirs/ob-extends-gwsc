import { CharData } from "./poem-data";
import { PinyinKeyboard } from "./pinyin-keyboard";

export class CharCard {
  private container: HTMLElement;
  private charEl: HTMLElement;
  private pinyinEl: HTMLElement;
  private deleteBtn: HTMLElement;
  private keyboardContainer: HTMLElement;
  private keyboard: PinyinKeyboard | null = null;
  private data: CharData;
  private onUpdate: (data: CharData) => void;
  private onDelete: () => void;
  private isActive = false;

  constructor(
    data: CharData,
    onUpdate: (data: CharData) => void,
    onDelete: () => void
  ) {
    this.data = data;
    this.onUpdate = onUpdate;
    this.onDelete = onDelete;

    this.container = document.createElement("div");
    this.container.className = "heti-char-card";

    this.charEl = this.container.createEl("div", {
      cls: "heti-char",
      text: data.char,
    });

    this.pinyinEl = this.container.createEl("div", {
      cls: "heti-char-pinyin",
      text: data.pinyin || "",
    });

    this.deleteBtn = this.container.createEl("div", {
      cls: "heti-char-delete",
      text: "×",
    });
    this.deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.onDelete();
    });

    this.keyboardContainer = document.createElement("div");
    this.keyboardContainer.className = "heti-char-keyboard-container";

    this.container.addEventListener("click", () => this.toggleKeyboard());

    this.container.addEventListener("mouseenter", () => {
      this.container.classList.add("hovered");
    });
    this.container.addEventListener("mouseleave", () => {
      this.container.classList.remove("hovered");
    });
  }

  getElement(): HTMLElement {
    return this.container;
  }

  getKeyboardElement(): HTMLElement {
    return this.keyboardContainer;
  }

  getData(): CharData {
    return this.data;
  }

  private toggleKeyboard() {
    if (this.isActive) {
      this.closeKeyboard();
    } else {
      this.openKeyboard();
    }
  }

  openKeyboard() {
    this.isActive = true;
    this.container.classList.add("active");

    this.keyboard = new PinyinKeyboard(
      (pinyin) => {
        this.data.pinyin = pinyin;
        this.pinyinEl.textContent = pinyin;
        this.onUpdate(this.data);
        this.closeKeyboard();
      },
      () => {
        this.data.pinyin = undefined;
        this.pinyinEl.textContent = "";
        this.onUpdate(this.data);
      }
    );

    if (this.data.pinyin) {
      this.keyboard.setPinyin(this.data.pinyin);
    }

    this.keyboardContainer.empty();
    this.keyboardContainer.appendChild(this.keyboard.getElement());
    this.keyboardContainer.style.display = "block";
  }

  closeKeyboard() {
    this.isActive = false;
    this.container.classList.remove("active");
    this.keyboardContainer.style.display = "none";
    this.keyboardContainer.empty();
    this.keyboard = null;
  }
}
