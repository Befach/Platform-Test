'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GitBranch } from 'lucide-react';

interface DependenciesViewProps {
  workspace: any;
  workItems: any[];
  timelineItems: any[];
  linkedItems: any[];
}

export function DependenciesView({
  workspace,
  workItems,
  timelineItems,
  linkedItems,
}: DependenciesViewProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Dependencies</h2>
          <p className="text-muted-foreground">
            Visualize relationships between features
          </p>
        </div>
      </div>

      {/* Dependencies Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Dependency Graph
          </CardTitle>
          <CardDescription>
            Visual dependency graph coming soon
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          <div className="text-6xl mb-4">🔗</div>
          <h3 className="text-lg font-semibold mb-2">
            Dependencies view in development
          </h3>
          <p className="text-muted-foreground">
            Interactive dependency graph will be available soon
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
