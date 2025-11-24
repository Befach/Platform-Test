'use client'

import { UseFormReturn } from 'react-hook-form'
import { WorkspacePhase } from '@/lib/constants/work-item-types'
import { usePhaseAwareFields } from '@/hooks/use-phase-aware-fields'
import { FieldLockIndicator } from './field-lock-indicator'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Info } from 'lucide-react'

interface PhaseAwareFormFieldsProps {
  form: UseFormReturn<any>
  phase: WorkspacePhase
  isEdit?: boolean
}

/**
 * Phase-aware form fields that adapt based on workspace phase
 *
 * Features:
 * - Progressive disclosure: Only shows fields relevant to current phase
 * - Field locking: Planning fields become read-only in Execution phase
 * - Visual indicators: Lock icons for locked fields
 * - Validation: Uses phase-aware Zod schema
 *
 * Phase Progression:
 * - Research: name, purpose, type, tags (basic fields only)
 * - Planning: + target_release, acceptance_criteria, business_value, etc.
 * - Execution: + actual dates, hours, progress tracking (planning fields locked)
 * - Review/Complete: All fields visible
 *
 * @example
 * ```tsx
 * const form = useForm({ resolver: zodResolver(getWorkItemSchema(phase)) })
 * <Form {...form}>
 *   <PhaseAwareFormFields form={form} phase="planning" />
 * </Form>
 * ```
 */
export function PhaseAwareFormFields({
  form,
  phase,
  isEdit = false,
}: PhaseAwareFormFieldsProps) {
  const { fieldGroups, lockedFields } = usePhaseAwareFields(phase)

  return (
    <div className="space-y-6">
      {/* Basic Fields - Always visible, never locked */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2">
          <h3 className="text-sm font-semibold">Basic Information</h3>
          <Badge variant="outline" className="text-xs">
            Required
          </Badge>
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Name <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., User authentication system"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Clear, descriptive name for this work item
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="purpose"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Purpose <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Why is this important? What problem does it solve?"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Explain the business value and user impact
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isEdit} // Type shouldn't change after creation
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="concept">💡 Concept</SelectItem>
                  <SelectItem value="feature">⭐ Feature</SelectItem>
                  <SelectItem value="bug">🐛 Bug</SelectItem>
                  <SelectItem value="enhancement">✨ Enhancement</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Work item category (cannot be changed after creation)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Planning Fields - Visible from Planning phase onwards */}
      {fieldGroups.planning.visible && (
        <div className="space-y-4 pt-6 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">Planning Details</h3>
              {fieldGroups.planning.locked && (
                <Badge variant="secondary" className="text-xs">
                  🔒 Locked
                </Badge>
              )}
            </div>
            {!fieldGroups.planning.locked && (
              <Badge variant="outline" className="text-xs">
                Available in {phase} phase
              </Badge>
            )}
          </div>

          {fieldGroups.planning.locked && (
            <div className="flex items-start gap-2 p-3 bg-muted rounded-md text-sm text-muted-foreground">
              <Info className="h-4 w-4 mt-0.5 shrink-0" />
              <p>
                Planning fields are locked in {phase} phase to maintain
                consistency during execution and review.
              </p>
            </div>
          )}

          <FormField
            control={form.control}
            name="target_release"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target Release</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., v2.0, Q3 2025"
                    disabled={lockedFields.includes('target_release')}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Which release should this be included in?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="acceptance_criteria"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Acceptance Criteria</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter one criterion per line:&#10;- User can log in with email and password&#10;- Session persists for 24 hours&#10;- Password reset flow works"
                    rows={4}
                    disabled={lockedFields.includes('acceptance_criteria')}
                    value={
                      Array.isArray(field.value)
                        ? field.value.join('\n')
                        : field.value || ''
                    }
                    onChange={(e) => {
                      // Convert newline-separated text to array
                      const lines = e.target.value
                        .split('\n')
                        .filter((line) => line.trim())
                      field.onChange(lines.length > 0 ? lines : null)
                    }}
                  />
                </FormControl>
                <FormDescription>
                  One criterion per line - will be saved as array
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="business_value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Value</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="How does this impact business goals?"
                    rows={2}
                    disabled={lockedFields.includes('business_value')}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="customer_impact"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer Impact</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="How will customers benefit from this?"
                    rows={2}
                    disabled={lockedFields.includes('customer_impact')}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="strategic_alignment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Strategic Alignment</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="How does this align with company strategy?"
                    rows={2}
                    disabled={lockedFields.includes('strategic_alignment')}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="estimated_hours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estimated Hours</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 40"
                      disabled={lockedFields.includes('estimated_hours')}
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value
                        field.onChange(value === '' ? undefined : Number(value))
                      }}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormDescription>
                    Time estimate for completion
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      )}

      {/* Execution Fields - Visible from Execution phase onwards */}
      {fieldGroups.execution.visible && (
        <div className="space-y-4 pt-6 border-t">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">Execution Tracking</h3>
            <Badge variant="outline" className="text-xs">
              Available in {phase} phase
            </Badge>
          </div>

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                    <SelectItem value="review">In Review</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Current work status
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="actual_start_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Actual Start Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormDescription>
                    When work actually began
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="actual_end_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Actual End Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormDescription>
                    When work was completed
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="actual_hours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Actual Hours</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 45"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value
                        field.onChange(value === '' ? undefined : Number(value))
                      }}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormDescription>
                    Time actually spent
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="progress_percent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Progress %</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="0-100"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value
                        field.onChange(value === '' ? undefined : Number(value))
                      }}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormDescription>
                    Completion percentage
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="blockers"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Blockers</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="List any blockers (one per line)"
                    rows={3}
                    value={
                      Array.isArray(field.value)
                        ? field.value
                            .map((b: any) =>
                              typeof b === 'string' ? b : b.description || ''
                            )
                            .join('\n')
                        : field.value || ''
                    }
                    onChange={(e) => {
                      // Convert newline-separated text to array of blocker objects
                      const lines = e.target.value
                        .split('\n')
                        .filter((line) => line.trim())
                      const blockers = lines.map((line, index) => ({
                        id: `${Date.now()}_${index}`,
                        description: line,
                        created_at: new Date().toISOString(),
                      }))
                      field.onChange(blockers.length > 0 ? blockers : null)
                    }}
                  />
                </FormControl>
                <FormDescription>
                  What's preventing progress? One per line
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}
    </div>
  )
}
