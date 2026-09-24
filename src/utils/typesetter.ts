import { TextBlock, ComicFontFamily } from '../types/comic';

export interface RenderOptions {
  showOriginal?: boolean;
  showBoundingBoxes?: boolean;
  selectedBlockId?: number | null;
  hoveredBlockId?: number | null;
  globalFontFamily?: ComicFontFamily;
  globalUppercase?: boolean;
  patchMode?: 'adaptive' | 'outline-only' | 'solid';
  customPatches?: Array<{ x: number; y: number; radius: number; color: string }>;
}

/**
 * Draws the complete translated page onto the target canvas.
 */
export function renderComicPage(
  canvas: HTMLCanvasElement,
  originalImage: HTMLImageElement,
  blocks: TextBlock[],
  options: RenderOptions = {}
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = originalImage.naturalWidth || originalImage.width;
  const h = originalImage.naturalHeight || originalImage.height;

  // Set canvas dimensions to match original high resolution
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }

  // 1. Draw base original image
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(originalImage, 0, 0, w, h);

  // If user is previewing pure original, stop here
  if (options.showOriginal) {
    if (options.showBoundingBoxes) {
      drawBoundingBoxesOnly(ctx, blocks, w, h, options);
    }
    return;
  }

  // 2. Apply any custom user manual patches / eraser touches
  if (options.customPatches && options.customPatches.length > 0) {
    ctx.save();
    for (const patch of options.customPatches) {
      ctx.fillStyle = patch.color;
      ctx.beginPath();
      ctx.arc(patch.x, patch.y, patch.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 3. For each detected block: inpaint/erase Korean text & render English text
  const sortedBlocks = [...blocks].sort((a, b) => a.reading_order - b.reading_order);

  for (const block of sortedBlocks) {
    if (block.hidden) continue;

    const [ymin, xmin, ymax, xmax] = block.box_2d;
    const boxX = (xmin / 1000) * w;
    const boxY = (ymin / 1000) * h;
    const boxW = Math.max(20, ((xmax - xmin) / 1000) * w);
    const boxH = Math.max(16, ((ymax - ymin) / 1000) * h);

    // Step A: Inpaint / Erase the Korean text area
    eraseOriginalText(ctx, boxX, boxY, boxW, boxH, block, options);

    // Step B: Render translated English text
    renderEnglishText(ctx, boxX, boxY, boxW, boxH, block, options);
  }

  // 4. If bounding boxes are enabled, overlay interactive guide outlines
  if (options.showBoundingBoxes) {
    drawBoundingBoxesOnly(ctx, blocks, w, h, options);
  }
}

/**
 * Erases the Korean text inside the bounding box using appropriate shape matching
 */
function eraseOriginalText(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  block: TextBlock,
  options: RenderOptions
) {
  ctx.save();

  const bgColor = block.customBgColor || block.bg_color || '#ffffff';
  const opacity = block.bgOpacity !== undefined ? block.bgOpacity : 0.98;

  ctx.fillStyle = hexToRgba(bgColor, opacity);

  const cx = x + w / 2;
  const cy = y + h / 2;
  const rx = w / 2 + 2;
  const ry = h / 2 + 2;

  if (block.bubble_type === 'sfx' && block.shape === 'none') {
    // For free-floating SFX on art, draw a soft rounded backdrop to ensure English text is readable
    ctx.beginPath();
    ctx.roundRect(x - 4, y - 2, w + 8, h + 4, 8);
    ctx.fillStyle = hexToRgba(bgColor, Math.min(opacity, 0.85));
    ctx.fill();
  } else if (block.shape === 'rectangle' || block.bubble_type === 'narration') {
    // Narration boxes
    ctx.beginPath();
    ctx.roundRect(x - 2, y - 2, w + 4, h + 4, 6);
    ctx.fill();
  } else if (block.shape === 'cloud' || block.bubble_type === 'thought') {
    // Thought cloud
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Default speech bubble: smooth oval / ellipse
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Dynamically wraps and typesets English text centered in the bubble
 */
function renderEnglishText(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  block: TextBlock,
  options: RenderOptions
) {
  ctx.save();

  let text = block.translated_text || '';
  const isUppercase =
    block.customUppercase !== undefined
      ? block.customUppercase
      : options.globalUppercase !== undefined
      ? options.globalUppercase
      : true; // Default comics uppercase

  if (isUppercase) {
    text = text.toUpperCase();
  }

  const fontFamily = block.customFontFamily || options.globalFontFamily || selectDefaultFont(block);
  const textColor = block.customTextColor || block.text_color || '#000000';
  const isBold = block.customBold !== undefined ? block.customBold : (block.bubble_type === 'shout' || block.bubble_type === 'sfx');
  const hasOutline = block.customOutline !== undefined ? block.customOutline : (block.bubble_type === 'sfx');
  const outlineColor = block.customOutlineColor || (isDarkColor(textColor) ? '#ffffff' : '#000000');

  // Available printable area inside the bubble
  const maxTextW = w * 0.86;
  const maxTextH = h * 0.86;

  // Auto-calculate best font size that fits nicely
  const fontSize = calculateOptimalFontSize(ctx, text, maxTextW, maxTextH, fontFamily, isBold, block.customFontSize);

  ctx.font = `${isBold ? 'bold' : 'normal'} ${fontSize}px '${fontFamily}', cursive, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const lines = wrapTextLines(ctx, text, maxTextW);
  const lineHeight = fontSize * (block.lineHeight || 1.18);
  const totalBlockH = lines.length * lineHeight;

  const cx = x + w / 2;
  const startY = y + h / 2 - totalBlockH / 2 + lineHeight / 2;

  lines.forEach((line, index) => {
    const lineY = startY + index * lineHeight;

    // Draw outline stroke if needed (great for SFX and contrasting backgrounds)
    if (hasOutline) {
      ctx.lineWidth = Math.max(3, fontSize * 0.2);
      ctx.strokeStyle = outlineColor;
      ctx.strokeText(line, cx, lineY);
    }

    ctx.fillStyle = textColor;
    ctx.fillText(line, cx, lineY);
  });

  ctx.restore();
}

/**
 * Calculates optimal font size to fit words into box
 */
function calculateOptimalFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxW: number,
  maxH: number,
  fontFamily: string,
  isBold: boolean,
  sizeMultiplier: number = 1.0
): number {
  let minSize = 9;
  let maxSize = Math.max(minSize, Math.min(maxH * 0.65, 48));

  // If text is very short (e.g. "NO!", "WAIT!"), allow larger punchy font
  const wordCount = text.trim().split(/\s+/).length;
  if (wordCount <= 2) {
    maxSize = Math.max(minSize, Math.min(maxH * 0.75, 60));
  }

  let bestSize = minSize;

  for (let s = maxSize; s >= minSize; s -= 1) {
    ctx.font = `${isBold ? 'bold' : 'normal'} ${s}px '${fontFamily}', sans-serif`;
    const lines = wrapTextLines(ctx, text, maxW);
    const totalH = lines.length * (s * 1.18);
    const longestLine = Math.max(...lines.map(l => ctx.measureText(l).width), 0);

    if (totalH <= maxH && longestLine <= maxW) {
      bestSize = s;
      break;
    }
  }

  return Math.max(8, Math.round(bestSize * sizeMultiplier));
}

/**
 * Breaks text into balanced lines for speech bubble shape
 */
function wrapTextLines(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];

  const lines: string[] = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const testLine = currentLine + ' ' + words[i];
    const testW = ctx.measureText(testLine).width;

    if (testW <= maxW) {
      currentLine = testLine;
    } else {
      lines.push(currentLine);
      currentLine = words[i];
    }
  }
  lines.push(currentLine);
  return lines;
}

/**
 * Selects fitting font family for bubble type
 */
function selectDefaultFont(block: TextBlock): ComicFontFamily {
  if (block.bubble_type === 'shout' || block.bubble_type === 'sfx') {
    return 'Bangers';
  }
  if (block.bubble_type === 'thought') {
    return 'Balsamiq Sans';
  }
  return 'Comic Neue';
}

/**
 * Overlays bounding boxes for inspection / selection
 */
function drawBoundingBoxesOnly(
  ctx: CanvasRenderingContext2D,
  blocks: TextBlock[],
  w: number,
  h: number,
  options: RenderOptions
) {
  ctx.save();

  blocks.forEach(block => {
    const [ymin, xmin, ymax, xmax] = block.box_2d;
    const boxX = (xmin / 1000) * w;
    const boxY = (ymin / 1000) * h;
    const boxW = ((xmax - xmin) / 1000) * w;
    const boxH = ((ymax - ymin) / 1000) * h;

    const isSelected = options.selectedBlockId === block.id;
    const isHovered = options.hoveredBlockId === block.id;

    ctx.lineWidth = isSelected ? 3 : isHovered ? 2.5 : 1.5;
    ctx.strokeStyle = isSelected
      ? '#3b82f6' // Bright blue
      : isHovered
      ? '#f59e0b' // Amber
      : 'rgba(99, 102, 241, 0.6)'; // Indigo translucent

    ctx.strokeRect(boxX, boxY, boxW, boxH);

    // Bubble badge with ID and type
    const badgeW = Math.min(boxW, 44);
    ctx.fillStyle = isSelected ? '#3b82f6' : isHovered ? '#f59e0b' : 'rgba(30, 41, 59, 0.85)';
    ctx.fillRect(boxX, boxY - 18, badgeW, 18);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`#${block.reading_order || block.id}`, boxX + badgeW / 2, boxY - 9);
  });

  ctx.restore();
}

/**
 * Helper: hex color to rgba string
 */
function hexToRgba(hex: string, alpha: number): string {
  if (!hex || typeof hex !== 'string') return `rgba(255, 255, 255, ${alpha})`;
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  if (clean.length !== 6) return `rgba(255, 255, 255, ${alpha})`;
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Helper: determines if a hex color is dark
 */
function isDarkColor(hex: string): boolean {
  if (!hex || typeof hex !== 'string') return true;
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  if (clean.length !== 6) return true;
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
}
