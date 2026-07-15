# Task 2: 集成 Heti CSS

## Goal
下载 Heti CSS 并集成到插件中，注册阅读模式的 PostProcessor，为后续的排版功能奠定基础。

## Files to Create/Modify
- Create: `assets/heti.min.css`
- Modify: `src/main.ts`

## Steps

### Step 1: 下载 heti.min.css
```bash
curl -L "https://unpkg.com/heti/umd/heti.min.css" -o assets/heti.min.css
```

### Step 2: 修改 src/main.ts — 注册阅读模式 PostProcessor
```typescript
import { Plugin, MarkdownView } from "obsidian";

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
      const typeMap: Record<string, string> = {
        poetry: "heti--poetry",
        ancient: "heti--ancient",
        annotation: "heti--annotation",
        vertical: "heti--vertical",
      };
      if (typeMap[hetiType]) {
        el.addClass(typeMap[hetiType]);
      }
    });
  }

  onunload() {
    console.log("Heti 插件已卸载");
  }
}
```

### Step 3: 验证构建
```bash
npm run build
```

### Step 4: Commit
```bash
git add -A
git commit -m "feat: integrate Heti CSS and reading view post-processor"
```

## Verification
- `assets/heti.min.css` 文件存在且内容非空
- `npm run build` 成功
- main.ts 中包含 registerMarkdownPostProcessor 逻辑
