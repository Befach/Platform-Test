'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Loader2, UserPlus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { PHASE_CONFIG, PHASE_ORDER, type WorkspacePhase } from '@/lib/constants/workspace-phases'
import type { InvitationPhaseAssignment } from '@/lib/types/team'

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'member'], {
    required_error: 'Please select a role',
  }),
  workspace_id: z.string().min(1, 'Please select a workspace'),
  phases: z.array(z.string()).min(1, 'Please select at least one phase'),
})

type InviteFormValues = z.infer<typeof inviteSchema>

interface InviteMemberDialogProps {
  teamId: string
  /** Optional: Pre-select a specific workspace */
  preSelectedWorkspaceId?: string
  /** Optional: Custom trigger button */
  trigger?: React.ReactNode
}

interface Workspace {
  id: string
  name: string
  phase: string
}

export function InviteMemberDialog({
  teamId,
  preSelectedWorkspaceId,
  trigger,
}: InviteMemberDialogProps) {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch workspaces for this team
  const { data: workspaces, isLoading: loadingWorkspaces } = useQuery({
    queryKey: ['team-workspaces', teamId],
    queryFn: async () => {
      const response = await fetch(`/api/team/workspaces?team_id=${teamId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch workspaces')
      }
      return response.json() as Promise<Workspace[]>
    },
    enabled: open,
  })

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      role: 'member',
      workspace_id: preSelectedWorkspaceId || '',
      phases: [],
    },
  })

  // Send invitation mutation
  const mutation = useMutation({
    mutationFn: async (data: InviteFormValues) => {
      const phaseAssignments: InvitationPhaseAssignment[] = data.phases.map((phase) => ({
        workspace_id: data.workspace_id,
        phase: phase as WorkspacePhase,
        can_edit: true,
      }))

      const response = await fetch('/api/team/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_id: teamId,
          email: data.email,
          role: data.role,
          phase_assignments: phaseAssignments,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send invitation')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] })
      queryClient.invalidateQueries({ queryKey: ['pending-invitations', teamId] })
      toast({
        title: 'Invitation sent',
        description: 'The team member will receive an email invitation.',
      })
      setOpen(false)
      form.reset()
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to send invitation',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const onSubmit = (data: InviteFormValues) => {
    mutation.mutate(data)
  }

  // Toggle all phases
  const selectedPhases = form.watch('phases')
  const toggleAllPhases = () => {
    if (selectedPhases.length === PHASE_ORDER.length) {
      form.setValue('phases', [])
    } else {
      form.setValue('phases', [...PHASE_ORDER])
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="default">
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Team Member
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Send an invitation to join your team with specific phase access.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Email Field */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="name@example.com"
                      type="email"
                      autoComplete="email"
                      disabled={mutation.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Role Field */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={mutation.isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Admins can manage team members and settings
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Workspace Field */}
            <FormField
              control={form.control}
              name="workspace_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Workspace Access *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={mutation.isPending || loadingWorkspaces}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a workspace" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {loadingWorkspaces ? (
                        <div className="flex items-center justify-center py-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : workspaces && workspaces.length > 0 ? (
                        workspaces.map((workspace) => (
                          <SelectItem key={workspace.id} value={workspace.id}>
                            {workspace.name}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          No workspaces found
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phase Permissions */}
            <FormField
              control={form.control}
              name="phases"
              render={() => (
                <FormItem>
                  <div className="flex items-center justify-between mb-3">
                    <FormLabel>Phase Permissions</FormLabel>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={toggleAllPhases}
                      disabled={mutation.isPending}
                    >
                      {selectedPhases.length === PHASE_ORDER.length
                        ? 'Deselect All'
                        : 'Select All'}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {PHASE_ORDER.map((phase) => {
                      const config = PHASE_CONFIG[phase]
                      return (
                        <FormField
                          key={phase}
                          control={form.control}
                          name="phases"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={phase}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(phase)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, phase])
                                        : field.onChange(
                                            field.value?.filter((value) => value !== phase)
                                          )
                                    }}
                                    disabled={mutation.isPending}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <Label className="flex items-center gap-2 cursor-pointer">
                                    <span className="text-lg">{config.icon}</span>
                                    <span className="font-medium">{config.name}</span>
                                  </Label>
                                  <p className="text-sm text-muted-foreground">
                                    {config.description}
                                  </p>
                                </div>
                              </FormItem>
                            )
                          }}
                        />
                      )
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Invitation'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
