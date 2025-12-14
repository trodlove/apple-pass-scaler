'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import type { AppleDeveloperAccount } from '@/lib/types';
import { formatDate } from '@/lib/utils';

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<AppleDeveloperAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    team_id: '',
    pass_type_id: '',
    apns_key_id: 'F92T5PM6V7', // Pre-filled from provided credentials
    apns_auth_key: '',
    pass_signer_cert: '',
    pass_signer_key: '',
    wwdr_cert: '',
    status: 'ACTIVE' as const,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchAccounts();
  }, []);

  async function fetchAccounts() {
    try {
      const response = await fetch('/api/accounts');
      if (response.ok) {
        const data = await response.json();
        setAccounts(data);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Account created' });
        setShowForm(false);
        setFormData({
          name: '',
          team_id: '',
          pass_type_id: '',
          apns_key_id: '',
          apns_auth_key: '',
          pass_signer_cert: '',
          pass_signer_key: '',
          wwdr_cert: '',
          status: 'ACTIVE',
        });
        fetchAccounts();
      } else {
        const data = await response.json();
        toast({
          title: 'Error',
          description: data.error || 'Failed to create account',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Apple Developer Accounts</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add Account'}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add Apple Developer Account</CardTitle>
            <CardDescription>
              Add a new Apple Developer Account for pass generation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="team_id">Team ID</Label>
                  <Input
                    id="team_id"
                    value={formData.team_id}
                    onChange={(e) => setFormData({ ...formData, team_id: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pass_type_id">Pass Type ID</Label>
                  <Input
                    id="pass_type_id"
                    value={formData.pass_type_id}
                    onChange={(e) => setFormData({ ...formData, pass_type_id: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apns_key_id">APNS Key ID</Label>
                  <Input
                    id="apns_key_id"
                    value={formData.apns_key_id}
                    onChange={(e) => setFormData({ ...formData, apns_key_id: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="apns_auth_key">APNS Auth Key (.p8 content)</Label>
                <textarea
                  id="apns_auth_key"
                  value={formData.apns_auth_key}
                  onChange={(e) => setFormData({ ...formData, apns_auth_key: e.target.value })}
                  required
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pass_signer_cert">Pass Signer Cert (.cer content)</Label>
                <textarea
                  id="pass_signer_cert"
                  value={formData.pass_signer_cert}
                  onChange={(e) => setFormData({ ...formData, pass_signer_cert: e.target.value })}
                  required
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pass_signer_key">Pass Signer Key (.p12 content)</Label>
                <textarea
                  id="pass_signer_key"
                  value={formData.pass_signer_key}
                  onChange={(e) => setFormData({ ...formData, pass_signer_key: e.target.value })}
                  required
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wwdr_cert">WWDR Cert</Label>
                <textarea
                  id="wwdr_cert"
                  value={formData.wwdr_cert}
                  onChange={(e) => setFormData({ ...formData, wwdr_cert: e.target.value })}
                  required
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Account'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Accounts</CardTitle>
          <CardDescription>Manage your Apple Developer Accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Team ID</TableHead>
                <TableHead>Pass Type ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Used</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No accounts found
                  </TableCell>
                </TableRow>
              ) : (
                accounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell>{account.name}</TableCell>
                    <TableCell className="font-mono text-sm">{account.team_id}</TableCell>
                    <TableCell className="font-mono text-sm">{account.pass_type_id}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          account.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800'
                            : account.status === 'BURNED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {account.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {account.last_used_at ? formatDate(account.last_used_at) : 'Never'}
                    </TableCell>
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

