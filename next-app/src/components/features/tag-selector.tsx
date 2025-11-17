'use client'

import { useState, useEffect } from 'react'
import { Check, ChevronsUpDown, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'

interface Tag {
  id: string
  name: string
  color: string
}

interface TagSelectorProps {
  teamId: string
  selectedTags: string[] // Array of tag names
  onTagsChange: (tags: string[]) => void
}

export function TagSelector({ teamId, selectedTags, onTagsChange }: TagSelectorProps) {
  const [open, setOpen] = useState(false)
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const supabase = createClient()

  // Load existing tags for the team
  useEffect(() => {
    loadTags()
  }, [teamId])

  const loadTags = async () => {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('team_id', teamId)
      .order('name')

    if (!error && data) {
      setAvailableTags(data)
    }
  }

  const createTag = async (name: string) => {
    setLoading(true)
    const newTag: Tag = {
      id: Date.now().toString(),
      name: name.trim(),
      color: getRandomColor(),
    }

    const { data, error } = await supabase
      .from('tags')
      .insert({
        ...newTag,
        team_id: teamId,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .select()
      .single()

    if (!error && data) {
      setAvailableTags([...availableTags, data])
      onTagsChange([...selectedTags, data.name])
      setSearchValue('')
    }
    setLoading(false)
  }

  const toggleTag = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      onTagsChange(selectedTags.filter((t) => t !== tagName))
    } else {
      onTagsChange([...selectedTags, tagName])
    }
  }

  const removeTag = (tagName: string) => {
    onTagsChange(selectedTags.filter((t) => t !== tagName))
  }

  const getRandomColor = () => {
    const colors = [
      '#6366f1', // indigo
      '#8b5cf6', // violet
      '#ec4899', // pink
      '#f43f5e', // rose
      '#f97316', // orange
      '#eab308', // yellow
      '#22c55e', // green
      '#14b8a6', // teal
      '#06b6d4', // cyan
      '#3b82f6', // blue
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  const filteredTags = availableTags.filter(
    (tag) =>
      tag.name.toLowerCase().includes(searchValue.toLowerCase()) &&
      !selectedTags.includes(tag.name)
  )

  const canCreateNewTag =
    searchValue.trim() &&
    !availableTags.some((t) => t.name.toLowerCase() === searchValue.toLowerCase())

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              Add tags...
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0">
            <Command>
              <CommandInput
                placeholder="Search or create tags..."
                value={searchValue}
                onValueChange={setSearchValue}
              />
              <CommandList>
                <CommandEmpty>
                  {canCreateNewTag && (
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => createTag(searchValue)}
                      disabled={loading}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create "{searchValue}"
                    </Button>
                  )}
                </CommandEmpty>
                <CommandGroup>
                  {filteredTags.map((tag) => (
                    <CommandItem
                      key={tag.id}
                      value={tag.name}
                      onSelect={() => {
                        toggleTag(tag.name)
                        setSearchValue('')
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          selectedTags.includes(tag.name) ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tagName) => {
            const tag = availableTags.find((t) => t.name === tagName)
            return (
              <Badge
                key={tagName}
                variant="secondary"
                className="pl-2 pr-1"
                style={{
                  backgroundColor: tag?.color ? `${tag.color}20` : undefined,
                  borderColor: tag?.color,
                  color: tag?.color,
                }}
              >
                {tagName}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                  onClick={() => removeTag(tagName)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}
