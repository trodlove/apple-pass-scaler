import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/logs/recent
 * Returns recent logs from Vercel Log Drain
 * Query params:
 *   - limit: number of logs to return (default: 100)
 *   - since: ISO timestamp to get logs since (default: last 5 minutes)
 *   - level: filter by log level (info, error, warn, etc.)
 *   - search: search term in message
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const since = searchParams.get('since') || new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const level = searchParams.get('level');
    const search = searchParams.get('search');

    let query = supabaseAdmin
      .from('vercel_logs')
      .select('*')
      .gte('timestamp', since)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (level) {
      query = query.eq('level', level);
    }

    if (search) {
      query = query.ilike('message', `%${search}%`);
    }

    const { data: logs, error } = await query;

    if (error) {
      console.error('[Logs Recent] Error fetching logs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch logs', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      logs: logs || [],
      count: logs?.length || 0,
      since,
      limit,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Logs Recent] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

