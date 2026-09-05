const sharp = require('sharp');
const fs = require('fs');

// Read constants.ts
const constantsCode = fs.readFileSync('src/lib/constants.ts', 'utf8');
const match = constantsCode.match(/export const TEMPLATES: PhotoboothTemplate\[\] = (\[[\s\S]*?\n\];)/);
let templates = [];
if (match) {
  const code = 'templates = ' + match[1].replace(/;$/, '');
  eval(code);
}

async function createSamplePhoto(w, h, label, r, g, b) {
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="rgb(${r},${g},${b})" />
        <stop offset="100%" stop-color="rgb(${Math.max(0,r-40)},${Math.max(0,g-40)},${Math.max(0,b-40)})" />
      </linearGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#g)" />
    <circle cx="${w/2}" cy="${h/2}" r="${Math.min(w,h)*0.35}" fill="rgba(255,255,255,0.85)" />
    <text x="${w/2}" y="${h/2}" font-family="Arial, sans-serif" font-size="${Math.round(Math.min(w,h)*0.16)}" font-weight="bold" fill="#1e293b" text-anchor="middle" dominant-baseline="middle">${label}</text>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function renderTemplateExact(templateId) {
  const template = templates.find(t => t.id === templateId);
  if (!template) {
    console.log('Template not found:', templateId);
    return;
  }
  const templatePath = 'public/images/template/' + template.imageSrc.split('/').pop();
  const meta = await sharp(templatePath).metadata();
  const { width, height } = meta;

  const bgImg = await sharp(templatePath).png().toBuffer();
  const composites = [];

  const colors = [
    [239, 68, 68], [249, 115, 22], [234, 179, 8], [34, 197, 94],
    [6, 182, 212], [59, 130, 246], [168, 85, 247], [236, 72, 153],
    [244, 63, 94], [20, 184, 166], [99, 102, 241], [139, 92, 246],
    [245, 158, 11], [16, 185, 129]
  ];

  for (let i = 0; i < template.slots.length; i++) {
    const slot = template.slots[i];
    const boxX = (slot.x / 100) * width;
    const boxY = (slot.y / 100) * height;
    const boxW = (slot.width / 100) * width;
    const boxH = (slot.height / 100) * height;
    const rot = slot.rotation || 0;
    const rad = slot.borderRadius ? (slot.borderRadius / 1000) * width : 2;

    const [r, g, b] = colors[i % colors.length];
    const rawPhoto = await createSamplePhoto(600, 600, `#${i+1} (${slot.label || ''})`, r, g, b);
    const cropped = await sharp(rawPhoto).resize(Math.round(boxW), Math.round(boxH), { fit: 'cover' }).png().toBuffer();
    const b64 = cropped.toString('base64');
    const cx = boxW / 2;
    const cy = boxH / 2;

    const rotTransform = rot ? `transform="rotate(${rot} ${boxX + cx} ${boxY + cy})"` : '';
    const slotSvg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <defs>
        <clipPath id="c${i}">
          <rect x="${boxX}" y="${boxY}" width="${boxW}" height="${boxH}" rx="${rad}" />
        </clipPath>
      </defs>
      <g ${rotTransform} clip-path="url(#c${i})">
        <image xlink:href="data:image/png;base64,${b64}" x="${boxX}" y="${boxY}" width="${boxW}" height="${boxH}" preserveAspectRatio="xMidYMid slice" />
      </g>
    </svg>`;
    composites.push({ input: Buffer.from(slotSvg), top: 0, left: 0 });
  }

  const result = await sharp(bgImg).composite(composites).png().toBuffer();
  const outPath = `scratch/final_verified_${templateId}.png`;
  fs.writeFileSync(outPath, result);
  console.log(`Saved ${template.name} (${templateId}) -> ${outPath}`);
}

async function main() {
  await renderTemplateExact('template-16');
  await renderTemplateExact('template-17');
  await renderTemplateExact('template-25');
  await renderTemplateExact('template-26');
  await renderTemplateExact('template-27');
}
main();
