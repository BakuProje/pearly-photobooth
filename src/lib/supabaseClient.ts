import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SoftFileSession } from './types';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nkrssfzqslowcayknuut.supabase.co';
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_ll1QP8sP2mIvuZENVeZYvw_a3WFA5qh';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

// Storage bucket name in Supabase
const BUCKET_NAME = 'photobooth';
const TABLE_NAME = 'soft_file_sessions';

// Helper to convert base64 data URL to Blob
function base64ToBlob(base64Data: string): { blob: Blob; contentType: string } {
  const parts = base64Data.split(';base64,');
  const contentType = parts[0].split(':')[1] || 'image/png';
  const raw = atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return {
    blob: new Blob([uInt8Array], { type: contentType }),
    contentType,
  };
}

// Upload a single base64 image to Supabase Storage and return public URL
export async function uploadImageToSupabase(
  base64Data: string,
  pathName: string
): Promise<string> {
  if (!base64Data || !base64Data.startsWith('data:')) {
    return base64Data; // Already a remote URL
  }

  try {
    const { blob, contentType } = base64ToBlob(base64Data);
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(pathName, blob, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.warn(`Supabase Storage upload warning for ${pathName}:`, error.message);
      return base64Data; // fallback to base64 if bucket upload is not configured
    }

    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(pathName);

    return publicUrlData?.publicUrl || base64Data;
  } catch (err) {
    console.warn(`Supabase Storage upload error:`, err);
    return base64Data;
  }
}

// Save complete soft file session to Supabase
export async function saveSessionToSupabase(session: SoftFileSession): Promise<void> {
  try {
    let photostripRemoteUrl = session.photostripUrl;
    let gifRemoteUrl = session.gifUrl;
    const remotePhotos: string[] = [];

    // 1. Upload photostrip to Supabase Storage
    if (session.photostripUrl && session.photostripUrl.startsWith('data:')) {
      photostripRemoteUrl = await uploadImageToSupabase(
        session.photostripUrl,
        `sessions/${session.id}/photostrip.png`
      );
    }

    // 2. Upload gif to Supabase Storage
    if (session.gifUrl && session.gifUrl.startsWith('data:')) {
      gifRemoteUrl = await uploadImageToSupabase(
        session.gifUrl,
        `sessions/${session.id}/moment.gif`
      );
    }

    // 3. Upload individual photos to Supabase Storage
    for (let i = 0; i < (session.photos || []).length; i++) {
      const p = session.photos[i];
      if (p && p.startsWith('data:')) {
        const url = await uploadImageToSupabase(
          p,
          `sessions/${session.id}/photo_${i + 1}.jpg`
        );
        remotePhotos.push(url);
      } else {
        remotePhotos.push(p);
      }
    }

    const payloadToSave: SoftFileSession = {
      ...session,
      photostripUrl: photostripRemoteUrl,
      gifUrl: gifRemoteUrl,
      photos: remotePhotos,
    };

    // 4. Save session JSON to Supabase Storage (guarantees public availability without DB schema setup)
    try {
      const jsonBlob = new Blob([JSON.stringify(payloadToSave)], {
        type: 'application/json',
      });
      await supabase.storage
        .from(BUCKET_NAME)
        .upload(`sessions/${session.id}/session.json`, jsonBlob, {
          contentType: 'application/json',
          upsert: true,
        });
    } catch {}

    // 5. Also upsert to Supabase Table if table exists
    try {
      await supabase.from(TABLE_NAME).upsert({
        id: session.id,
        template_id: session.templateId,
        template_name: session.templateName,
        photostrip_url: photostripRemoteUrl,
        gif_url: gifRemoteUrl,
        photos: remotePhotos,
        config: session.config,
        created_at: session.createdAt || Date.now(),
      });
    } catch (tableErr) {
      console.warn('Supabase table upsert note:', tableErr);
    }
  } catch (err) {
    console.error('Error saving session to Supabase:', err);
  }
}

// Fetch soft file session from Supabase by Session ID
export async function getSessionFromSupabase(
  sessionId: string
): Promise<SoftFileSession | null> {
  try {
    // 1. Try reading session.json from Supabase Storage
    try {
      const { data: publicData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(`sessions/${sessionId}/session.json`);

      if (publicData?.publicUrl) {
        const res = await fetch(publicData.publicUrl);
        if (res.ok) {
          const json: SoftFileSession = await res.json();
          if (json && json.id) {
            return json;
          }
        }
      }
    } catch {}

    // 2. Try fetching from Supabase Table
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('id', sessionId)
        .maybeSingle();

      if (data && !error) {
        return {
          id: data.id,
          templateId: data.template_id || 'template-1',
          templateName: data.template_name || 'Pearly Photobooth',
          photostripUrl: data.photostrip_url,
          gifUrl: data.gif_url,
          photos: data.photos || [],
          config: data.config,
          createdAt: data.created_at,
        };
      }
    } catch {}
  } catch (err) {
    console.warn('Error fetching session from Supabase:', err);
  }

  return null;
}
