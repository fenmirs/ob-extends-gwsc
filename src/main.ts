import { Plugin } from "obsidian";
import { createFormWidget } from "./form-widget";

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
