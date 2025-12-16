import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/logs/analyze
 * Automatically analyzes recent logs and returns insights
 * This is what I'll call to debug issues automatically
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const since = searchParams.get('since') || new Date(Date.now() - 10 * 60 * 1000).toISOString(); // Last 10 minutes
    const search = searchParams.get('search') || '';

    // Get recent logs
    let query = supabaseAdmin
      .from('vercel_logs')
      .select('*')
      .gte('timestamp', since)
      .order('timestamp', { ascending: false })
      .limit(500);

    if (search) {
      query = query.ilike('message', `%${search}%`);
    }

    const { data: logs, error } = await query;

    if (error) {
      console.error('[Logs Analyze] Error fetching logs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch logs', details: error.message },
        { status: 500 }
      );
    }

    // Analyze logs
    const analysis = {
      total: logs?.length || 0,
      errors: logs?.filter(l => l.level === 'error' || l.status >= 400) || [],
      warnings: logs?.filter(l => l.level === 'warn') || [],
      info: logs?.filter(l => l.level === 'info') || [],
      byPath: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      recentErrors: [] as any[],
      appleWebServiceRequests: [] as any[],
      debugLogs: [] as any[],
      authFailures: [] as any[],
      notificationLogs: [] as any[],
    };

    // Group by path
    logs?.forEach(log => {
      const path = log.path || 'unknown';
      analysis.byPath[path] = (analysis.byPath[path] || 0) + 1;
    });

    // Group by status
    logs?.forEach(log => {
      const status = log.status?.toString() || 'unknown';
      analysis.byStatus[status] = (analysis.byStatus[status] || 0) + 1;
    });

    // Extract specific log types
    logs?.forEach(log => {
      const msg = log.message || '';
      
      // Apple Web Service requests
      if (msg.includes('[Apple Web Service]') || log.path?.includes('/api/apple/v1')) {
        analysis.appleWebServiceRequests.push({
          timestamp: log.timestamp,
          method: log.method,
          path: log.path,
          status: log.status,
          message: msg,
        });
      }

      // Debug logs
      if (msg.includes('[DEBUG]')) {
        analysis.debugLogs.push({
          timestamp: log.timestamp,
          message: msg,
          raw: log.raw_data,
        });
      }

      // Auth failures
      if (msg.includes('Unauthorized') || msg.includes('401') || msg.includes('Missing or invalid Authorization')) {
        analysis.authFailures.push({
          timestamp: log.timestamp,
          path: log.path,
          method: log.method,
          message: msg,
        });
      }

      // Notification logs
      if (msg.includes('[APNs]') || msg.includes('[Test Notification]') || msg.includes('push notification')) {
        analysis.notificationLogs.push({
          timestamp: log.timestamp,
          message: msg,
          raw: log.raw_data,
        });
      }

      // Recent errors
      if (log.level === 'error' || log.status >= 400) {
        analysis.recentErrors.push({
          timestamp: log.timestamp,
          path: log.path,
          method: log.method,
          status: log.status,
          message: msg,
        });
      }
    });

    return NextResponse.json({
      analysis,
      summary: {
        totalLogs: analysis.total,
        errorCount: analysis.errors.length,
        warningCount: analysis.warnings.length,
        infoCount: analysis.info.length,
        topPaths: Object.entries(analysis.byPath)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([path, count]) => ({ path, count })),
        statusBreakdown: analysis.byStatus,
        hasAuthFailures: analysis.authFailures.length > 0,
        hasDebugLogs: analysis.debugLogs.length > 0,
        hasNotificationIssues: analysis.notificationLogs.length > 0,
      },
      timestamp: new Date().toISOString(),
      since,
    });
  } catch (error) {
    console.error('[Logs Analyze] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

