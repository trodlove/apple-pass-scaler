import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/debug/log-event
 * Direct logging endpoint that writes to database immediately
 * This bypasses Vercel Log Drains and ensures we can see what's happening
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, data, level = 'info' } = body;

    const logEntry = {
      id: `debug_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString(),
      message: typeof event === 'string' ? event : JSON.stringify(event),
      level,
      project: 'apple-pass-scaler',
      source: 'debug',
      raw_data: { event, data, timestamp: new Date().toISOString() },
    };

    const { error } = await supabaseAdmin
      .from('vercel_logs')
      .insert(logEntry);

    if (error) {
      console.error('[Debug Log] Error storing log:', error);
      return NextResponse.json({ error: 'Failed to store log', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, logId: logEntry.id });
  } catch (error) {
    console.error('[Debug Log] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

