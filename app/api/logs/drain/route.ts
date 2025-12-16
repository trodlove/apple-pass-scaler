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
        
        // Vercel sends logs in a nested format - check if this is a wrapped log entry
        // The actual log data might be in raw_data array
        let actualLogData = logEntry;
        if (logEntry.raw_data && Array.isArray(logEntry.raw_data) && logEntry.raw_data.length > 0) {
          // Use the first item in raw_data as the actual log entry
          actualLogData = logEntry.raw_data[0];
        }
        
        // Extract from proxy object (Vercel format)
        if (actualLogData.proxy) {
          actualPath = actualLogData.proxy.path || actualPath;
          actualMethod = actualLogData.proxy.method || actualMethod;
          actualStatus = actualLogData.proxy.statusCode || actualStatus;
          actualRequestId = actualLogData.proxy.requestId || actualRequestId;
        }
        
        // Extract message - check multiple possible locations
        if (!actualMessage) {
          actualMessage = actualLogData.message || 
                         actualLogData.text || 
                         actualLogData.log || 
                         actualLogData.output || 
                         actualLogData.stdout || 
                         actualLogData.stderr || 
                         '';
        }
        
        // Extract path if still missing
        if (!actualPath) {
          actualPath = actualLogData.path || actualLogData.url || '';
        }
        
        // Extract method if still missing
        if (!actualMethod) {
          actualMethod = actualLogData.method || null;
        }
        
        // Extract status if still missing
        if (!actualStatus) {
          actualStatus = actualLogData.status || actualLogData.statusCode || null;
        }
        
        // Extract request ID if still missing
        if (!actualRequestId) {
          actualRequestId = actualLogData.requestId || actualLogData.request_id || '';
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

