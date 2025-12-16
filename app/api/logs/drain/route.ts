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
        
        // Vercel Log Drains format: extract message from nested structure
        // The actual log message can be in logEntry.message or logEntry.raw_data[0].message
        let actualMessage = logEntry.message || logEntry.text || '';
        let actualPath = logEntry.path || logEntry.url || '';
        let actualMethod = logEntry.method || null;
        let actualStatus = logEntry.status || null;
        let actualRequestId = logEntry.requestId || logEntry.request_id || '';
        
        // If logEntry has a proxy object (Vercel format), extract from there
        if (logEntry.proxy) {
          actualPath = logEntry.proxy.path || actualPath;
          actualMethod = logEntry.proxy.method || actualMethod;
          actualStatus = logEntry.proxy.statusCode || actualStatus;
        }
        
        // Extract message from nested raw_data if present
        if (!actualMessage && logEntry.raw_data && Array.isArray(logEntry.raw_data) && logEntry.raw_data[0]) {
          actualMessage = logEntry.raw_data[0].message || actualMessage;
        }
        
        // If still no message, try to extract from the log entry structure
        if (!actualMessage && typeof logEntry === 'object') {
          // Look for common log message fields
          actualMessage = logEntry.log || logEntry.output || logEntry.stdout || logEntry.stderr || '';
        }
        
        logs.push({
          id: logEntry.id || `log_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          timestamp: logEntry.timestamp ? new Date(logEntry.timestamp).toISOString() : new Date().toISOString(),
          message: actualMessage,
          level: logEntry.level || 'info',
          project: logEntry.project || logEntry.projectName || 'apple-pass-scaler',
          deployment: logEntry.deployment || logEntry.deploymentId || '',
          source: logEntry.source || 'runtime',
          request_id: actualRequestId,
          status: actualStatus,
          method: actualMethod,
          path: actualPath,
          user_agent: logEntry.userAgent || logEntry.user_agent || '',
          ip: logEntry.ip || (logEntry.proxy && logEntry.proxy.clientIp) || '',
          region: logEntry.region || (logEntry.proxy && logEntry.proxy.region) || '',
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

