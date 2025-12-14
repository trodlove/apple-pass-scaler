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
import { Smartphone, AlertCircle, CheckCircle2 } from 'lucide-react';
import FixPassesButton from './fix-passes-button';

export default async function DevicesPage() {
  // Get all devices
  const { data: devices, error: devicesError } = await supabaseAdmin
    .from('devices')
    .select('id, device_library_identifier, push_token, created_at, updated_at')
    .order('created_at', { ascending: false });

  // Get all registrations with pass info
  const { data: registrations, error: regError } = await supabaseAdmin
    .from('registrations')
    .select('device_id, pass_id, created_at, passes(serial_number, pass_data)')
    .order('created_at', { ascending: false });

  // Get all passes to check webServiceURL
  const { data: passes, error: passesError } = await supabaseAdmin
    .from('passes')
    .select('id, serial_number, pass_data, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  // Analyze passes
  const passesWithWebService = passes?.filter(p => {
    const passData = p.pass_data as any;
    return !!passData?.webServiceURL;
  }) || [];

  const passesWithoutWebService = passes?.filter(p => {
    const passData = p.pass_data as any;
    return !passData?.webServiceURL;
  }) || [];

  // Group registrations by device
  const deviceMap = new Map();
  devices?.forEach(device => {
    deviceMap.set(device.id, {
      ...device,
      registrations: [],
    });
  });

  registrations?.forEach(reg => {
    const device = deviceMap.get(reg.device_id);
    if (device) {
      device.registrations.push(reg);
    }
  });

  const devicesWithRegistrations = Array.from(deviceMap.values())
    .filter(d => d.registrations.length > 0);

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Device Registration</h1>
          <p className="text-gray-600">View registered devices and pass configuration status.</p>
        </div>
        <FixPassesButton />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{devices?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Registered devices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Devices</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{devicesWithRegistrations.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Devices with passes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Passes Configured</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{passesWithWebService.length}</div>
            <p className="text-xs text-muted-foreground mt-1">With webServiceURL</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Fix</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{passesWithoutWebService.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Missing webServiceURL</p>
          </CardContent>
        </Card>
      </div>

      {/* Devices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Devices</CardTitle>
          <CardDescription>Devices that have registered for pass updates</CardDescription>
        </CardHeader>
        <CardContent>
          {devicesWithRegistrations.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No devices registered yet</p>
              <p className="text-sm text-gray-400">
                Devices will appear here once they add a pass with webServiceURL configured.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>DEVICE ID</TableHead>
                  <TableHead>PUSH TOKEN</TableHead>
                  <TableHead>PASSES</TableHead>
                  <TableHead>REGISTERED</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devicesWithRegistrations.map((device) => (
                  <TableRow key={device.id}>
                    <TableCell className="font-mono text-sm">
                      {device.device_library_identifier.substring(0, 20)}...
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {device.push_token ? `${device.push_token.substring(0, 20)}...` : 'Missing'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {device.registrations.map((reg: any) => {
                          const pass = reg.passes as any;
                          return (
                            <span key={reg.pass_id} className="text-sm">
                              {pass?.serial_number || 'Unknown'}
                            </span>
                          );
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(device.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pass Configuration Status */}
      {passesWithoutWebService.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Passes Missing webServiceURL
            </CardTitle>
            <CardDescription>
              These passes need to be fixed to enable device registration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SERIAL NUMBER</TableHead>
                  <TableHead>CREATED</TableHead>
                  <TableHead>STATUS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {passesWithoutWebService.slice(0, 20).map((pass) => (
                  <TableRow key={pass.id}>
                    <TableCell className="font-mono text-sm">{pass.serial_number}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(pass.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <span className="text-orange-600 text-sm">Missing webServiceURL</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {passesWithoutWebService.length > 20 && (
              <p className="text-sm text-gray-500 mt-4 text-center">
                ... and {passesWithoutWebService.length - 20} more
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

