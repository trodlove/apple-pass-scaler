import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/logs/drain
 * Receives logs from Vercel Log Drains
 * This endpoint is called by Vercel whenever logs are generated
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    
    // Vercel Log Drains send logs in NDJSON format (one JSON object per line)
    const logLines = body.split('\n').filter(line => line.trim().length > 0);
    
    const logs = [];
    for (const line of logLines) {
      try {
        const logEntry = JSON.parse(line);
        logs.push({
          id: logEntry.id || `log_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          timestamp: logEntry.timestamp || new Date().toISOString(),
          message: logEntry.message || logEntry.text || '',
          level: logEntry.level || 'info',
          project: logEntry.project || 'apple-pass-scaler',
          deployment: logEntry.deployment || '',
          source: logEntry.source || 'runtime',
          request_id: logEntry.requestId || '',
          status: logEntry.status || null,
          method: logEntry.method || null,
          path: logEntry.path || logEntry.url || '',
          user_agent: logEntry.userAgent || '',
          ip: logEntry.ip || '',
          region: logEntry.region || '',
          raw_data: logEntry,
        });
      } catch (e) {
        // If line isn't valid JSON, store as plain text
        logs.push({
          id: `log_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          timestamp: new Date().toISOString(),
          message: line,
          level: 'info',
          project: 'apple-pass-scaler',
          raw_data: { raw: line },
        });
      }
    }

    // Store logs in Supabase
    if (logs.length > 0) {
      const { error } = await supabaseAdmin
        .from('vercel_logs')
        .insert(logs);

      if (error) {
        console.error('[Log Drain] Error storing logs:', error);
        // Don't fail - we still want to return 200 to Vercel
      }
    }

    return NextResponse.json({ 
      received: logs.length,
      timestamp: new Date().toISOString(),
    }, { status: 200 });
  } catch (error) {
    console.error('[Log Drain] Error processing logs:', error);
    // Always return 200 to Vercel to prevent retries
    return NextResponse.json({ 
      error: 'Error processing logs',
      timestamp: new Date().toISOString(),
    }, { status: 200 });
  }
}

/**
 * GET /api/logs/drain
 * Health check endpoint for Vercel Log Drains
 */
export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    service: 'vercel-log-drain',
    timestamp: new Date().toISOString(),
  });
}

