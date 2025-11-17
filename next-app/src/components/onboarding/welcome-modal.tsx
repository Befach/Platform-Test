'use client'

import { useState } from 'react'
import { Rocket, Sparkles, Users, BarChart3, CheckCircle2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface WelcomeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: () => void
  userName?: string
}

const features = [
  {
    icon: Sparkles,
    title: 'Mind Mapping',
    description: 'Brainstorm ideas with AI-powered mind maps',
  },
  {
    icon: CheckCircle2,
    title: 'Feature Planning',
    description: 'Organize features across MVP, Short, and Long term',
  },
  {
    icon: Users,
    title: 'Review & Feedback',
    description: 'Share with stakeholders and gather feedback',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    description: 'Track progress and measure success',
  },
]

export function WelcomeModal({
  open,
  onOpenChange,
  onComplete,
  userName,
}: WelcomeModalProps) {
  const [step, setStep] = useState(0)

  const handleNext = () => {
    if (step === 0) {
      setStep(1)
    } else {
      onComplete()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        {step === 0 ? (
          <>
            {/* Welcome Step */}
            <DialogHeader>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Rocket className="h-6 w-6 text-primary" />
              </div>
              <DialogTitle className="text-center text-2xl">
                Welcome{userName ? ` ${userName}` : ''}! 🎉
              </DialogTitle>
              <DialogDescription className="text-center text-base">
                Let's take a quick tour to help you get started with your product lifecycle
                management platform
              </DialogDescription>
            </DialogHeader>

            <div className="my-6 space-y-4">
              <div className="rounded-lg bg-muted/50 p-4">
                <h3 className="mb-2 font-semibold">What you can do:</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                    <span>Research ideas with AI-powered mind mapping</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                    <span>Plan features with dependencies and timelines</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                    <span>Gather feedback from stakeholders</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                    <span>Track analytics and measure success</span>
                  </li>
                </ul>
              </div>

              <div className="rounded-lg border bg-blue-50 p-4 dark:bg-blue-950/20">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-100">
                      Pro Tip
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Press <kbd className="rounded bg-blue-100 px-1.5 py-0.5 font-mono text-xs dark:bg-blue-900">Cmd+K</kbd> anytime to
                      open the command palette for quick navigation
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleNext} size="lg" className="w-full">
                Continue
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            {/* Features Overview Step */}
            <DialogHeader>
              <DialogTitle className="text-center text-2xl">
                Everything You Need
              </DialogTitle>
              <DialogDescription className="text-center text-base">
                A complete platform to manage your product from idea to launch
              </DialogDescription>
            </DialogHeader>

            <div className="my-6 grid gap-4 sm:grid-cols-2">
              {features.map((feature) => (
                <Card key={feature.title} className="border-2">
                  <CardContent className="pt-6">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="mb-1 font-semibold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <DialogFooter className="flex-col gap-2 sm:flex-row">
              <Button variant="outline" onClick={() => setStep(0)} className="w-full sm:w-auto">
                Back
              </Button>
              <Button onClick={handleNext} size="lg" className="w-full sm:flex-1">
                Get Started
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
