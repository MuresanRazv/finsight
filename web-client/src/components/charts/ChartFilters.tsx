import React from 'react';
import { FilterDefinition } from '@/lib/types/article';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ChartFiltersProps {
  filters: FilterDefinition[];
  activeFilters: Record<string, any>;
  onFilterChange: (key: string, value: any) => void;
  showAllOption?: boolean;
}

export function ChartFilters({ filters, activeFilters, onFilterChange, showAllOption = false }: ChartFiltersProps) {
  if (!filters || filters.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-4 mb-4 p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
      {filters.map((filter) => {
        if (!filter.key) return null;

        return (
          <div key={filter.key} className="flex flex-col gap-2 min-w-[200px]">
            <Label htmlFor={filter.key} className="text-sm font-medium">
              {filter.label || filter.key}
            </Label>
            
            {filter.type === 'DATE_RANGE' && (
              <Input
                id={filter.key}
                type="date"
                value={activeFilters[filter.key] || ''}
                onChange={(e) => onFilterChange(filter.key!, e.target.value)}
                className="w-full"
              />
            )}

            {(filter.type === 'SELECT' || filter.type === 'MULTI_SELECT') && (
              <select
                id={filter.key}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={activeFilters[filter.key] || filter.default_value || ''}
                onChange={(e) => onFilterChange(filter.key!, e.target.value)}
              >
                {/* Only show 'All' option if showAllOption is true AND the filter is NOT a time range */}
                {showAllOption && filter.key !== 'range' && <option value="">All</option>}
                {filter.options?.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            )}
          </div>
        );
      })}
    </div>
  );
}
