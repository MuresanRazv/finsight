import React from 'react'
import { FilterDefinition } from '@/lib/types/article'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ChartFiltersProps {
    filters: FilterDefinition[]
    activeFilters: Record<string, unknown>
    onFilterChange: (key: string, value: unknown) => void
    showAllOption?: boolean
}

export function ChartFilters({
    filters,
    activeFilters,
    onFilterChange,
    showAllOption = false,
}: ChartFiltersProps) {
    if (!filters || filters.length === 0) return null

    return (
        <div className='bg-card text-card-foreground mb-4 flex flex-wrap gap-4 rounded-lg border p-4 shadow-sm'>
            {filters.map((filter) => {
                if (!filter.key) return null

                return (
                    <div
                        key={filter.key}
                        className='flex min-w-[200px] flex-col gap-2'
                    >
                        <Label
                            htmlFor={filter.key}
                            className='text-sm font-medium'
                        >
                            {filter.label || filter.key}
                        </Label>

                        {filter.type === 'DATE_RANGE' && (
                            <Input
                                id={filter.key}
                                type='date'
                                value={(activeFilters[filter.key] as string) || ''}
                                onChange={(e) =>
                                    onFilterChange(filter.key!, e.target.value)
                                }
                                className='w-full'
                            />
                        )}

                        {(filter.type === 'SELECT' ||
                            filter.type === 'MULTI_SELECT') && (
                            <select
                                id={filter.key}
                                className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50'
                                value={
                                    (activeFilters[filter.key] as string) ||
                                    (filter.default_value as string) ||
                                    ''
                                }
                                onChange={(e) =>
                                    onFilterChange(filter.key!, e.target.value)
                                }
                            >
                                {/* Only show 'All' option if showAllOption is true AND the filter is NOT a time range */}
                                {showAllOption && filter.key !== 'range' && (
                                    <option value=''>All</option>
                                )}
                                {filter.options?.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
