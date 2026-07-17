import { CharData } from "./poem-data";

export class CharCard {
  private container: HTMLElement;
  private charEl: HTMLElement;
  private pinyinEl: HTMLElement;
  private deleteBtn: HTMLElement;
  private data: CharData;
  private onUpdate: (data: CharData) => void;
  private onDelete: () => void;
  private onCardClick: () => void = () => {};
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

    this.charEl = document.createElement("div");
    this.charEl.className = "heti-char";
    this.charEl.textContent = data.char;
    this.container.appendChild(this.charEl);

    this.pinyinEl = document.createElement("div");
    this.pinyinEl.className = "heti-char-pinyin";
    this.pinyinEl.textContent = data.pinyin || "";
    this.container.appendChild(this.pinyinEl);

    this.deleteBtn = document.createElement("div");
    this.deleteBtn.className = "heti-char-delete";
    this.deleteBtn.textContent = "\u00d7";
    this.deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.onDelete();
    });
    this.container.appendChild(this.deleteBtn);

    this.container.addEventListener("click", () => this.onCardClick());

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

  getData(): CharData {
    return this.data;
  }

  setActive(active: boolean) {
    this.isActive = active;
    this.container.classList.toggle("active", active);
  }

  setOnCardClick(handler: () => void) {
    this.onCardClick = handler;
  }

  updatePinyin(pinyin: string) {
    this.data.pinyin = pinyin;
    this.pinyinEl.textContent = pinyin;
  }

  clearPinyin() {
    this.data.pinyin = undefined;
    this.pinyinEl.textContent = "";
  }
}
