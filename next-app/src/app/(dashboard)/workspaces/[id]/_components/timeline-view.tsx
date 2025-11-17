'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

interface TimelineViewProps {
  workspace: any;
  workItems: any[];
  timelineItems: any[];
}

export function TimelineView({
  workspace,
  workItems,
  timelineItems,
}: TimelineViewProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Timeline</h2>
          <p className="text-muted-foreground">
            Gantt chart and timeline visualization
          </p>
        </div>
      </div>

      {/* Timeline Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Project Timeline
          </CardTitle>
          <CardDescription>
            Visual timeline coming soon
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-lg font-semibold mb-2">
            Timeline view in development
          </h3>
          <p className="text-muted-foreground">
            Gantt chart visualization will be available soon
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
