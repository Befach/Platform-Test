'use client'

/**
 * Shape Toolbar Component
 *
 * Provides shape selection and formatting controls for the freeform canvas:
 * - Shape type selector (Rectangle, Circle, Sticky Note, Text, Arrow, Work Item Reference)
 * - Color pickers (background, border, text)
 * - Size controls (width, height)
 * - Text formatting (font size, alignment, weight)
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { ShapeType, SHAPE_TYPE_CONFIGS } from '@/lib/types/mind-map'

export interface ShapeToolbarProps {
  selectedShape: ShapeType
  onShapeChange: (shape: ShapeType) => void
  backgroundColor?: string
  onBackgroundColorChange?: (color: string) => void
  borderColor?: string
  onBorderColorChange?: (color: string) => void
  fontSize?: 'sm' | 'base' | 'lg' | 'xl'
  onFontSizeChange?: (size: 'sm' | 'base' | 'lg' | 'xl') => void
  textAlign?: 'left' | 'center' | 'right'
  onTextAlignChange?: (align: 'left' | 'center' | 'right') => void
  fontWeight?: 'normal' | 'semibold' | 'bold'
  onFontWeightChange?: (weight: 'normal' | 'semibold' | 'bold') => void
  onAddWorkItemReference?: () => void
  className?: string
}

const colorPresets = [
  { label: 'White', value: '#ffffff' },
  { label: 'Gray', value: '#f3f4f6' },
  { label: 'Blue', value: '#dbeafe' },
  { label: 'Green', value: '#d1fae5' },
  { label: 'Yellow', value: '#fef3c7' },
  { label: 'Red', value: '#fee2e2' },
  { label: 'Purple', value: '#ede9fe' },
  { label: 'Pink', value: '#fce7f3' },
]

const borderColorPresets = [
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Gray', value: '#6b7280' },
  { label: 'Green', value: '#10b981' },
  { label: 'Red', value: '#ef4444' },
  { label: 'Purple', value: '#8b5cf6' },
  { label: 'Amber', value: '#f59e0b' },
]

export function ShapeToolbar({
  selectedShape,
  onShapeChange,
  backgroundColor = '#ffffff',
  onBackgroundColorChange,
  borderColor = '#3b82f6',
  onBorderColorChange,
  fontSize = 'base',
  onFontSizeChange,
  textAlign = 'left',
  onTextAlignChange,
  fontWeight = 'normal',
  onFontWeightChange,
  onAddWorkItemReference,
  className,
}: ShapeToolbarProps) {
  const [customBgColor, setCustomBgColor] = useState(backgroundColor)
  const [customBorderColor, setCustomBorderColor] = useState(borderColor)

  const shapes: ShapeType[] = [
    'semantic',
    'rectangle',
    'circle',
    'sticky_note',
    'text',
    'arrow',
    'work_item_reference',
  ]

  const handleShapeClick = (shape: ShapeType) => {
    if (shape === 'work_item_reference' && onAddWorkItemReference) {
      onAddWorkItemReference()
    } else {
      onShapeChange(shape)
    }
  }

  const showColorControls = ['semantic', 'rectangle', 'circle', 'sticky_note'].includes(selectedShape)
  const showTextControls = ['text'].includes(selectedShape)

  return (
    <div className={cn('flex items-center gap-2 bg-white rounded-lg p-2 shadow-sm border', className)}>
      <TooltipProvider delayDuration={300}>
        {/* Shape Selector */}
        <div className="flex items-center gap-1">
          {shapes.map((shape) => {
            const config = SHAPE_TYPE_CONFIGS[shape]
            const isActive = selectedShape === shape

            return (
              <Tooltip key={shape}>
                <TooltipTrigger asChild>
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => handleShapeClick(shape)}
                    className={cn(
                      'w-9 h-9 p-0',
                      isActive && 'shadow-sm'
                    )}
                  >
                    <span className="text-base">{config.icon}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-semibold">{config.label}</p>
                  <p className="text-xs text-muted-foreground">{config.description}</p>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Color Controls (for shapes that support colors) */}
        {showColorControls && (
          <>
            {/* Background Color */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <div
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor }}
                  />
                  <span className="text-xs">Fill</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64">
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Presets</Label>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {colorPresets.map((preset) => (
                        <button
                          key={preset.value}
                          className="w-full aspect-square rounded border-2 hover:scale-110 transition-transform"
                          style={{
                            backgroundColor: preset.value,
                            borderColor: backgroundColor === preset.value ? '#3b82f6' : '#e5e7eb',
                          }}
                          onClick={() => onBackgroundColorChange?.(preset.value)}
                          title={preset.label}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="custom-bg-color" className="text-xs">Custom Color</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="custom-bg-color"
                        type="color"
                        value={customBgColor}
                        onChange={(e) => setCustomBgColor(e.target.value)}
                        className="w-12 h-8 p-1"
                      />
                      <Input
                        type="text"
                        value={customBgColor}
                        onChange={(e) => setCustomBgColor(e.target.value)}
                        placeholder="#ffffff"
                        className="flex-1 h-8"
                      />
                      <Button
                        size="sm"
                        onClick={() => onBackgroundColorChange?.(customBgColor)}
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Border Color */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <div
                    className="w-4 h-4 rounded border-2"
                    style={{ borderColor }}
                  />
                  <span className="text-xs">Border</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64">
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Presets</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {borderColorPresets.map((preset) => (
                        <button
                          key={preset.value}
                          className="w-full aspect-square rounded border-4 hover:scale-110 transition-transform"
                          style={{
                            borderColor: preset.value,
                            backgroundColor: borderColor === preset.value ? '#f3f4f6' : 'white',
                          }}
                          onClick={() => onBorderColorChange?.(preset.value)}
                          title={preset.label}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="custom-border-color" className="text-xs">Custom Color</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="custom-border-color"
                        type="color"
                        value={customBorderColor}
                        onChange={(e) => setCustomBorderColor(e.target.value)}
                        className="w-12 h-8 p-1"
                      />
                      <Input
                        type="text"
                        value={customBorderColor}
                        onChange={(e) => setCustomBorderColor(e.target.value)}
                        placeholder="#3b82f6"
                        className="flex-1 h-8"
                      />
                      <Button
                        size="sm"
                        onClick={() => onBorderColorChange?.(customBorderColor)}
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Separator orientation="vertical" className="h-6" />
          </>
        )}

        {/* Text Formatting Controls (for text nodes) */}
        {showTextControls && (
          <>
            {/* Font Size */}
            <Select value={fontSize} onValueChange={onFontSizeChange}>
              <SelectTrigger className="w-24 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sm">Small</SelectItem>
                <SelectItem value="base">Medium</SelectItem>
                <SelectItem value="lg">Large</SelectItem>
                <SelectItem value="xl">X-Large</SelectItem>
              </SelectContent>
            </Select>

            {/* Text Align */}
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={textAlign === 'left' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => onTextAlignChange?.('left')}
                    className="w-8 h-8 p-0"
                  >
                    ≡
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Align Left</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={textAlign === 'center' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => onTextAlignChange?.('center')}
                    className="w-8 h-8 p-0"
                  >
                    ≡
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Align Center</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={textAlign === 'right' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => onTextAlignChange?.('right')}
                    className="w-8 h-8 p-0"
                  >
                    ≡
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Align Right</TooltipContent>
              </Tooltip>
            </div>

            {/* Font Weight */}
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={fontWeight === 'normal' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => onFontWeightChange?.('normal')}
                    className="w-8 h-8 p-0 font-normal"
                  >
                    T
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Normal</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={fontWeight === 'semibold' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => onFontWeightChange?.('semibold')}
                    className="w-8 h-8 p-0 font-semibold"
                  >
                    T
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Semibold</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={fontWeight === 'bold' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => onFontWeightChange?.('bold')}
                    className="w-8 h-8 p-0 font-bold"
                  >
                    T
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Bold</TooltipContent>
              </Tooltip>
            </div>
          </>
        )}
      </TooltipProvider>
    </div>
  )
}
