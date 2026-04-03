import type { Aesthetic } from '../types';
import { getMoodBoardImages } from '../utils/results';

const SCALE = 2;
const CARD_WIDTH = 340 * SCALE;
const PADDING = 24 * SCALE;
const CONTENT_WIDTH = CARD_WIDTH - PADDING * 2;
const SHARE_URL = 'tylerleonhardt.github.io/aesthetic-ranker';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (!src.startsWith('blob:')) {
      img.crossOrigin = 'anonymous';
    }
    const timer = setTimeout(() => reject(new Error('Image load timeout')), 5000);
    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(timer);
      reject(new Error('Image load failed'));
    };
    img.src = src;
  });
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
): void {
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, radius);
  } else {
    const r = Math.min(radius, w / 2, h / 2);
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  radius?: number,
): void {
  ctx.save();
  if (radius) {
    drawRoundedRect(ctx, x, y, w, h, radius);
    ctx.clip();
  }
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const targetRatio = w / h;
  let sx: number, sy: number, sw: number, sh: number;
  if (imgRatio > targetRatio) {
    sh = img.naturalHeight;
    sw = sh * targetRatio;
    sx = (img.naturalWidth - sw) / 2;
    sy = 0;
  } else {
    sw = img.naturalWidth;
    sh = sw / targetRatio;
    sx = 0;
    sy = (img.naturalHeight - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  ctx.restore();
}

function resolveImageUrl(
  aesthetic: Aesthetic,
  _index: number,
  localImages: Map<string, string>,
): string {
  const originalUrl = getMoodBoardImages(aesthetic, 1)[0].url;
  return localImages.get(originalUrl) ?? originalUrl;
}

function truncateText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let truncated = text;
  while (truncated.length > 0 && ctx.measureText(truncated + '\u2026').width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '\u2026';
}

function computeHeight(bottomCount: number): number {
  let h = PADDING;
  h += 28;
  h += 8;
  h += 2;
  h += 40;
  h += 36;
  h += 12;
  h += 288;
  h += 32;
  h += 28;
  h += 12;
  h += 192;
  h += 40;
  if (bottomCount > 0) {
    h += 24;
    h += 24;
    h += bottomCount * 44 + Math.max(0, bottomCount - 1) * 12;
    h += 40;
  }
  h += 24;
  h += PADDING;
  return h;
}

export async function renderShareCard(
  topThree: Aesthetic[],
  bottomThree: Aesthetic[],
  localImages: Map<string, string>,
): Promise<HTMLCanvasElement> {
  try {
    const canvasHeight = computeHeight(bottomThree.length);
    const canvas = document.createElement('canvas');
    canvas.width = CARD_WIDTH;
    canvas.height = canvasHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas 2d context');

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvasHeight);
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bgGrad;
    drawRoundedRect(ctx, 0, 0, CARD_WIDTH, canvasHeight, 16 * SCALE);
    ctx.fill();

    // Subtle border (ring-white/10)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, 1, 1, CARD_WIDTH - 2, canvasHeight - 2, 16 * SCALE);
    ctx.stroke();

    // Pre-load all images in parallel
    const images = await Promise.all(
      topThree.map((a, i) =>
        loadImage(resolveImageUrl(a, i, localImages)).catch(() => null),
      ),
    );

    let y = PADDING;

    // Title
    ctx.fillStyle = '#94a3b8';
    ctx.font = `bold ${10 * SCALE}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.letterSpacing = `${3 * SCALE}px`;
    ctx.fillText('MY TOP AESTHETICS', CARD_WIDTH / 2, y + 20);
    ctx.letterSpacing = '0px';
    y += 28 + 8;

    // Indigo divider
    const divGrad = ctx.createLinearGradient(
      CARD_WIDTH / 2 - 16 * SCALE, 0,
      CARD_WIDTH / 2 + 16 * SCALE, 0,
    );
    divGrad.addColorStop(0, 'transparent');
    divGrad.addColorStop(0.5, '#6366f1');
    divGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = divGrad;
    ctx.fillRect(CARD_WIDTH / 2 - 16 * SCALE, y, 32 * SCALE, 2);
    y += 2 + 40;

    // 🥇 Hero section
    ctx.textAlign = 'left';
    ctx.font = `${18 * SCALE}px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = '#ffffff';
    const heroMedalW = ctx.measureText('\u{1F947}').width;
    ctx.fillText('\u{1F947}', PADDING, y + 28);
    ctx.font = `bold ${16 * SCALE}px system-ui, -apple-system, sans-serif`;
    ctx.fillText(topThree[0].name, PADDING + heroMedalW + 8 * SCALE, y + 28);
    y += 36 + 12;

    const heroImgH = 144 * SCALE;
    if (images[0]) {
      drawImageCover(ctx, images[0], PADDING, y, CONTENT_WIDTH, heroImgH, 12 * SCALE);
    } else {
      ctx.fillStyle = '#334155';
      drawRoundedRect(ctx, PADDING, y, CONTENT_WIDTH, heroImgH, 12 * SCALE);
      ctx.fill();
    }
    y += heroImgH + 32;

    // 🥈🥉 Side-by-side
    const colGap = 12 * SCALE;
    const colW = (CONTENT_WIDTH - colGap) / 2;
    const sideImgH = 96 * SCALE;
    const sideMedals = ['\u{1F948}', '\u{1F949}'] as const;

    for (let i = 0; i < 2; i++) {
      const colX = PADDING + i * (colW + colGap);
      ctx.font = `${14 * SCALE}px system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = '#ffffff';
      const mw = ctx.measureText(sideMedals[i]).width;
      ctx.fillText(sideMedals[i], colX, y + 22);
      ctx.font = `600 ${14 * SCALE}px system-ui, -apple-system, sans-serif`;
      const maxNameW = colW - mw - 6 * SCALE;
      ctx.fillText(
        truncateText(ctx, topThree[i + 1].name, maxNameW),
        colX + mw + 6 * SCALE,
        y + 22,
      );
    }
    y += 28 + 12;

    for (let i = 0; i < 2; i++) {
      const colX = PADDING + i * (colW + colGap);
      if (images[i + 1]) {
        drawImageCover(ctx, images[i + 1]!, colX, y, colW, sideImgH, 8 * SCALE);
      } else {
        ctx.fillStyle = '#334155';
        drawRoundedRect(ctx, colX, y, colW, sideImgH, 8 * SCALE);
        ctx.fill();
      }
    }
    y += sideImgH + 40;

    // Not My Vibe section
    if (bottomThree.length > 0) {
      ctx.textAlign = 'center';
      ctx.font = `500 ${9 * SCALE}px system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = '#64748b';
      ctx.letterSpacing = `${1.5 * SCALE}px`;
      const sepLabel = 'NOT MY VIBE';
      const sepLabelW = ctx.measureText(sepLabel).width;
      const lineGap = 8 * SCALE;

      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(PADDING, y + 12);
      ctx.lineTo(CARD_WIDTH / 2 - sepLabelW / 2 - lineGap, y + 12);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(CARD_WIDTH / 2 + sepLabelW / 2 + lineGap, y + 12);
      ctx.lineTo(CARD_WIDTH - PADDING, y + 12);
      ctx.stroke();

      ctx.fillText(sepLabel, CARD_WIDTH / 2, y + 17);
      ctx.letterSpacing = '0px';
      y += 24 + 24;

      ctx.textAlign = 'left';
      for (let i = 0; i < bottomThree.length; i++) {
        if (i > 0) y += 12;

        ctx.fillStyle = 'rgba(30, 41, 59, 0.3)';
        drawRoundedRect(ctx, PADDING, y, CONTENT_WIDTH, 44, 8 * SCALE);
        ctx.fill();

        const itemPadX = 12 * SCALE;
        ctx.font = `${14 * SCALE}px system-ui, -apple-system, sans-serif`;
        ctx.fillStyle = '#64748b';
        const skullW = ctx.measureText('\u{1F480}').width;
        ctx.fillText('\u{1F480}', PADDING + itemPadX, y + 30);

        const bottomNameMaxW = CONTENT_WIDTH - itemPadX * 2 - skullW - 10 * SCALE;
        ctx.fillText(
          truncateText(ctx, bottomThree[i].name, bottomNameMaxW),
          PADDING + itemPadX + skullW + 10 * SCALE,
          y + 30,
        );
        y += 44;
      }
      y += 40;
    }

    // Watermark
    ctx.textAlign = 'center';
    ctx.fillStyle = '#475569';
    ctx.font = `${10 * SCALE}px system-ui, -apple-system, sans-serif`;
    ctx.fillText(SHARE_URL, CARD_WIDTH / 2, y + 16);

    return canvas;
  } catch (err) {
    throw new Error(
      `Share card rendering failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}
