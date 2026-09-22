import { NextResponse } from 'next/server';
import os from 'os';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const interfaces = os.networkInterfaces();
    let localIp = 'localhost';

    // Prioritize Wi-Fi or Ethernet IPv4 address
    for (const name of Object.keys(interfaces)) {
      for (const net of interfaces[name] || []) {
        if (net.family === 'IPv4' && !net.internal) {
          // Avoid virtual adapter addresses if possible (e.g. 172.x docker / WSL)
          if (!net.address.startsWith('172.') && !net.address.startsWith('169.254.')) {
            localIp = net.address;
            break;
          } else if (localIp === 'localhost') {
            localIp = net.address;
          }
        }
      }
      if (localIp !== 'localhost' && !localIp.startsWith('172.') && !localIp.startsWith('169.254.')) {
        break;
      }
    }

    return NextResponse.json({
      localIp,
      hostname: os.hostname(),
    });
  } catch (error) {
    return NextResponse.json({ localIp: 'localhost' });
  }
}
