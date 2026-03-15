import React from 'react'

export function SentimentLegend() {
    return (
        <div className='text-muted-foreground mb-2 flex items-center gap-4 text-xs'>
            <div className='flex items-center gap-1.5'>
                <div className='h-3 w-3 rounded-full bg-[#ef4444]' />
                <span>Negative Confidence (&lt; 0.3)</span>
            </div>
            <div className='flex items-center gap-1.5'>
                <div className='h-3 w-3 rounded-full bg-[#eab308]' />
                <span>Neutral Confidence (0.3 - 0.7)</span>
            </div>
            <div className='flex items-center gap-1.5'>
                <div className='h-3 w-3 rounded-full bg-[#22c55e]' />
                <span>Positive Confidence (&gt; 0.7)</span>
            </div>
        </div>
    )
}
