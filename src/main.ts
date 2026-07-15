import { Plugin } from "obsidian";

const TYPE_MAP: Record<string, string> = {
  poetry: "heti--poetry",
  ancient: "heti--ancient",
  annotation: "heti--annotation",
  vertical: "heti--vertical",
};

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
      if (TYPE_MAP[hetiType]) {
        el.addClass(TYPE_MAP[hetiType]);
      }
    });
  }

  onunload() {
    console.log("Heti 插件已卸载");
  }
}
