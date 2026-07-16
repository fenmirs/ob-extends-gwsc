// src/font-detector.ts

const CHINESE_FONTS = [
  // Windows 常见字体
  "SimSun", "SimHei", "KaiTi", "FangSong",
  "Microsoft YaHei", "Microsoft YaHei Light",
  
  // macOS 常见字体
  "STSong", "STHeiti", "STKaiti", "STFangsong",
  "PingFang SC", "Hiragino Sans GB",
  
  // 其他中文字体
  "LiSu", "YouYuan", "PMingLiU", "MingLiU",
  "NSimSun", "FZXiaoBiaoSong-B05S",
];

let cachedFonts: string[] | null = null;

export function getDefaultFont(): string {
  const editor = document.querySelector(".cm-editor");
  if (editor) {
    const computedFont = window.getComputedStyle(editor).fontFamily;
    return computedFont.split(",")[0].trim().replace(/['"]/g, "");
  }
  return "serif";
}

function isFontAvailable(fontName: string): boolean {
  const testString = "测";
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return false;
  
  ctx.font = `12px serif`;
  const defaultWidth = ctx.measureText(testString).width;
  
  ctx.font = `12px "${fontName}", serif`;
  const targetWidth = ctx.measureText(testString).width;
  
  return defaultWidth !== targetWidth;
}

export function getAvailableChineseFonts(): string[] {
  if (cachedFonts) return cachedFonts;
  cachedFonts = CHINESE_FONTS.filter(isFontAvailable);
  return cachedFonts;
}
