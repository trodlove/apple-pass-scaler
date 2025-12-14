import { supabaseAdmin } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CreditCard, Users, Bell } from 'lucide-react';

export default async function AnalyticsPage() {
  // Fetch stats
  const [passesResult, revenueResult, notificationsResult] = await Promise.all([
    supabaseAdmin.from('passes').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('passes').select('revenue'),
    supabaseAdmin.from('sequence_enrollments').select('id', { count: 'exact', head: true }),
  ]);

  const totalPasses = passesResult.count || 0;
  
  // Count distinct device_ids from registrations
  const { data: distinctDevices } = await supabaseAdmin
    .from('registrations')
    .select('device_id');
  
  const uniqueDeviceIds = new Set(distinctDevices?.map(r => r.device_id) || []);
  const totalDevices = uniqueDeviceIds.size;

  const notificationsSent = notificationsResult.count || 0;

  // Fetch passes with device and notification counts
  const { data: allPasses } = await supabaseAdmin
    .from('passes')
    .select('id, pass_data, created_at')
    .order('created_at', { ascending: false });

  // Get device and notification counts per pass
  const passesWithStats = await Promise.all(
    (allPasses || []).map(async (pass) => {
      const { count: deviceCount } = await supabaseAdmin
        .from('registrations')
        .select('device_id', { count: 'exact', head: true })
        .eq('pass_id', pass.id);

      const { count: notificationCount } = await supabaseAdmin
        .from('sequence_enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('pass_id', pass.id);

      return {
        ...pass,
        deviceCount: deviceCount || 0,
        notificationCount: notificationCount || 0,
        organizationName: (pass.pass_data as any)?.organizationName || 'N/A',
        description: (pass.pass_data as any)?.description || 'N/A',
      };
    })
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Analytics</h1>
        <p className="text-gray-600">View device registrations and notification stats for your passes.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Passes</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalPasses.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalDevices.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notifications Sent</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{notificationsSent.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pass Analytics</CardTitle>
          <CardDescription>Device registrations and notification stats by pass</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PASS NAME</TableHead>
                <TableHead>DEVICES</TableHead>
                <TableHead>NOTIFICATIONS SENT</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {passesWithStats.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                    No passes found
                  </TableCell>
                </TableRow>
              ) : (
                passesWithStats.map((pass) => (
                  <TableRow key={pass.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{pass.organizationName}</div>
                        <div className="text-sm text-gray-500">{pass.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>{pass.deviceCount}</TableCell>
                    <TableCell>{pass.notificationCount}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

