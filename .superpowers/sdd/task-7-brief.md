# Task 7: 集成测试

## Goal
创建测试用的诗词文件，验证插件功能。

## Files to Create
- Create: `test-poem.md`
- Create: `test-ancient.md`
- Create: `test-embed.md`

## Steps

### Step 1: 创建测试诗词 test-poem.md
```markdown
---
heti: poetry
朝代: 唐
作者: 李白
---

<div class="heti heti--poetry">
  <h2>赠汪伦<span class="heti-meta heti-small">[唐]<abbr title="号青莲居士">李白</abbr></span></h2>
  <p class="heti-x-large">
    李白乘舟将欲行<span class="heti-hang">，</span><br>
    忽闻岸上踏歌声<span class="heti-hang">。</span><br>
    桃花潭水深千尺<span class="heti-hang">，</span><br>
    不及汪伦送我情<span class="heti-hang">。</span>
  </p>
</div>
```

### Step 2: 创建测试古文 test-ancient.md
```markdown
---
heti: ancient
朝代: 三国
作者: 诸葛亮
---

<div class="heti heti--ancient">
  <h2>出师表<span class="heti-meta heti-small">[三国]<abbr title="字孔明">诸葛亮</abbr></span></h2>
  <p>先帝创业未半而中道崩殂，今天下三分，益州疲弊，此诚危急存亡之秋也。</p>
</div>
```

### Step 3: 创建测试嵌入 test-embed.md
```markdown
# 诗词合集

![[test-poem]]

![[test-ancient]]
```

### Step 4: 最终构建验证
```bash
npm run build
```

### Step 5: Commit
```bash
git add -A
git commit -m "feat: add test poems and finalize plugin"
```

## Verification
- 三个测试文件创建成功
- 文件内容正确包含 frontmatter 和 Heti HTML
- `npm run build` 成功
