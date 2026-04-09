const PX_PER_PT = 96 / 72;
const FONT_FAMILY = 'Roboto, Arial, sans-serif';
const FONT_WEIGHT_MAP = {
  bold: '700',
  normal: '400',
};

type MeasureTextOptions = {
  text: string;
  fontSize?: number;
  lineHeight?: number;
  maxWidth?: number;
  fontWeight?: keyof typeof FONT_WEIGHT_MAP;
};

type MeasureTextResult = { lines: number; height: number };

let cachedContext: CanvasRenderingContext2D | null = null;

const getContext = (): CanvasRenderingContext2D | null => {
  if (typeof document === 'undefined') {
    return null;
  }
  if (cachedContext) {
    return cachedContext;
  }
  const canvas = document.createElement('canvas');
  cachedContext = canvas.getContext('2d');
  return cachedContext;
};

const sanitizeFragment = (fragment: string): string =>
  fragment.replace(/\r?\n$/g, '');

const measureLongFragment = (
  ctx: CanvasRenderingContext2D,
  fragment: string,
  maxWidthPx: number,
) => {
  let localWidth = 0;
  let extraLines = 0;
  for (const char of fragment) {
    const charWidth = ctx.measureText(char).width;
    if (localWidth + charWidth > maxWidthPx && localWidth > 0) {
      extraLines += 1;
      localWidth = charWidth;
    } else {
      localWidth += charWidth;
    }
  }
  return { extraLines, remainingWidth: localWidth };
};

export const measurePreciseTextBlock = ({
  text,
  fontSize = 10,
  lineHeight = 1.15,
  maxWidth,
  fontWeight = 'normal',
}: MeasureTextOptions): MeasureTextResult => {
  if (!text) {
    return { lines: 0, height: 0 };
  }

  const ctx = getContext();
  if (!ctx || !maxWidth) {
    const fallbackHeight = fontSize * lineHeight;
    return { lines: 1, height: fallbackHeight };
  }

  const fontSizePx = fontSize * PX_PER_PT;
  const resolvedWeight = FONT_WEIGHT_MAP[fontWeight] || FONT_WEIGHT_MAP.normal;
  ctx.font = `${resolvedWeight} ${fontSizePx}px ${FONT_FAMILY}`;

  const normalizedText = text.replace(/\t/g, '    ');
  const maxWidthPx = maxWidth * PX_PER_PT;

  let widthPx = 0;
  let lines = 1;
  const tokens = tokenize(normalizedText);

  tokens.forEach((token) => {
    if (token === '\n') {
      lines += 1;
      widthPx = 0;
      return;
    }

    const fragment = sanitizeFragment(token);
    const fragmentWidth = ctx.measureText(fragment).width;
    const isWhitespace = /^\s+$/.test(fragment);

    if (widthPx + fragmentWidth <= maxWidthPx) {
      widthPx += fragmentWidth;
      return;
    }

    if (isWhitespace) {
      lines += 1;
      widthPx = 0;
      return;
    }

    if (widthPx > 0) {
      lines += 1;
      widthPx = 0;
    }

    if (fragmentWidth <= maxWidthPx) {
      widthPx = fragmentWidth;
    } else {
      const segmented = measureLongFragment(ctx, fragment, maxWidthPx);
      lines += segmented.extraLines;
      widthPx = segmented.remainingWidth;
    }
  });

  const height = lines * fontSize * lineHeight;
  return { lines, height };
};

const tokenize = (text: string): string[] => {
  const tokens = [];
  const parts = text.split(/(\r?\n)/);
  parts.forEach((part) => {
    if (part === '\r\n' || part === '\n') {
      tokens.push('\n');
      return;
    }
    if (part === '') {
      return;
    }
    const segments = part.match(/[^\s]+|\s+/g);
    if (segments) {
      tokens.push(...segments);
    }
  });
  return tokens;
};
