'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { WelcomeModal } from './welcome-modal'
import { ProductTour, TourStep } from './product-tour'

interface OnboardingState {
  hasSeenWelcome: boolean
  hasCompletedTour: boolean
  checklistItems: Record<string, boolean>
}

interface OnboardingContextValue {
  state: OnboardingState
  startTour: () => void
  completeTourStep: (stepIndex: number) => void
  completeChecklistItem: (itemId: string) => void
  resetOnboarding: () => void
}

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined)

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider')
  }
  return context
}

interface OnboardingProviderProps {
  children: ReactNode
  tourSteps?: TourStep[]
  userName?: string
  userId?: string
}

const STORAGE_KEY = 'onboarding_state'

export function OnboardingProvider({
  children,
  tourSteps = [],
  userName,
  userId,
}: OnboardingProviderProps) {
  const [state, setState] = useState<OnboardingState>({
    hasSeenWelcome: false,
    hasCompletedTour: false,
    checklistItems: {},
  })

  const [showWelcome, setShowWelcome] = useState(false)
  const [showTour, setShowTour] = useState(false)

  // Load state from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return

    const stored = localStorage.getItem(`${STORAGE_KEY}_${userId || 'default'}`)
    if (stored) {
      try {
        setState(JSON.parse(stored))
      } catch (error) {
        console.error('Failed to parse onboarding state:', error)
      }
    } else {
      // First time user - show welcome
      setShowWelcome(true)
    }
  }, [userId])

  // Save state to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem(`${STORAGE_KEY}_${userId || 'default'}`, JSON.stringify(state))
  }, [state, userId])

  const startTour = () => {
    setShowTour(true)
  }

  const completeTourStep = (stepIndex: number) => {
    // Optional: Track individual step completion
  }

  const completeChecklistItem = (itemId: string) => {
    setState((prev) => ({
      ...prev,
      checklistItems: {
        ...prev.checklistItems,
        [itemId]: true,
      },
    }))
  }

  const resetOnboarding = () => {
    setState({
      hasSeenWelcome: false,
      hasCompletedTour: false,
      checklistItems: {},
    })
    setShowWelcome(true)
  }

  const handleWelcomeComplete = () => {
    setState((prev) => ({ ...prev, hasSeenWelcome: true }))
    setShowWelcome(false)

    // Auto-start tour after welcome
    if (tourSteps.length > 0) {
      setTimeout(() => {
        setShowTour(true)
      }, 500)
    }
  }

  const handleTourComplete = () => {
    setState((prev) => ({ ...prev, hasCompletedTour: true }))
    setShowTour(false)
  }

  const handleTourSkip = () => {
    setShowTour(false)
  }

  const contextValue: OnboardingContextValue = {
    state,
    startTour,
    completeTourStep,
    completeChecklistItem,
    resetOnboarding,
  }

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}

      {/* Welcome Modal */}
      <WelcomeModal
        open={showWelcome}
        onOpenChange={setShowWelcome}
        onComplete={handleWelcomeComplete}
        userName={userName}
      />

      {/* Product Tour */}
      {tourSteps.length > 0 && (
        <ProductTour
          steps={tourSteps}
          isActive={showTour}
          onComplete={handleTourComplete}
          onSkip={handleTourSkip}
        />
      )}
    </OnboardingContext.Provider>
  )
}
