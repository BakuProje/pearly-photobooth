import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

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

    // Clean base64 string if it contains data URI header
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');

    const prompt = `You are an expert computer vision AI for a photobooth application (Korean photobooth style).
Analyze this photobooth template image and detect all photo placeholder frames (Canva clouds & green hill placeholders, transparent cutouts, polaroid frames, photo boxes, straight or tilted photostrips).

CRITICAL ROTATION & GEOMETRY INSTRUCTIONS:
1. PHOTO ROTATION ANGLE ("rotation"):
   - Straight Upright / Vertical Photostrips (stacked top-to-bottom, e.g. 4-cut vertical strip, 3-cut vertical strip, polaroid frames, or grid layout):
     Strictly set "rotation": 0.
   - Diagonal / Tilted photostrip running from bottom-left up to top-right:
     The top horizontal edge of each photo frame slopes downwards to the right at around +30.0 to +42.0 degrees clockwise.
     Set "rotation": 34.5 (or the exact measured clockwise angle of the top edge).
   - Diagonal / Tilted photostrip running from top-left down to bottom-right:
     Set "rotation": -34.5 (or the measured counter-clockwise angle).

2. PHOTO SLOT BOUNDS ("centerX", "centerY" or "x", "y", "width", "height"):
   - Return the EXACT bounding box / center (in percentage 0-100 of image width & height) of each individual photo box.
   - For Canva placeholder frames (with blue sky, white cloud, and green hill graphic inside):
     The slot is the entire rectangular/square box containing the sky+hill placeholder. Fit the bounding box snugly to the frame borders.
   - For vertical photostrip templates with decorative left/right borders (e.g. denim, stripes, textures) and bottom text/logos:
     Detect the central photo boxes between the side borders and above the bottom logo/text.
   - Order slots strictly from top to bottom (Slot 1 at top to Slot N at bottom).

3. UNROTATED SLOT DIMENSIONS ("width", "height"):
   - "width": unrotated width of the photo slot along its top edge (in % 0-100 of image width).
   - "height": unrotated height of the photo slot along its side edge (in % 0-100 of image height).
   - Make sure width and height fit snugly inside the frame without overflowing the borders or margins.

Respond ONLY with valid JSON in this exact structure:
{
  "slots": [
    {
      "centerX": 50.0,
      "centerY": 22.5,
      "width": 78.0,
      "height": 18.5,
      "rotation": 0
    }
  ],
  "detectedCount": 4
}`;

    const modelsToTry = ['gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-flash-latest', 'gemini-3-flash-preview'];
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
        // Calculate strip geometry if multiple slots exist
        let stripRotation: number | null = null;

        if (parsed.slots.length >= 2) {
          const first = parsed.slots[0];
          const last = parsed.slots[parsed.slots.length - 1];
          const firstCX = Number(first.centerX ?? (first.x !== undefined ? first.x + (first.width || 20) / 2 : 50));
          const firstCY = Number(first.centerY ?? (first.y !== undefined ? first.y + (first.height || 15) / 2 : 20));
          const lastCX = Number(last.centerX ?? (last.x !== undefined ? last.x + (last.width || 20) / 2 : 50));
          const lastCY = Number(last.centerY ?? (last.y !== undefined ? last.y + (last.height || 15) / 2 : 80));

          const dx = lastCX - firstCX;
          const dy = lastCY - firstCY;

          // Only compute diagonal rotation if there is substantial horizontal displacement relative to vertical displacement
          if (Math.abs(dy) > 10 && Math.abs(dx) / Math.abs(dy) >= 0.35) {
            const stripTheta = (Math.atan2(dy, dx) * 180.0) / Math.PI;
            let perpRot = stripTheta - 90.0;
            while (perpRot > 180) perpRot -= 360;
            while (perpRot < -180) perpRot += 360;
            stripRotation = Number(perpRot.toFixed(1));
          } else if (Math.abs(dx) / Math.max(1, Math.abs(dy)) < 0.25) {
            // Straight vertical strip: strictly force 0 rotation
            stripRotation = 0;
          }
        }

        const formattedSlots = parsed.slots.map((s: any, idx: number) => {
          const width = Math.max(5, Math.min(100, Number(s.width) || 75));
          const height = Math.max(5, Math.min(100, Number(s.height) || 18));
          const rotation = stripRotation !== null ? stripRotation : Number(s.rotation) || 0;

          let x = 10;
          let y = 10;

          if (s.centerX !== undefined && !isNaN(Number(s.centerX))) {
            x = Math.max(0, Math.min(100, Number(s.centerX) - width / 2));
          } else if (s.x !== undefined && !isNaN(Number(s.x))) {
            x = Math.max(0, Math.min(100, Number(s.x)));
          }

          if (s.centerY !== undefined && !isNaN(Number(s.centerY))) {
            y = Math.max(0, Math.min(100, Number(s.centerY) - height / 2));
          } else if (s.y !== undefined && !isNaN(Number(s.y))) {
            y = Math.max(0, Math.min(100, Number(s.y)));
          }

          return {
            x: Number(x.toFixed(1)),
            y: Number(y.toFixed(1)),
            width: Number(width.toFixed(1)),
            height: Number(height.toFixed(1)),
            rotation: Number(rotation.toFixed(1)),
            borderRadius: 4,
            label: `Foto #${idx + 1}`,
          };
        });

        return NextResponse.json({
          success: true,
          source: 'gemini-ai',
          slots: formattedSlots,
          detectedCount: formattedSlots.length,
        });
      }
    }

    return NextResponse.json({ success: false, message: 'AI returned empty slots' });
  } catch (err: any) {
    console.error('Error in detect-slots API:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

