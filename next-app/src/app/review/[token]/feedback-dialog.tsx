'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Star, Loader2, Sparkles } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const formSchema = z.object({
  rating: z.number().min(1, 'Please select a rating').max(5),
  comment: z.string().optional(),
  reviewer_name: z.string().optional(),
  reviewer_email: z.string().email('Invalid email').optional().or(z.literal('')),
})

interface FeedbackDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workItem: {
    id: string
    name: string
    description: string | null
  } | null
  reviewLinkId: string
}

function StarRating({
  value,
  onChange,
  size = 'default',
}: {
  value: number
  onChange: (value: number) => void
  size?: 'default' | 'large'
}) {
  const [hoverValue, setHoverValue] = useState(0)
  const starSize = size === 'large' ? 'h-10 w-10' : 'h-6 w-6'

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHoverValue(star)}
          onMouseLeave={() => setHoverValue(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={cn(
              starSize,
              'transition-colors',
              (hoverValue || value) >= star
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            )}
          />
        </button>
      ))}
    </div>
  )
}

function SuccessConfetti() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-confetti"
          style={{
            left: `${Math.random() * 100}%`,
            top: '-10px',
            animationDelay: `${Math.random() * 0.5}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
          }}
        >
          <Sparkles
            className="text-yellow-400"
            style={{
              width: `${10 + Math.random() * 20}px`,
              height: `${10 + Math.random() * 20}px`,
            }}
          />
        </div>
      ))}
    </div>
  )
}

export function FeedbackDialog({
  open,
  onOpenChange,
  workItem,
  reviewLinkId,
}: FeedbackDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rating: 0,
      comment: '',
      reviewer_name: '',
      reviewer_email: '',
    },
  })

  const rating = form.watch('rating')

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!workItem) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          review_link_id: reviewLinkId,
          feature_id: workItem.id,
          rating: values.rating,
          comment: values.comment || null,
          reviewer_name: values.reviewer_name || null,
          reviewer_email: values.reviewer_email || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit feedback')
      }

      // Show success state with confetti
      setIsSuccess(true)

      toast({
        title: 'Feedback Submitted! 🎉',
        description: 'Thank you for your valuable feedback!',
      })

      // Close dialog after 2 seconds
      setTimeout(() => {
        setIsSuccess(false)
        onOpenChange(false)
        form.reset()
      }, 2000)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit feedback',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!workItem) return null

  if (isSuccess) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] relative overflow-hidden">
          <SuccessConfetti />
          <div className="text-center py-8 relative z-10">
            <div className="text-6xl mb-4 animate-bounce">🎉</div>
            <h3 className="text-2xl font-bold mb-2">Thank You!</h3>
            <p className="text-muted-foreground">
              Your feedback has been submitted successfully
            </p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Leave Feedback</DialogTitle>
          <DialogDescription className="text-base">
            Share your thoughts about: <strong>{workItem.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Star Rating */}
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">How would you rate this feature?</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <StarRating value={field.value} onChange={field.onChange} size="large" />
                      {rating > 0 && (
                        <p className="text-sm text-muted-foreground">
                          {rating === 1 && 'Poor - Needs significant improvement'}
                          {rating === 2 && 'Fair - Could be better'}
                          {rating === 3 && 'Good - Meets expectations'}
                          {rating === 4 && 'Very Good - Exceeds expectations'}
                          {rating === 5 && 'Excellent - Outstanding!'}
                        </p>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Comment */}
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comments (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Share your thoughts, suggestions, or concerns..."
                      className="min-h-[120px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Help us understand your rating by providing details
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Reviewer Name */}
            <FormField
              control={form.control}
              name="reviewer_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Name (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Reviewer Email */}
            <FormField
              control={form.control}
              name="reviewer_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Email (Optional)</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john@example.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    We may follow up with you about your feedback
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || rating === 0}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Feedback
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
