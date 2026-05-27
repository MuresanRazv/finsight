import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface TagInputProps extends Omit<
    React.ComponentProps<'div'>,
    'value' | 'onChange'
> {
    value?: string[]
    onChange?: (value: string[]) => void
    placeholder?: string
    disabled?: boolean
}

export function TagInput({
    className,
    value = [],
    onChange,
    placeholder = 'Add ticker...',
    disabled = false,
    ...props
}: TagInputProps) {
    const [inputValue, setInputValue] = React.useState('')
    const inputRef = React.useRef<HTMLInputElement>(null)

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (disabled) return

        if (e.key === 'Enter') {
            e.preventDefault()
            const trimmed = inputValue.trim().toUpperCase()
            if (trimmed && !value.includes(trimmed)) {
                const newValue = [...value, trimmed]
                onChange?.(newValue)
                setInputValue('')
            }
        } else if (e.key === ',' || e.key === ' ') {
            e.preventDefault()
            const trimmed = inputValue.trim().toUpperCase()
            if (trimmed && !value.includes(trimmed)) {
                const newValue = [...value, trimmed]
                onChange?.(newValue)
                setInputValue('')
            }
        } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
            e.preventDefault()
            const newValue = value.slice(0, -1)
            onChange?.(newValue)
        }
    }

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        if (disabled) return
        e.preventDefault()
        const pastedText = e.clipboardData.getData('text')
        const tags = pastedText
            .split(/[,;\s]+/)
            .map((t) => t.trim().toUpperCase())
            .filter((t) => t.length > 0)

        if (tags.length > 0) {
            const uniqueNewTags = tags.filter((t) => !value.includes(t))
            if (uniqueNewTags.length > 0) {
                onChange?.([...value, ...uniqueNewTags])
            }
        }
    }

    const removeTag = (tagToRemove: string) => {
        if (disabled) return
        const newValue = value.filter((t) => t !== tagToRemove)
        onChange?.(newValue)
    }

    return (
        <div
            onClick={() => inputRef.current?.focus()}
            className={cn(
                'border-input dark:bg-input/30 flex min-h-9 w-full cursor-text flex-wrap items-center gap-1.5 rounded-md border bg-transparent px-3 py-1.5 text-base shadow-xs transition-[color,box-shadow] outline-none',
                'focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]',
                disabled && 'pointer-events-none cursor-not-allowed opacity-50',
                className,
            )}
            {...props}
        >
            {value.map((tag) => (
                <Badge
                    key={tag}
                    variant='outline'
                    className='flex items-center gap-1 border-slate-700 bg-slate-800/90 py-0.5 pr-1 pl-2.5 text-xs font-semibold tracking-wider text-slate-100 uppercase shadow-xs'
                >
                    {tag}
                    <button
                        type='button'
                        onClick={(e) => {
                            e.stopPropagation()
                            removeTag(tag)
                        }}
                        disabled={disabled}
                        className='cursor-pointer rounded-full p-0.5 text-slate-400 transition-colors outline-none hover:bg-slate-700 hover:text-slate-100'
                    >
                        <X className='h-3.5 w-3.5' />
                    </button>
                </Badge>
            ))}
            <input
                ref={inputRef}
                type='text'
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                disabled={disabled}
                placeholder={value.length === 0 ? placeholder : ''}
                className='placeholder:text-muted-foreground text-foreground max-w-full min-w-[120px] flex-1 border-0 bg-transparent p-0 text-sm outline-none focus:ring-0'
            />
        </div>
    )
}
