import { NextRequest, NextResponse } from 'next/server';

// In-memory store for soft file sessions across local network / devices
const sessionStore = new Map<string, any>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || !body.id) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    sessionStore.set(body.id, {
      ...body,
      updatedAt: Date.now(),
    });

    // Prune old sessions if store grows large (> 200 items)
    if (sessionStore.size > 200) {
      const keys = Array.from(sessionStore.keys());
      for (let i = 0; i < keys.length - 200; i++) {
        sessionStore.delete(keys[i]);
      }
    }

    return NextResponse.json({ success: true, id: body.id });
  } catch (error) {
    console.error('Error saving session API:', error);
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

    const session = sessionStore.get(id);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, session });
  } catch (error) {
    console.error('Error getting session API:', error);
    return NextResponse.json({ error: 'Failed to get session' }, { status: 500 });
  }
}
