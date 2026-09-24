// Generates realistic Korean manhwa / comic panels for immediate one-click testing

export interface SamplePanelInfo {
  id: string;
  title: string;
  genre: string;
  description: string;
  previewColor: string;
  generateDataUrl: () => string;
}

export const samplePanels: SamplePanelInfo[] = [
  {
    id: 'action-manhwa',
    title: "The Awakened Blade",
    genre: "Action / Fantasy Webtoon",
    description: "High-stakes battle with energy aura, shout bubble, inner monologue, and dramatic SFX.",
    previewColor: "from-blue-600 to-indigo-900",
    generateDataUrl: () => generateActionManhwaPanel(),
  },
  {
    id: 'romance-webtoon',
    title: "Sunset on the Rooftop",
    genre: "Romance / Drama Manhwa",
    description: "Heartfelt school rooftop confession with soft sky gradient, speech bubble, and narration box.",
    previewColor: "from-rose-500 to-amber-600",
    generateDataUrl: () => generateRomanceWebtoonPanel(),
  },
  {
    id: 'comedy-slice',
    title: "Deadline Mayhem",
    genre: "Comedy / Slice of Life",
    description: "Office panic scene with frantic speedlines, exclamation bubble, and deadline narration.",
    previewColor: "from-amber-500 to-red-600",
    generateDataUrl: () => generateComedySlicePanel(),
  },
];

function generateActionManhwaPanel(): string {
  const width = 800;
  const height = 1100;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background - dark dramatic night / dungeon with magical purple/cyan aura
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#0a0d1a');
  bgGrad.addColorStop(0.5, '#12182e');
  bgGrad.addColorStop(1, '#05070e');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Energy aura / slash lines
  ctx.save();
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.moveTo(100 + i * 80, height * 0.7);
    ctx.quadraticCurveTo(width * 0.5, height * 0.4, 400 + i * 50, 100);
    ctx.stroke();
  }

  // Radial shockwave
  const radial = ctx.createRadialGradient(width * 0.5, height * 0.55, 20, width * 0.5, height * 0.55, 350);
  radial.addColorStop(0, 'rgba(168, 85, 247, 0.6)');
  radial.addColorStop(0.4, 'rgba(59, 130, 246, 0.25)');
  radial.addColorStop(1, 'transparent');
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  // Character Silhouette / Hero with glowing eyes
  ctx.save();
  ctx.fillStyle = '#090b14';
  // Head and torso silhouette
  ctx.beginPath();
  ctx.ellipse(width * 0.5, height * 0.58, 120, 150, 0, 0, Math.PI * 2);
  ctx.fill();

  // Shoulders and coat
  ctx.beginPath();
  ctx.moveTo(width * 0.25, height * 0.9);
  ctx.lineTo(width * 0.38, height * 0.62);
  ctx.lineTo(width * 0.62, height * 0.62);
  ctx.lineTo(width * 0.75, height * 0.9);
  ctx.lineTo(width * 0.85, height);
  ctx.lineTo(width * 0.15, height);
  ctx.closePath();
  ctx.fill();

  // Glowing cyan eyes
  ctx.fillStyle = '#38bdf8';
  ctx.shadowColor = '#38bdf8';
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.ellipse(width * 0.46, height * 0.55, 8, 4, -0.2, 0, Math.PI * 2);
  ctx.ellipse(width * 0.54, height * 0.55, 8, 4, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Panel borders (standard Webtoon panel border)
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, width - 8, height - 8);

  // 1. Narration Box (Top Left)
  drawBox(ctx, 40, 40, 280, 75, '#111827', '#374151', 4);
  drawText(ctx, "검을 쥔 손에 전율이 흘렀다.", 180, 82, 16, '#e2e8f0', 'bold', 'Noto Sans KR');

  // 2. Thought Bubble (Top Right)
  drawThoughtBubble(ctx, 560, 160, 180, 100, '#ffffff', '#000000');
  drawText(ctx, "놈의 마력이...", 560, 195, 17, '#111827', 'bold', 'Noto Sans KR');
  drawText(ctx, "상상을 뛰어넘어!", 560, 225, 17, '#111827', 'bold', 'Noto Sans KR');

  // 3. Huge SFX across panel (콰아아앙!!)
  drawSfx(ctx, "콰아아앙-!!", width * 0.5, height * 0.42, 64, '#f59e0b', '#000000');

  // 4. Dramatic Spiky Shout Bubble (Bottom Center-Right)
  drawShoutBubble(ctx, 420, 760, 290, 140, '#ffffff', '#000000');
  drawText(ctx, "물러서지 마라!", 565, 815, 23, '#dc2626', '900', 'Noto Sans KR');
  drawText(ctx, "여기서 끝장을 낸다!!", 565, 855, 21, '#111827', 'bold', 'Noto Sans KR');

  // 5. Normal Speech Bubble (Bottom Left)
  drawSpeechBubble(ctx, 60, 730, 240, 110, '#ffffff', '#000000', 'bottom-right');
  drawText(ctx, "모두 내 뒤로 숨어!", 180, 775, 19, '#000000', 'bold', 'Noto Sans KR');
  drawText(ctx, "내가 길을 열겠어!", 180, 810, 19, '#000000', 'bold', 'Noto Sans KR');

  return canvas.toDataURL('image/png');
}

function generateRomanceWebtoonPanel(): string {
  const width = 800;
  const height = 1100;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background - warm sunset rooftop
  const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
  skyGrad.addColorStop(0, '#fdba74'); // Warm golden amber
  skyGrad.addColorStop(0.35, '#f472b6'); // Soft blush pink
  skyGrad.addColorStop(0.7, '#818cf8'); // Lilac purple
  skyGrad.addColorStop(1, '#312e81'); // Deep evening indigo
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height);

  // Sunset Sun
  const sunGrad = ctx.createRadialGradient(width * 0.7, height * 0.35, 10, width * 0.7, height * 0.35, 160);
  sunGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
  sunGrad.addColorStop(0.3, 'rgba(254, 240, 138, 0.6)');
  sunGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(width * 0.7, height * 0.35, 160, 0, Math.PI * 2);
  ctx.fill();

  // Distant city buildings silhouette
  ctx.fillStyle = '#1e1b4b';
  for (let i = 0; i < 12; i++) {
    const bW = 50 + (i % 3) * 25;
    const bH = 160 + (i % 4) * 40;
    ctx.fillRect(i * 65, height * 0.55 - bH + 100, bW, bH);
  }

  // Rooftop wire fence & railing
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1.5;
  for (let x = 0; x < width; x += 30) {
    ctx.beginPath();
    ctx.moveTo(x, height * 0.55);
    ctx.lineTo(x, height * 0.75);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(0, height * 0.6);
  ctx.lineTo(width, height * 0.6);
  ctx.moveTo(0, height * 0.7);
  ctx.lineTo(width, height * 0.7);
  ctx.stroke();

  // Two characters silhouette on rooftop
  ctx.fillStyle = '#0f172a';
  // Character 1 (Left)
  ctx.beginPath();
  ctx.ellipse(width * 0.38, height * 0.68, 45, 55, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(width * 0.32, height * 0.72, 110, 200);

  // Character 2 (Right)
  ctx.beginPath();
  ctx.ellipse(width * 0.62, height * 0.68, 42, 52, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(width * 0.56, height * 0.72, 110, 200);

  // Light petals / sparkles in air
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  for (let i = 0; i < 20; i++) {
    ctx.beginPath();
    ctx.arc(60 + (i * 38) % (width - 100), 100 + (i * 47) % (height * 0.5), 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Panel borders
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 6;
  ctx.strokeRect(4, 4, width - 8, height - 8);

  // 1. Narration Box (Top Center)
  drawBox(ctx, width * 0.5 - 210, 50, 420, 75, '#ffffff', '#cbd5e1', 6);
  drawText(ctx, "붉게 물든 하늘 아래, 심장이 요동쳤다.", width * 0.5, 93, 18, '#334155', 'bold', 'Noto Sans KR');

  // 2. Speech Bubble (Left character)
  drawSpeechBubble(ctx, 60, 230, 280, 130, '#ffffff', '#000000', 'bottom-right');
  drawText(ctx, "선배, 오늘 꼭 하고 싶은", 200, 280, 19, '#0f172a', 'bold', 'Noto Sans KR');
  drawText(ctx, "이야기가 있었어요...", 200, 318, 19, '#0f172a', 'bold', 'Noto Sans KR');

  // 3. Heart flutter SFX (두근... 두근...)
  drawSfx(ctx, "두근... 두근...", width * 0.5, height * 0.44, 38, '#fb7185', '#ffffff');

  // 4. Speech Bubble (Right character)
  drawSpeechBubble(ctx, 450, 260, 290, 140, '#ffffff', '#000000', 'bottom-left');
  drawText(ctx, "더 이상 나를 피하지 마.", 595, 315, 20, '#0f172a', 'bold', 'Noto Sans KR');
  drawText(ctx, "진심을 듣고 싶어.", 595, 355, 20, '#0f172a', 'bold', 'Noto Sans KR');

  // 5. Thought Cloud (Bottom)
  drawThoughtBubble(ctx, width * 0.5, 870, 340, 130, '#ffffff', '#000000');
  drawText(ctx, "시간이 이대로 멈춰버렸으면...", width * 0.5, 925, 19, '#475569', 'bold', 'Noto Sans KR');

  return canvas.toDataURL('image/png');
}

function generateComedySlicePanel(): string {
  const width = 800;
  const height = 1100;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background - frantic comic yellow with dynamic speedlines
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(0, 0, width, height);

  // Speedlines bursting from center
  ctx.save();
  ctx.fillStyle = 'rgba(234, 88, 12, 0.15)';
  const cx = width * 0.5;
  const cy = height * 0.52;
  const totalRays = 36;
  for (let i = 0; i < totalRays; i++) {
    const angle1 = (i * 2 * Math.PI) / totalRays;
    const angle2 = angle1 + 0.05;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle1) * 900, cy + Math.sin(angle1) * 900);
    ctx.lineTo(cx + Math.cos(angle2) * 900, cy + Math.sin(angle2) * 900);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Cartoon Computer Desk & Monitor
  ctx.fillStyle = '#334155';
  ctx.fillRect(width * 0.25, height * 0.62, width * 0.5, 20); // Desk surface
  // Blue screen of death on monitor
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(width * 0.32, height * 0.44, 280, 170); // Monitor frame
  ctx.fillStyle = '#2563eb';
  ctx.fillRect(width * 0.34, height * 0.46, 250, 130); // Screen
  // Sad smiley :(
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px monospace';
  ctx.fillText(':( ERROR', width * 0.4, height * 0.53);

  // Cartoon panic silhouette clutching head
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.ellipse(width * 0.5, height * 0.72, 70, 75, 0, 0, Math.PI * 2);
  ctx.fill();
  // Hands clutching head
  ctx.beginPath();
  ctx.ellipse(width * 0.4, height * 0.68, 25, 40, -0.6, 0, Math.PI * 2);
  ctx.ellipse(width * 0.6, height * 0.68, 25, 40, 0.6, 0, Math.PI * 2);
  ctx.fill();

  // Panel borders
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, width - 8, height - 8);

  // 1. Narration Box (Top Left: Time stamp)
  drawBox(ctx, 40, 40, 240, 65, '#ef4444', '#b91c1c', 4);
  drawText(ctx, "【마감 10분 전】", 160, 80, 20, '#ffffff', 'bold', 'Noto Sans KR');

  // 2. Huge Scream Bubble (Top Right)
  drawShoutBubble(ctx, 330, 80, 420, 220, '#ffffff', '#000000');
  drawText(ctx, "거짓말이지?!", 540, 155, 32, '#dc2626', '900', 'Noto Sans KR');
  drawText(ctx, "저장 안 눌렀단 말이야아악!", 540, 215, 23, '#000000', 'bold', 'Noto Sans KR');
  drawText(ctx, "지금 꺼지면 어떡해?!!", 540, 255, 21, '#000000', 'bold', 'Noto Sans KR');

  // 3. Panic SFX (덜덜덜...)
  drawSfx(ctx, "덜덜덜덜...", width * 0.5, height * 0.38, 46, '#ef4444', '#000000');

  // 4. Normal Speech Bubble (Coworker coming in from left)
  drawSpeechBubble(ctx, 50, 760, 310, 140, '#ffffff', '#000000', 'top-right');
  drawText(ctx, "김대리님, 부장님이", 205, 815, 21, '#000000', 'bold', 'Noto Sans KR');
  drawText(ctx, "원고 다 됐냐고 찾으시는데...", 205, 855, 19, '#000000', 'bold', 'Noto Sans KR');

  // 5. Tiny Muttering / Soul floating out
  drawSpeechBubble(ctx, 460, 800, 280, 110, '#f1f5f9', '#64748b', 'bottom-left');
  drawText(ctx, "...저 먼저 퇴사하겠습니다...", 600, 860, 18, '#64748b', 'italic', 'Noto Sans KR');

  return canvas.toDataURL('image/png');
}

// Helper drawing utilities
function drawBox(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, bg: string, border: string, r: number) {
  ctx.save();
  ctx.fillStyle = bg;
  ctx.strokeStyle = border;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawSpeechBubble(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  bg: string,
  border: string,
  tail: 'bottom-right' | 'bottom-left' | 'top-right'
) {
  ctx.save();
  ctx.fillStyle = bg;
  ctx.strokeStyle = border;
  ctx.lineWidth = 3.5;

  const cx = x + w / 2;
  const cy = y + h / 2;
  const rx = w / 2;
  const ry = h / 2;

  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);

  // Tail
  if (tail === 'bottom-right') {
    ctx.moveTo(cx + rx * 0.4, cy + ry * 0.7);
    ctx.lineTo(cx + rx * 0.7, cy + ry + 35);
    ctx.lineTo(cx + rx * 0.1, cy + ry * 0.85);
  } else if (tail === 'bottom-left') {
    ctx.moveTo(cx - rx * 0.4, cy + ry * 0.7);
    ctx.lineTo(cx - rx * 0.7, cy + ry + 35);
    ctx.lineTo(cx - rx * 0.1, cy + ry * 0.85);
  } else if (tail === 'top-right') {
    ctx.moveTo(cx + rx * 0.4, cy - ry * 0.7);
    ctx.lineTo(cx + rx * 0.8, cy - ry - 30);
    ctx.lineTo(cx + rx * 0.15, cy - ry * 0.85);
  }

  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawThoughtBubble(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  w: number,
  h: number,
  bg: string,
  border: string
) {
  ctx.save();
  ctx.fillStyle = bg;
  ctx.strokeStyle = border;
  ctx.lineWidth = 3;

  const rx = w / 2;
  const ry = h / 2;

  // Cloud circles
  const numPuffs = 8;
  ctx.beginPath();
  for (let i = 0; i < numPuffs; i++) {
    const angle = (i * 2 * Math.PI) / numPuffs;
    const px = cx + Math.cos(angle) * (rx * 0.8);
    const py = cy + Math.sin(angle) * (ry * 0.8);
    ctx.arc(px, py, 26, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.stroke();

  // Thought dots leading down
  ctx.beginPath();
  ctx.arc(cx - 30, cy + ry + 20, 10, 0, Math.PI * 2);
  ctx.arc(cx - 45, cy + ry + 40, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

function drawShoutBubble(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  bg: string,
  border: string
) {
  ctx.save();
  ctx.fillStyle = bg;
  ctx.strokeStyle = border;
  ctx.lineWidth = 4;

  const cx = x + w / 2;
  const cy = y + h / 2;
  const rx = w / 2;
  const ry = h / 2;
  const points = 16;

  ctx.beginPath();
  for (let i = 0; i <= points; i++) {
    const angle = (i * 2 * Math.PI) / points;
    const isOuter = i % 2 === 0;
    const currentRx = isOuter ? rx * 1.08 : rx * 0.82;
    const currentRy = isOuter ? ry * 1.12 : ry * 0.82;
    const px = cx + Math.cos(angle) * currentRx;
    const py = cy + Math.sin(angle) * currentRy;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawSfx(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  fill: string,
  stroke: string
) {
  ctx.save();
  ctx.font = `900 ${fontSize}px 'Noto Sans KR', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 10;
  ctx.strokeStyle = stroke;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  color: string,
  weight: string,
  fontFamily: string
) {
  ctx.save();
  ctx.font = `${weight} ${size}px '${fontFamily}', sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.restore();
}
