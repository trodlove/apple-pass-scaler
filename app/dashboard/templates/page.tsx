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
import type { PassTemplate } from '@/lib/types';
import { formatDate } from '@/lib/utils';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<PassTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    pass_style: 'generic',
    fields: '{}',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    try {
      const response = await fetch('/api/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      let fields;
      try {
        fields = JSON.parse(formData.fields);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Invalid JSON in fields',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          pass_style: formData.pass_style,
          fields,
        }),
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Template created' });
        setShowForm(false);
        setFormData({ name: '', pass_style: 'generic', fields: '{}' });
        fetchTemplates();
      } else {
        const data = await response.json();
        toast({
          title: 'Error',
          description: data.error || 'Failed to create template',
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
        <h1 className="text-3xl font-bold">Pass Templates</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Create Template'}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create Pass Template</CardTitle>
            <CardDescription>
              Define a template structure for passes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pass_style">Pass Style</Label>
                  <Input
                    id="pass_style"
                    value={formData.pass_style}
                    onChange={(e) => setFormData({ ...formData, pass_style: e.target.value })}
                    placeholder="generic, coupon, loyalty"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fields">Fields (JSON)</Label>
                <textarea
                  id="fields"
                  value={formData.fields}
                  onChange={(e) => setFormData({ ...formData, fields: e.target.value })}
                  required
                  className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder='{"field1": {"label": "Field 1", "defaultValue": "Default"}}'
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Template'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Templates</CardTitle>
          <CardDescription>Manage your pass templates</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Pass Style</TableHead>
                <TableHead>Created At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    No templates found
                  </TableCell>
                </TableRow>
              ) : (
                templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>{template.name}</TableCell>
                    <TableCell>{template.pass_style}</TableCell>
                    <TableCell>{formatDate(template.created_at)}</TableCell>
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

