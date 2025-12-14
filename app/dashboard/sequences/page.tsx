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
import type { Sequence, SequenceStep } from '@/lib/types';

export default function SequencesPage() {
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [selectedSequence, setSelectedSequence] = useState<Sequence | null>(null);
  const [steps, setSteps] = useState<SequenceStep[]>([]);
  const [sequenceName, setSequenceName] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSequences();
  }, []);

  useEffect(() => {
    if (selectedSequence) {
      fetchSteps(selectedSequence.id);
    }
  }, [selectedSequence]);

  async function fetchSequences() {
    try {
      const response = await fetch('/api/sequences');
      if (response.ok) {
        const data = await response.json();
        setSequences(data);
      }
    } catch (error) {
      console.error('Error fetching sequences:', error);
    }
  }

  async function fetchSteps(sequenceId: string) {
    try {
      const response = await fetch(`/api/sequences/${sequenceId}/steps`);
      if (response.ok) {
        const data = await response.json();
        setSteps(data);
      }
    } catch (error) {
      console.error('Error fetching steps:', error);
    }
  }

  async function handleCreateSequence() {
    if (!sequenceName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a sequence name',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/sequences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: sequenceName }),
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Sequence created' });
        setSequenceName('');
        fetchSequences();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create sequence',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleAddStep(sequenceId: string) {
    const stepNumber = steps.length + 1;
    const delayHours = 24;
    const messageTemplate = 'New offer just for you: %@';

    try {
      const response = await fetch(`/api/sequences/${sequenceId}/steps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step_number: stepNumber,
          delay_hours: delayHours,
          message_template: messageTemplate,
        }),
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Step added' });
        fetchSteps(sequenceId);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add step',
        variant: 'destructive',
      });
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Sequences</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create Sequence</CardTitle>
            <CardDescription>Create a new notification sequence</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sequenceName">Sequence Name</Label>
              <Input
                id="sequenceName"
                value={sequenceName}
                onChange={(e) => setSequenceName(e.target.value)}
                placeholder="Enter sequence name..."
              />
            </div>
            <Button onClick={handleCreateSequence} disabled={loading}>
              Create Sequence
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Sequences</CardTitle>
            <CardDescription>Select a sequence to manage steps</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sequences.map((seq) => (
                <button
                  key={seq.id}
                  onClick={() => setSelectedSequence(seq)}
                  className={`w-full text-left p-2 rounded border ${
                    selectedSequence?.id === seq.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                >
                  {seq.name}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedSequence && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Steps for {selectedSequence.name}</CardTitle>
            <CardDescription>Manage sequence steps</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Button onClick={() => handleAddStep(selectedSequence.id)}>
                Add Step
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Step Number</TableHead>
                  <TableHead>Delay (Hours)</TableHead>
                  <TableHead>Message Template</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {steps.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">
                      No steps yet
                    </TableCell>
                  </TableRow>
                ) : (
                  steps
                    .sort((a, b) => a.step_number - b.step_number)
                    .map((step) => (
                      <TableRow key={step.id}>
                        <TableCell>{step.step_number}</TableCell>
                        <TableCell>{step.delay_hours}</TableCell>
                        <TableCell>{step.message_template}</TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

