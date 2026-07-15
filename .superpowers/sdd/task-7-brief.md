### Task 7: 集成到 main.ts

**Files:**
- Modify: `src/main.ts:1-66`

**Interfaces:**
- Consumes: `createModeSwitcher` from `src/mode-switcher.ts`, `createFormWidget` from `src/form-widget.ts`, `viewModeField`, `setViewMode` from `src/view-mode.ts`

- [ ] **Step 1: 更新 main.ts**

```typescript
// src/main.ts
import { Plugin, MarkdownView } from "obsidian";
import { createModeSwitcher } from "./mode-switcher";
import { createFormWidget } from "./form-widget";
import { viewModeField, setViewMode } from "./view-mode";

const TYPE_MAP: Record<string, string> = {
  poetry: "heti--poetry",
  ancient: "heti--ancient",
  annotation: "heti--annotation",
  vertical: "heti--vertical",
};

export { TYPE_MAP };

export default class HetiPlugin extends Plugin {
  async onload() {
    console.log("Heti 插件已加载");

    this.registerMarkdownPostProcessor((el, ctx) => {
      const cache = this.app.metadataCache.getFileCache(
        this.app.vault.getAbstractFileByPath(ctx.sourcePath) as any
      );
      const hetiType = cache?.frontmatter?.heti;
      if (!hetiType) return;
      el.addClass("heti");
      if (TYPE_MAP[hetiType]) el.addClass(TYPE_MAP[hetiType]);

      if (hetiType === "vertical") {
        el.style.writingMode = "vertical-rl";
        el.style.textOrientation = "upright";
      }
    });

    this.registerEditorExtension(createModeSwitcher(this));
    this.registerEditorExtension(createFormWidget(this));

    this.addCommand({
      id: "new-poem",
      name: "新建诗词",
      callback: () => this.createNewPoem(),
    });
  }

  async createNewPoem() {
    const leaf = this.app.workspace.getLeaf();
    const folderPath = "诗词";
    if (!(await this.app.vault.adapter.exists(folderPath))) {
      await this.app.vault.createFolder(folderPath);
    }
    const baseName = `${folderPath}/新建诗词`;
    let filePath = `${baseName}.md`;
    let counter = 1;
    while (await this.app.vault.adapter.exists(filePath)) {
      filePath = `${baseName} ${counter}.md`;
      counter++;
    }
    const file = await this.app.vault.create(
      filePath,
      '---\nheti: poetry\n朝代: \n作者: \n---\n\n<div class="heti heti--poetry">\n  <h2>标题<span class="heti-meta heti-small">[朝代]<abbr title="">作者</abbr></span></h2>\n  <p class="heti-x-large">\n    \n  </p>\n</div>'
    );
    await leaf.openFile(file);
  }

  onunload() {
    console.log("Heti 插件已卸载");
  }
}
```

- [ ] **Step 2: 删除旧工具栏引用**

确保 `src/main.ts` 中不再引用 `./toolbar`。

- [ ] **Step 3: 运行构建**

Run: `npm run build`
Expected: 构建成功，main.js 更新

- [ ] **Step 4: 提交**

```bash
git add src/main.ts
git commit -m "feat: integrate form UI into plugin"
```
