'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { Pass } from '@/lib/types';
import { Edit, Search } from 'lucide-react';

export default function PassesPage() {
  const [passes, setPasses] = useState<Pass[]>([]);
  const [filteredPasses, setFilteredPasses] = useState<Pass[]>([]);
  const [selectedPass, setSelectedPass] = useState<Pass | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchPasses();
  }, []);

  useEffect(() => {
    if (search) {
      const filtered = passes.filter(
        (pass) =>
          pass.serial_number.toLowerCase().includes(search.toLowerCase()) ||
          pass.id.toLowerCase().includes(search.toLowerCase()) ||
          ((pass.pass_data as any)?.organizationName || '').toLowerCase().includes(search.toLowerCase())
      );
      setFilteredPasses(filtered);
      setPage(1);
    } else {
      setFilteredPasses(passes);
    }
  }, [search, passes]);

  async function fetchPasses() {
    try {
      const response = await fetch('/api/passes');
      if (response.ok) {
        const data = await response.json();
        setPasses(data);
        setFilteredPasses(data);
        if (data.length > 0 && !selectedPass) {
          setSelectedPass(data[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching passes:', error);
    } finally {
      setLoading(false);
    }
  }

  const paginatedPasses = filteredPasses.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );
  const totalPages = Math.ceil(filteredPasses.length / itemsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const passData = selectedPass?.pass_data as any;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Library</h1>
        <p className="text-gray-600">Manage and view all your Apple Wallet passes.</p>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search by serial number, ID, or organization name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Passes List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>All Passes</CardTitle>
              <CardDescription>
                Showing {paginatedPasses.length} of {filteredPasses.length} passes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead>Serial Number</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPasses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No passes found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedPasses.map((pass) => {
                      const orgName = (pass.pass_data as any)?.organizationName || 'N/A';
                      return (
                        <TableRow
                          key={pass.id}
                          className={selectedPass?.id === pass.id ? 'bg-gray-50' : ''}
                          onClick={() => setSelectedPass(pass)}
                        >
                          <TableCell className="font-medium">{orgName}</TableCell>
                          <TableCell className="font-mono text-sm">
                            {pass.serial_number.substring(0, 20)}...
                          </TableCell>
                          <TableCell>{formatDate(pass.created_at)}</TableCell>
                          <TableCell>{formatCurrency(pass.revenue)}</TableCell>
                          <TableCell>
                            <Link href={`/dashboard/passes/${pass.id}/edit`}>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Preview Pane */}
        <div className="lg:col-span-1">
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>Pass details</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedPass ? (
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">Organization</div>
                    <div className="text-lg font-semibold">{passData?.organizationName || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">Description</div>
                    <div className="text-sm">{passData?.description || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">Serial Number</div>
                    <div className="text-sm font-mono">{selectedPass.serial_number}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">Revenue</div>
                    <div className="text-lg font-semibold text-green-600">
                      {formatCurrency(selectedPass.revenue)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">Created</div>
                    <div className="text-sm">{formatDate(selectedPass.created_at)}</div>
                  </div>
                  <div className="pt-4 border-t">
                    <Link href={`/dashboard/passes/${selectedPass.id}/edit`}>
                      <Button className="w-full">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Pass
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  Select a pass to view details
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
