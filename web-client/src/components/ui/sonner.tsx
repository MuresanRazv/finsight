'use client'

import {
    CircleCheckIcon,
    InfoIcon,
    Loader2Icon,
    OctagonXIcon,
    TriangleAlertIcon,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
    const { theme = 'system' } = useTheme()

    return (
        <Sonner
            theme={theme as ToasterProps['theme']}
            className='toaster group'
            icons={{
                success: (
                    <CircleCheckIcon className='size-4 text-emerald-500 dark:text-emerald-400' />
                ),
                info: (
                    <InfoIcon className='size-4 text-blue-500 dark:text-blue-400' />
                ),
                warning: (
                    <TriangleAlertIcon className='size-4 text-amber-500 dark:text-amber-400' />
                ),
                error: (
                    <OctagonXIcon className='size-4 text-red-500 dark:text-red-400' />
                ),
                loading: <Loader2Icon className='size-4 animate-spin' />,
            }}
            style={
                {
                    '--normal-bg': 'var(--popover)',
                    '--normal-text': 'var(--popover-foreground)',
                    '--normal-border': 'var(--border)',
                    '--border-radius': 'var(--radius)',
                } as React.CSSProperties
            }
            toastOptions={{
                classNames: {
                    toast: 'group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:border',
                    title: 'group-[.toast]:text-sm group-[.toast]:font-semibold group-[.toast]:!text-slate-900 dark:group-[.toast]:!text-slate-100',
                    description:
                        'group-[.toast]:text-xs group-[.toast]:!text-slate-600 dark:group-[.toast]:!text-slate-400',
                    actionButton:
                        'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
                    cancelButton:
                        'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
                    success:
                        'group-[.toast]:!bg-emerald-950/20 group-[.toast]:!text-emerald-400 group-[.toast]:!border-emerald-500/20',
                    error: 'group-[.toast]:!bg-red-950/20 group-[.toast]:!text-red-400 group-[.toast]:!border-red-500/20',
                    warning:
                        'group-[.toast]:!bg-amber-950/20 group-[.toast]:!text-amber-400 group-[.toast]:!border-amber-500/20',
                    info: 'group-[.toast]:!bg-blue-950/20 group-[.toast]:!text-blue-400 group-[.toast]:!border-blue-500/20',
                },
            }}
            {...props}
        />
    )
}

export { Toaster }
