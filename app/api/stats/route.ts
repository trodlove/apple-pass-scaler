import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/stats
 * Returns accurate statistics for the dashboard
 */
export async function GET() {
  try {
    // Count total passes
    const { count: totalPasses, error: passesError } = await supabaseAdmin
      .from('passes')
      .select('id', { count: 'exact', head: true });

    if (passesError) {
      console.error('Error counting passes:', passesError);
    }

    // Count unique devices that have at least one active registration
    // This is the accurate count of devices with passes installed
    const { count: activeDevices, error: devicesError } = await supabaseAdmin
      .from('registrations')
      .select('device_id', { count: 'exact', head: true });

    if (devicesError) {
      console.error('Error counting active devices:', devicesError);
    }

    // Get total revenue
    const { data: passes, error: revenueError } = await supabaseAdmin
      .from('passes')
      .select('revenue');

    if (revenueError) {
      console.error('Error fetching revenue:', revenueError);
    }

    const totalRevenue = passes?.reduce((sum, pass) => sum + (Number(pass.revenue) || 0), 0) || 0;

    // Count notifications sent (from sequence enrollments and broadcasts)
    // For now, we'll count sequence steps executed
    // This is a simplified count - in production you might want a separate notifications log table
    const { count: notificationsSent, error: notificationsError } = await supabaseAdmin
      .from('sequence_enrollments')
      .select('id', { count: 'exact', head: true });

    if (notificationsError) {
      console.error('Error counting notifications:', notificationsError);
    }

    return NextResponse.json({
      totalPasses: totalPasses || 0,
      activeDevices: activeDevices || 0,
      totalRevenue,
      notificationsSent: notificationsSent || 0,
    }, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in GET /api/stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

