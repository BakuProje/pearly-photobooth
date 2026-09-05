const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Extract TEMPLATES directly from constants.ts
const constantsCode = fs.readFileSync('src/lib/constants.ts', 'utf8');

// Parse TEMPLATES array using simple eval in sandbox
const match = constantsCode.match(/export const TEMPLATES: PhotoboothTemplate\[\] = (\[[\s\S]*?\n\];)/);
let templates = [];
if (match) {
  const code = 'templates = ' + match[1].replace(/;$/, '');
  eval(code);
}

console.log(`Parsed ${templates.length} templates from constants.ts`);

async function renderSim(tId) {
  const t = templates.find(item => item.id === tId);
  if (!t) {
    console.log(`Template ${tId} not found`);
    return;
  }

  const templatePath = path.join('public/images/template', path.basename(t.imageSrc));
  const meta = await sharp(templatePath).metadata();
  const width = meta.width;
  const height = meta.height;

  let svgOverlays = '';
  for (let i = 0; i < t.slots.length; i++) {
    const slot = t.slots[i];
    const boxX = (slot.x / 100) * width;
    const boxY = (slot.y / 100) * height;
    const boxW = (slot.width / 100) * width;
    const boxH = (slot.height / 100) * height;
    const rot = slot.rotation || 0;
    const rad = slot.borderRadius || 4;

    const cx = boxX + boxW / 2;
    const cy = boxY + boxH / 2;
    const rotAttr = rot ? `transform="rotate(${rot} ${cx} ${cy})"` : '';
    
    const colors = ['#f43f5e', '#8b5cf6', '#06b6d4', '#f59e0b', '#ec4899', '#3b82f6', '#10b981', '#6366f1', '#14b8a6', '#d946ef', '#f97316', '#84cc16', '#a855f7', '#0ea5e9'];
    const col = colors[i % colors.length];

    svgOverlays += `<g ${rotAttr}>
      <rect x="${boxX}" y="${boxY}" width="${boxW}" height="${boxH}" rx="${rad}" fill="${col}" fill-opacity="0.88" stroke="#ffffff" stroke-width="2" />
      <text x="${cx}" y="${cy}" font-size="${Math.max(16, Math.round(Math.min(boxW, boxH)*0.22))}" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">#${i+1}</text>
    </g>`;
  }

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${svgOverlays}</svg>`;
  const rendered = await sharp(templatePath)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toBuffer();

  const outPath = `scratch/sim_${tId}.png`;
  fs.writeFileSync(outPath, rendered);
  console.log(`Saved ${t.name} sim to ${outPath}`);
}

async function run() {
  await renderSim('template-16');
  await renderSim('template-17');
  await renderSim('template-25');
  await renderSim('template-26');
  await renderSim('template-27');
}

run();
