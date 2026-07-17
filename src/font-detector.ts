const CHINESE_FONTS = [
  "SimSun", "SimHei", "KaiTi", "FangSong",
  "Microsoft YaHei", "Microsoft YaHei Light",
  "STSong", "STHeiti", "STKaiti", "STFangsong",
  "PingFang SC", "Hiragino Sans GB",
  "LiSu", "YouYuan", "PMingLiU", "MingLiU",
];

let cachedFonts: string[] | null = null;

function isFontAvailable(fontName: string): boolean {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return false;
  ctx.font = "12px serif";
  const defaultWidth = ctx.measureText("\u6d4b").width;
  ctx.font = `12px "${fontName}", serif`;
  const targetWidth = ctx.measureText("\u6d4b").width;
  return defaultWidth !== targetWidth;
}

export function getAvailableChineseFonts(): string[] {
  if (cachedFonts) return cachedFonts;
  cachedFonts = CHINESE_FONTS.filter(isFontAvailable);
  return cachedFonts;
}
