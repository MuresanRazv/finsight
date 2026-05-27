'use client'

import * as React from 'react'
import { Switch as SwitchPrimitive } from 'radix-ui'

import { cn } from '@/lib/utils'

function Switch({
    className,
    size = 'default',
    ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
    size?: 'sm' | 'default'
}) {
    return (
        <SwitchPrimitive.Root
            data-slot='switch'
            data-size={size}
            className={cn(
                'peer group/switch focus-visible:border-ring focus-visible:ring-ring/50 data-[state=checked]:bg-primary inline-flex shrink-0 items-center rounded-full border border-[#1e293b] shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-[1.15rem] data-[size=default]:w-8 data-[size=sm]:h-3.5 data-[size=sm]:w-6 data-[state=unchecked]:bg-[#0f172b]',
                className,
            )}
            {...props}
        >
            <SwitchPrimitive.Thumb
                data-slot='switch-thumb'
                className={cn(
                    'pointer-events-none block rounded-full ring-0 transition-transform group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3 data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0',
                    // Color logic
                    'data-[state=checked]:bg-background',
                    'data-[state=unchecked]:bg-slate-400',
                    'dark:data-[state=checked]:bg-foreground',
                )}
            />
        </SwitchPrimitive.Root>
    )
}

export { Switch }
