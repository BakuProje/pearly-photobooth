import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// In-memory cache for fast response
const sessionMemoryCache = new Map<string, any>();
const SESSIONS_DIR = path.join(process.cwd(), '.sessions_data');

// Ensure sessions directory exists
async function ensureSessionDir() {
  try {
    await fs.mkdir(SESSIONS_DIR, { recursive: true });
  } catch {}
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || !body.id) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const sessionData = {
      ...body,
      updatedAt: Date.now(),
    };

    // 1. Save in-memory cache
    sessionMemoryCache.set(body.id, sessionData);

    // 2. Persist to disk
    try {
      await ensureSessionDir();
      const filePath = path.join(SESSIONS_DIR, `${body.id}.json`);
      await fs.writeFile(filePath, JSON.stringify(sessionData), 'utf-8');
    } catch (diskErr) {
      console.warn('Could not write session to disk:', diskErr);
    }

    // Prune memory if cache gets huge
    if (sessionMemoryCache.size > 300) {
      const keys = Array.from(sessionMemoryCache.keys());
      for (let i = 0; i < keys.length - 300; i++) {
        sessionMemoryCache.delete(keys[i]);
      }
    }

    return NextResponse.json({ success: true, id: body.id });
  } catch (error) {
    console.error('Error in POST /api/session:', error);
    return NextResponse.json({ error: 'Failed to save session' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Handle 'last' query
    if (id === 'last') {
      const keys = Array.from(sessionMemoryCache.keys());
      if (keys.length > 0) {
        const lastSession = sessionMemoryCache.get(keys[keys.length - 1]);
        return NextResponse.json({ success: true, session: lastSession });
      }
      try {
        await ensureSessionDir();
        const files = await fs.readdir(SESSIONS_DIR);
        const jsonFiles = files.filter((f) => f.endsWith('.json'));
        if (jsonFiles.length > 0) {
          const lastFile = jsonFiles[jsonFiles.length - 1];
          const raw = await fs.readFile(path.join(SESSIONS_DIR, lastFile), 'utf-8');
          const parsed = JSON.parse(raw);
          return NextResponse.json({ success: true, session: parsed });
        }
      } catch {}
      return NextResponse.json({ error: 'No recent session found' }, { status: 404 });
    }

    // 1. Check in-memory cache
    if (sessionMemoryCache.has(id)) {
      return NextResponse.json({
        success: true,
        session: sessionMemoryCache.get(id),
      });
    }

    // 2. Check disk storage
    try {
      await ensureSessionDir();
      const filePath = path.join(SESSIONS_DIR, `${id}.json`);
      const raw = await fs.readFile(filePath, 'utf-8');
      const session = JSON.parse(raw);
      sessionMemoryCache.set(id, session);
      return NextResponse.json({ success: true, session });
    } catch {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error in GET /api/session:', error);
    return NextResponse.json({ error: 'Failed to get session' }, { status: 500 });
  }
}
