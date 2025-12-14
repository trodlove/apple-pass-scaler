'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { Pass } from '@/lib/types';

export default function PassesPage() {
  const [passes, setPasses] = useState<Pass[]>([]);
  const [filteredPasses, setFilteredPasses] = useState<Pass[]>([]);
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
          pass.id.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredPasses(filtered);
      setPage(1);
    } else {
      setFilteredPasses(passes);
    }
  }, [search, passes]);

  async function fetchPasses() {
    try {
      // Note: In a real app, you'd want to create an API route for this
      // For now, we'll use a client-side approach with a public API
      const response = await fetch('/api/passes');
      if (response.ok) {
        const data = await response.json();
        setPasses(data);
        setFilteredPasses(data);
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
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Passes</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search Passes</CardTitle>
          <CardDescription>Search by serial number or ID</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </CardContent>
      </Card>

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
                <TableHead>Serial Number</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPasses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No passes found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedPasses.map((pass) => (
                  <TableRow key={pass.id}>
                    <TableCell className="font-mono text-sm">
                      {pass.serial_number}
                    </TableCell>
                    <TableCell>{formatDate(pass.created_at)}</TableCell>
                    <TableCell>{formatCurrency(pass.revenue)}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                        Active
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

