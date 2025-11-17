'use client'

import { useState, useRef, useEffect } from 'react'
import { Check, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

interface InlineEditTextProps {
  value: string
  onSave: (value: string) => Promise<void>
  placeholder?: string
  className?: string
  multiline?: boolean
  disabled?: boolean
}

export function InlineEditText({
  value,
  onSave,
  placeholder = 'Click to edit',
  className,
  multiline = false,
  disabled = false,
}: InlineEditTextProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [tempValue, setTempValue] = useState(value)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)
  const { toast } = useToast()

  // Update tempValue when value prop changes
  useEffect(() => {
    setTempValue(value)
  }, [value])

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSave = async () => {
    if (tempValue === value) {
      setIsEditing(false)
      return
    }

    setIsLoading(true)
    try {
      await onSave(tempValue)
      setIsEditing(false)
      toast({
        title: 'Saved',
        description: 'Changes saved successfully',
      })
    } catch (error: any) {
      console.error('Failed to save:', error)
      setTempValue(value) // Rollback on error
      toast({
        title: 'Error',
        description: error.message || 'Failed to save changes',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setTempValue(value)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    } else if (e.key === 'Enter' && multiline && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSave()
    }
  }

  if (isEditing) {
    return (
      <div className={cn('flex items-start gap-2', className)}>
        {multiline ? (
          <Textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 min-h-[80px]"
            disabled={isLoading}
          />
        ) : (
          <Input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
            disabled={isLoading}
          />
        )}
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={handleSave}
            disabled={isLoading}
            className="h-8 w-8"
            title="Save (Enter)"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 text-green-600" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleCancel}
            disabled={isLoading}
            className="h-8 w-8"
            title="Cancel (Esc)"
          >
            <X className="h-4 w-4 text-red-600" />
          </Button>
        </div>
        {multiline && (
          <div className="text-xs text-muted-foreground mt-1">
            Press Cmd+Enter to save
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      onClick={() => !disabled && setIsEditing(true)}
      className={cn(
        'cursor-pointer rounded px-2 py-1 transition-colors min-h-[36px] flex items-center',
        disabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-accent',
        !value && 'text-muted-foreground italic',
        className
      )}
      title={disabled ? undefined : 'Click to edit'}
    >
      {value || placeholder}
    </div>
  )
}

interface InlineEditSelectProps {
  value: string
  options: { value: string; label: string }[]
  onSave: (value: string) => Promise<void>
  className?: string
  disabled?: boolean
}

export function InlineEditSelect({
  value,
  options,
  onSave,
  className,
  disabled = false,
}: InlineEditSelectProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [tempValue, setTempValue] = useState(value)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setTempValue(value)
  }, [value])

  const handleSave = async () => {
    if (tempValue === value) {
      setIsEditing(false)
      return
    }

    setIsLoading(true)
    try {
      await onSave(tempValue)
      setIsEditing(false)
      toast({
        title: 'Saved',
        description: 'Changes saved successfully',
      })
    } catch (error: any) {
      console.error('Failed to save:', error)
      setTempValue(value)
      toast({
        title: 'Error',
        description: error.message || 'Failed to save changes',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setTempValue(value)
    setIsEditing(false)
  }

  const currentOption = options.find((opt) => opt.value === value)

  if (isEditing) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <select
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isLoading}
          autoFocus
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={handleSave}
            disabled={isLoading}
            className="h-8 w-8"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 text-green-600" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleCancel}
            disabled={isLoading}
            className="h-8 w-4" >
            <X className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={() => !disabled && setIsEditing(true)}
      className={cn(
        'cursor-pointer rounded px-2 py-1 transition-colors min-h-[36px] flex items-center',
        disabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-accent',
        className
      )}
      title={disabled ? undefined : 'Click to edit'}
    >
      {currentOption?.label || value}
    </div>
  )
}
