# Task 5: 注音弹窗

## Goal
创建注音弹窗（RubyModal），替换 Task 4 中创建的 stub 文件，并添加样式。

## Files to Create/Modify
- Modify: `src/ruby-modal.ts` (替换 stub 为完整实现)
- Modify: `src/styles.css` (添加样式)

## Steps

### Step 1: 替换 src/ruby-modal.ts 为完整实现
```typescript
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
    contentEl.addClass("heti-ruby-modal");
    contentEl.createEl("h3", { text: "注音" });

    const display = contentEl.createEl("div", { cls: "heti-ruby-preview", text: this.selectedText });
    display.style.fontSize = "24px";
    display.style.textAlign = "center";
    display.style.padding = "16px";

    const inputContainer = contentEl.createEl("div", { cls: "heti-ruby-input-container" });
    inputContainer.createEl("label", { text: "拼音（统一: zhū yú 或 逐字: 茱:zhū,萸:yú）：" });
    const input = inputContainer.createEl("input", {
      type: "text", cls: "heti-ruby-input",
      placeholder: "例: zhū yú 或 茱:zhū,萸:yú",
    });
    input.style.width = "100%";
    input.style.marginTop = "8px";
    input.style.padding = "8px";

    const buttonContainer = contentEl.createEl("div", { cls: "heti-ruby-buttons" });
    buttonContainer.style.display = "flex";
    buttonContainer.style.gap = "8px";
    buttonContainer.style.marginTop = "12px";
    buttonContainer.style.justifyContent = "flex-end";

    const cancelBtn = buttonContainer.createEl("button", { text: "取消" });
    cancelBtn.addEventListener("click", () => this.close());

    const confirmBtn = buttonContainer.createEl("button", { text: "确认", cls: "mod-cta" });
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
      return pin ? `${c}<rt>${pin}</rt>` : c;
    }).join("")}</ruby>`;
  } else {
    return `<ruby>${chars.map((c) => `${c}<rt>${pinyin}</rt>`).join("")}</ruby>`;
  }
}
```

### Step 2: 为 RubyModal 添加样式到 src/styles.css
```css
.heti-ruby-modal .modal-content { padding: 16px; }
.heti-ruby-modal h3 { margin-top: 0; }
```

### Step 3: 验证构建
```bash
npm run build
```

### Step 4: Commit
```bash
git add -A
git commit -m "feat: add ruby/furigana modal with pinyin input"
```

## Verification
- `src/ruby-modal.ts` 包含完整的 RubyModal 和 buildRubyHtml 实现
- `src/styles.css` 包含 RubyModal 样式
- `npm run build` 成功
- toolbar.ts 中的注音按钮可以正常调用 RubyModal
