'use client';

import { Card } from '@/components/ui/card';
import { PHASE_CONFIG, PHASE_ORDER, type WorkspacePhase } from '@/lib/constants/workspace-phases';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface PhaseData {
  count: number;
  percentage: number;
}

interface MultiPhaseProgressBarProps {
  distribution: Record<WorkspacePhase, PhaseData>;
  totalItems: number;
  className?: string;
}

export function MultiPhaseProgressBar({
  distribution,
  totalItems,
  className,
}: MultiPhaseProgressBarProps) {
  const [hoveredPhase, setHoveredPhase] = useState<WorkspacePhase | null>(null);

  return (
    <Card className={cn('p-6', className)}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Project Progress Distribution</h3>
          <p className="text-sm text-muted-foreground">
            Work items across phases • {totalItems} total items
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3">
          {PHASE_ORDER.map((phaseId) => {
            const phase = PHASE_CONFIG[phaseId];
            const data = distribution[phaseId];

            return (
              <div
                key={phaseId}
                className="flex items-center gap-1.5"
                onMouseEnter={() => setHoveredPhase(phaseId)}
                onMouseLeave={() => setHoveredPhase(null)}
              >
                <div
                  className={cn(
                    'h-3 w-3 rounded-full transition-transform',
                    phase.bgColor,
                    hoveredPhase === phaseId && 'scale-125'
                  )}
                />
                <span className="text-xs font-medium">{phase.name}</span>
                <span className="text-xs text-muted-foreground">({data.percentage}%)</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-12 w-full overflow-hidden rounded-lg bg-slate-100">
        <div className="flex h-full">
          {PHASE_ORDER.map((phaseId, index) => {
            const phase = PHASE_CONFIG[phaseId];
            const data = distribution[phaseId];

            if (data.percentage === 0) return null;

            return (
              <motion.div
                key={phaseId}
                initial={{ width: 0 }}
                animate={{ width: `${data.percentage}%` }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={cn(
                  'relative flex items-center justify-center transition-opacity',
                  phase.bgColor,
                  hoveredPhase && hoveredPhase !== phaseId && 'opacity-50'
                )}
                onMouseEnter={() => setHoveredPhase(phaseId)}
                onMouseLeave={() => setHoveredPhase(null)}
              >
                {/* Show emoji icon if segment is wide enough */}
                {data.percentage > 10 && (
                  <span className="text-xl">{phase.icon}</span>
                )}

                {/* Hover tooltip */}
                {hoveredPhase === phaseId && (
                  <div className="absolute -top-20 left-1/2 z-10 w-64 -translate-x-1/2 rounded-lg border bg-white p-3 shadow-lg">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-2xl">{phase.icon}</span>
                      <div>
                        <p className="font-semibold">{phase.name}</p>
                        <p className="text-xs text-muted-foreground">{phase.description}</p>
                      </div>
                    </div>
                    <div className="mt-2 space-y-1 border-t pt-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Items:</span>
                        <span className="font-medium">{data.count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Percentage:</span>
                        <span className="font-medium">{data.percentage}%</span>
                      </div>
                    </div>
                    {/* Color meaning */}
                    <div className="mt-2 rounded-md bg-slate-50 p-2 text-xs text-muted-foreground">
                      💡 {phase.meaning}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Phase Breakdown */}
      <div className="mt-4 grid grid-cols-5 gap-4">
        {PHASE_ORDER.map((phaseId) => {
          const phase = PHASE_CONFIG[phaseId];
          const data = distribution[phaseId];

          return (
            <button
              key={phaseId}
              className={cn(
                'rounded-lg border-2 p-3 text-left transition-all hover:shadow-md',
                hoveredPhase === phaseId ? phase.borderColor : 'border-slate-200',
                data.count === 0 && 'opacity-50'
              )}
              onMouseEnter={() => setHoveredPhase(phaseId)}
              onMouseLeave={() => setHoveredPhase(null)}
            >
              <div className="mb-1 flex items-center gap-2">
                <span className="text-xl">{phase.icon}</span>
                <span className={cn('text-sm font-semibold', phase.textColor)}>
                  {phase.name}
                </span>
              </div>
              <div className="text-2xl font-bold">{data.count}</div>
              <div className="text-xs text-muted-foreground">
                {data.percentage}% of work
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
