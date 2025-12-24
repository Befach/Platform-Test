'use client'

/**
 * Concept Phase Stepper Component
 *
 * Visual representation of concept lifecycle:
 * [Ideation] → [Research] → [Validated]
 *                        └→ [Rejected] (branch below)
 *
 * Shows:
 * - Current phase highlighted
 * - Past phases with checkmark
 * - Future phases grayed out
 * - Rejected branch shown below if concept is rejected
 */

import { Check, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  getConceptPhaseConfig,
  getConceptColors,
  type ConceptPhase,
} from '@/lib/concept/workflow'

// =============================================================================
// TYPES
// =============================================================================

interface ConceptPhaseStepperProps {
  currentPhase: ConceptPhase
  className?: string
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ConceptPhaseStepper({
  currentPhase,
  className,
}: ConceptPhaseStepperProps) {
  // Main flow: ideation → research → validated (skip rejected in main flow)
  const mainPhases: ConceptPhase[] = ['ideation', 'research', 'validated']
  const currentIndex = mainPhases.indexOf(currentPhase)
  const isRejected = currentPhase === 'rejected'

  return (
    <div className={cn('w-full', className)}>
      {/* Main flow: ideation → research → validated */}
      <div className="flex items-center justify-between">
        {mainPhases.map((phase, index) => {
          const config = getConceptPhaseConfig(phase)
          if (!config) return null

          const Icon = config.icon
          const colors = getConceptColors(phase)
          const isActive = phase === currentPhase
          const isPast = index < currentIndex && !isRejected
          const isFuture = index > currentIndex && !isRejected

          return (
            <div key={phase} className="flex items-center flex-1">
              {/* Step circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200',
                    isActive && `${colors.border} ${colors.bg}`,
                    isPast && 'border-green-500 bg-green-50',
                    isFuture && 'border-gray-300 bg-white',
                    isRejected &&
                      phase !== 'rejected' &&
                      'border-gray-200 bg-gray-50 opacity-50'
                  )}
                >
                  {isPast ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <Icon
                      className={cn(
                        'w-5 h-5',
                        isActive && colors.text,
                        isFuture && 'text-gray-400',
                        isRejected && phase !== 'rejected' && 'text-gray-300'
                      )}
                    />
                  )}
                </div>
                <span
                  className={cn(
                    'mt-2 text-sm font-medium',
                    isActive && colors.text,
                    isPast && 'text-gray-700',
                    isFuture && 'text-gray-500',
                    isRejected && phase !== 'rejected' && 'text-gray-400'
                  )}
                >
                  {config.label}
                </span>
              </div>

              {/* Connector line */}
              {index < mainPhases.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-4 transition-all duration-200',
                    isPast ? 'bg-green-500' : 'bg-gray-300',
                    isRejected && 'bg-gray-200 opacity-50'
                  )}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Rejected branch (shown below if rejected) */}
      {isRejected && (
        <div className="mt-6 flex justify-center">
          <div className="flex flex-col items-center">
            {/* Vertical connector */}
            <div className="w-0.5 h-8 bg-red-300" />

            {/* Rejected phase circle */}
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-red-500 bg-red-50">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>

            {/* Rejected label */}
            <span className="mt-2 text-sm font-medium text-red-700">
              Rejected
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
