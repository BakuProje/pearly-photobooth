import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

interface RawSlot {
  box_2d?: [number, number, number, number];
  ymin?: number;
  xmin?: number;
  ymax?: number;
  xmax?: number;
  centerX?: number;
  centerY?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
}

interface FormattedSlot {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  borderRadius: number;
  label: string;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 !== 0 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/**
 * Geometric Regularization Engine for Photobooth Slots
 * Guarantees that photo slots fit cleanly into template frames without jitter or misaligned borders.
 */
function regularizeSlots(
  rawSlots: RawSlot[],
  layoutType?: string,
  isTilted?: boolean,
  globalRotation?: number
): FormattedSlot[] {
  if (!rawSlots || rawSlots.length === 0) return [];

  // 1. Standardize raw inputs into percentage bounds (0-100%)
  const normalized = rawSlots.map((s, idx) => {
    let x = 10;
    let y = 10;
    let width = 75;
    let height = 20;
    let rotation = globalRotation || 0;

    if (Array.isArray(s.box_2d) && s.box_2d.length === 4) {
      const [ymin, xmin, ymax, xmax] = s.box_2d;
      x = xmin / 10;
      y = ymin / 10;
      width = (xmax - xmin) / 10;
      height = (ymax - ymin) / 10;
    } else if (s.ymin !== undefined && s.xmin !== undefined && s.ymax !== undefined && s.xmax !== undefined) {
      x = s.xmin > 1 ? s.xmin / 10 : s.xmin * 100;
      y = s.ymin > 1 ? s.ymin / 10 : s.ymin * 100;
      width = (s.xmax - s.xmin) > 1 ? (s.xmax - s.xmin) / 10 : (s.xmax - s.xmin) * 100;
      height = (s.ymax - s.ymin) > 1 ? (s.ymax - s.ymin) / 10 : (s.ymax - s.ymin) * 100;
    } else if (s.centerX !== undefined && s.centerY !== undefined) {
      width = Number(s.width) || 75;
      height = Number(s.height) || 20;
      x = Number(s.centerX) - width / 2;
      y = Number(s.centerY) - height / 2;
    } else if (s.x !== undefined && s.y !== undefined) {
      x = Number(s.x);
      y = Number(s.y);
      width = Number(s.width) || 75;
      height = Number(s.height) || 20;
    }

    if (s.rotation !== undefined && !isNaN(Number(s.rotation))) {
      rotation = Number(s.rotation);
    }

    return {
      x: Math.max(0, Math.min(95, x)),
      y: Math.max(0, Math.min(95, y)),
      width: Math.max(4, Math.min(100, width)),
      height: Math.max(4, Math.min(100, height)),
      rotation: isTilted ? rotation : 0,
      centerX: x + width / 2,
      centerY: y + height / 2,
      originalIndex: idx,
    };
  });

  const count = normalized.length;
  if (count === 1) {
    const s = normalized[0];
    return [
      {
        x: Number(s.x.toFixed(1)),
        y: Number(s.y.toFixed(1)),
        width: Number(s.width.toFixed(1)),
        height: Number(s.height.toFixed(1)),
        rotation: Number(s.rotation.toFixed(1)),
        borderRadius: 4,
        label: 'Foto #1',
      },
    ];
  }

  // Sort top-to-bottom
  const sorted = [...normalized].sort((a, b) => a.centerY - b.centerY);

  // Check if 2-Column Grid or Twin Strip (e.g. 2x2, 2x3, 2x4)
  const xCenters = sorted.map((s) => s.centerX);
  const minX = Math.min(...xCenters);
  const maxX = Math.max(...xCenters);
  const xSpan = maxX - minX;

  const isTwoColumn =
    (layoutType && layoutType.startsWith('grid_2')) ||
    (xSpan > 20 && count >= 4 && count % 2 === 0);

  if (isTwoColumn && !isTilted) {
    const midX = (minX + maxX) / 2;
    const leftCols = sorted.filter((s) => s.centerX < midX).sort((a, b) => a.centerY - b.centerY);
    const rightCols = sorted.filter((s) => s.centerX >= midX).sort((a, b) => a.centerY - b.centerY);

    if (leftCols.length === rightCols.length && leftCols.length >= 2) {
      const medianLeftX = median(leftCols.map((s) => s.x));
      const medianLeftW = median(leftCols.map((s) => s.width));
      const medianLeftH = median(leftCols.map((s) => s.height));

      const medianRightX = median(rightCols.map((s) => s.x));
      const medianRightW = median(rightCols.map((s) => s.width));
      const medianRightH = median(rightCols.map((s) => s.height));

      const rowsCount = leftCols.length;
      const result: FormattedSlot[] = [];

      for (let r = 0; r < rowsCount; r++) {
        const leftY = leftCols[r].y;
        const rightY = rightCols[r].y;
        const avgY = (leftY + rightY) / 2;
        const avgH = (medianLeftH + medianRightH) / 2;

        // Left photo
        result.push({
          x: Number(medianLeftX.toFixed(1)),
          y: Number(avgY.toFixed(1)),
          width: Number(medianLeftW.toFixed(1)),
          height: Number(avgH.toFixed(1)),
          rotation: 0,
          borderRadius: 4,
          label: `Foto #${r * 2 + 1}`,
        });

        // Right photo
        result.push({
          x: Number(medianRightX.toFixed(1)),
          y: Number(avgY.toFixed(1)),
          width: Number(medianRightW.toFixed(1)),
          height: Number(avgH.toFixed(1)),
          rotation: 0,
          borderRadius: 4,
          label: `Foto #${r * 2 + 2}`,
        });
      }

      return result;
    }
  }

  // Check if Single-Column Vertical Strip (Stacked 1xN)
  if (!isTilted && xSpan < 15) {
    const medianX = median(sorted.map((s) => s.x));
    const medianW = median(sorted.map((s) => s.width));
    const medianH = median(sorted.map((s) => s.height));

    return sorted.map((s, idx) => ({
      x: Number(medianX.toFixed(1)),
      y: Number(s.y.toFixed(1)),
      width: Number(medianW.toFixed(1)),
      height: Number(medianH.toFixed(1)),
      rotation: 0,
      borderRadius: 4,
      label: `Foto #${idx + 1}`,
    }));
  }

  // Tilted Diagonal Strip or Custom Layout
  return sorted.map((s, idx) => ({
    x: Number(s.x.toFixed(1)),
    y: Number(s.y.toFixed(1)),
    width: Number(s.width.toFixed(1)),
    height: Number(s.height.toFixed(1)),
    rotation: Number(s.rotation.toFixed(1)),
    borderRadius: 4,
    label: `Foto #${idx + 1}`,
  }));
}

export async function POST(req: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured in .env' },
        { status: 500 }
      );
    }

    const { imageBase64, mimeType = 'image/jpeg' } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'Missing imageBase64' }, { status: 400 });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');

    const prompt = `You are an expert computer vision AI specialized in photobooth templates (Korean photostrips, polaroids, Canva templates, twin strips, grids).
Analyze this photobooth template image and detect all photo placeholder frames (where user photos should be placed).

DETECTION RULES:
1. Target areas:
   - Canva placeholder frames (containing blue sky, white clouds, green hills).
   - Transparent cutouts / empty photo boxes.
   - Solid color photo placeholder rectangles.
   - Polaroid photo frames.
   - Photostrip frame boxes (vertical strips, 2-column twin strips, grids, or diagonal tilted strips).

2. Rotation & Orientation:
   - For all upright templates (vertical photostrips, 2x2 / 2x3 grids, twin strips, upright polaroids): "isTilted" must be false, "rotationAngle" must be 0, and slot "rotation" must be 0.
   - For diagonal/tilted photostrips running at an angle: "isTilted" is true, "rotationAngle" is the clockwise angle (e.g. 34.5 or -34.5).

3. Coordinates:
   - "box_2d": [ymin, xmin, ymax, xmax] as integers normalized from 0 to 1000.
   - Fit snugly inside the borders of each photo frame.

Return ONLY valid JSON matching this exact structure:
{
  "layoutType": "vertical_strip" | "grid_2x2" | "grid_2x3" | "grid_2x4" | "diagonal_strip" | "single_polaroid" | "custom",
  "isTilted": false,
  "rotationAngle": 0,
  "slots": [
    {
      "box_2d": [100, 150, 300, 850],
      "rotation": 0
    }
  ]
}`;

    const modelsToTry = [
      'gemini-3-flash-preview',
      'gemini-3.1-flash-lite',
      'gemini-flash-lite-latest',
      'gemini-3.5-flash-lite',
      'gemini-flash-latest',
      'gemini-3.7-flash',
    ];

    let geminiResponseData: any = null;

    for (const model of modelsToTry) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: prompt },
                    {
                      inlineData: {
                        mimeType,
                        data: cleanBase64,
                      },
                    },
                  ],
                },
              ],
              generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.0,
              },
            }),
          }
        );

        if (res.ok) {
          const json = await res.json();
          if (json.candidates?.[0]?.content?.parts?.[0]?.text) {
            geminiResponseData = json;
            break;
          }
        }
      } catch (e) {
        console.warn(`Model ${model} failed, trying next`, e);
      }
    }

    if (geminiResponseData) {
      const rawText = geminiResponseData.candidates[0].content.parts[0].text;
      const parsed = JSON.parse(rawText);

      if (Array.isArray(parsed.slots) && parsed.slots.length > 0) {
        const formattedSlots = regularizeSlots(
          parsed.slots,
          parsed.layoutType,
          Boolean(parsed.isTilted),
          Number(parsed.rotationAngle) || 0
        );

        return NextResponse.json({
          success: true,
          source: 'gemini-ai',
          slots: formattedSlots,
          detectedCount: formattedSlots.length,
          layoutType: parsed.layoutType || 'custom',
        });
      }
    }

    return NextResponse.json({ success: false, message: 'AI returned empty slots' });
  } catch (err: any) {
    console.error('Error in detect-slots API:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
