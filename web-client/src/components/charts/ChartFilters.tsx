import React, { useState } from 'react'
import { FilterDefinition } from '@/lib/types/article'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { ChevronDown, Check, Search } from 'lucide-react'

interface ChartFiltersProps {
    filters: FilterDefinition[]
    activeFilters: Record<string, unknown>
    onFilterChange: (key: string, value: string) => void
}

export function ChartFilters({
    filters,
    activeFilters,
    onFilterChange,
}: ChartFiltersProps) {
    const [openFilterKey, setOpenFilterKey] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')

    if (!filters || filters.length === 0) return null

    return (
        <div className='bg-card text-card-foreground mb-3 flex flex-col sm:flex-row flex-wrap gap-4 rounded-lg border p-3 md:p-4 shadow-sm w-full min-w-0'>
            {filters.map((filter) => {
                const filterKey = filter.key
                if (!filterKey) return null

                const useDropdown = filter.options && filter.options.length > 3

                return (
                    <div
                        key={filterKey}
                        className='flex flex-col gap-1.5 min-w-0'
                        style={{ flex: useDropdown ? '0 0 auto' : '1 1 0%' }}
                    >
                        <Label
                            className='text-xs font-bold text-muted-foreground uppercase tracking-wider pl-0.5'
                        >
                            {filter.label || filterKey}
                        </Label>

                        {filter.type === 'DATE_RANGE' && (
                            <Input
                                id={filterKey}
                                type='date'
                                value={(activeFilters[filterKey] as string) || ''}
                                onChange={(e) =>
                                    onFilterChange(filterKey, e.target.value)
                                }
                                className='w-full h-9 text-xs py-1 px-2.5'
                            />
                        )}

                        {(filter.type === 'SELECT' ||
                            filter.type === 'MULTI_SELECT') && (
                            <>
                                {useDropdown ? (
                                    <Popover
                                        open={openFilterKey === filterKey}
                                        onOpenChange={(isOpen) => {
                                            setOpenFilterKey(isOpen ? filterKey : null)
                                            if (!isOpen) setSearchQuery('')
                                        }}
                                    >
                                        <PopoverTrigger asChild>
                                            <button
                                                type='button'
                                                className='flex items-center justify-between h-9 min-w-[140px] w-full sm:w-48 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-background text-foreground hover:bg-accent transition-all cursor-pointer text-left shadow-xs'
                                            >
                                                <span className='truncate mr-2'>
                                                    {((activeFilters[filterKey] as string) ||
                                                        (filter.default_value as string)) ||
                                                        (filter.options?.[0] || '')}
                                                </span>
                                                <ChevronDown className='h-3.5 w-3.5 shrink-0 text-muted-foreground' />
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent
                                            align='start'
                                            side='bottom'
                                            sideOffset={4}
                                            className='border-border bg-card dark w-56 p-1.5 rounded-xl shadow-xl'
                                        >
                                            {filter.options && filter.options.length > 5 && (
                                                <div className='flex items-center gap-1.5 px-2 py-1.5 border-b border-border/40 mb-1'>
                                                    <Search className='h-3.5 w-3.5 text-muted-foreground shrink-0' />
                                                    <input
                                                        type='text'
                                                        placeholder={`Search ${filter.label || filterKey}...`}
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                        className='w-full bg-transparent border-0 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0 p-0 font-medium'
                                                        autoFocus
                                                    />
                                                </div>
                                            )}
                                            <div className='max-h-56 overflow-y-auto space-y-0.5 scrollbar-thin scrollbar-thumb-border'>
                                                {filter.options
                                                    ?.filter((option) =>
                                                        option
                                                            .toLowerCase()
                                                            .includes(searchQuery.toLowerCase())
                                                    )
                                                    .map((option) => {
                                                        const isSelected =
                                                            (activeFilters[filterKey] as string) === option ||
                                                            (!activeFilters[filterKey] &&
                                                                (filter.default_value as string) === option)

                                                        return (
                                                            <button
                                                                type='button'
                                                                key={option}
                                                                onClick={() => {
                                                                    onFilterChange(filterKey, option)
                                                                    setOpenFilterKey(null)
                                                                    setSearchQuery('')
                                                                }}
                                                                className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors cursor-pointer text-left ${
                                                                    isSelected
                                                                        ? 'bg-primary/10 text-primary font-bold'
                                                                        : 'hover:bg-accent text-muted-foreground hover:text-foreground'
                                                                }`}
                                                            >
                                                                <span className='truncate'>{option}</span>
                                                                {isSelected && (
                                                                    <Check className='h-3 w-3 text-primary shrink-0' />
                                                                )}
                                                            </button>
                                                        )
                                                    })}
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                ) : (
                                    <div className='flex overflow-x-auto gap-1.5 py-0.5 scrollbar-none whitespace-nowrap min-w-0'>
                                        {filter.options?.map((option) => {
                                            const isSelected =
                                                (activeFilters[filterKey] as string) === option ||
                                                (!activeFilters[filterKey] &&
                                                    (filter.default_value as string) === option)

                                            return (
                                                <button
                                                    type='button'
                                                    key={option}
                                                    onClick={() => onFilterChange(filterKey, option)}
                                                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
                                                        isSelected
                                                            ? 'bg-primary text-primary-foreground border-primary shadow-sm font-bold'
                                                            : 'bg-background hover:bg-accent border-border text-muted-foreground hover:text-foreground'
                                                    }`}
                                                >
                                                    {option}
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
