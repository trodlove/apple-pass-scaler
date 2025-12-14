import { supabaseAdmin } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

export default async function DashboardPage() {
  // Fetch stats from Supabase
  const [passesResult, devicesResult, revenueResult] = await Promise.all([
    supabaseAdmin.from('passes').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('devices').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('passes').select('revenue'),
  ]);

  const totalPasses = passesResult.count || 0;
  const totalDevices = devicesResult.count || 0;
  const totalRevenue = revenueResult.data?.reduce((sum, pass) => sum + (pass.revenue || 0), 0) || 0;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Passes</CardTitle>
            <CardDescription>All passes issued</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalPasses.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
            <CardDescription>Total revenue tracked</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(totalRevenue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Devices</CardTitle>
            <CardDescription>Devices with passes installed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalDevices.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

