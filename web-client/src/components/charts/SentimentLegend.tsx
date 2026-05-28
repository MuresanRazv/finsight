import React from 'react'

export function SentimentLegend() {
    return (
        <div className='text-muted-foreground mb-2 flex items-center gap-4 text-xs'>
            <div className='flex items-center gap-1.5'>
                <div className='h-3 w-3 rounded-full bg-[#EF4444]' style={{ backgroundColor: '#EF4444' }} />
                <span>Negative</span>
            </div>
            <div className='flex items-center gap-1.5'>
                <div className='h-3 w-3 rounded-full bg-[#eab308]' style={{ backgroundColor: '#eab308' }} />
                <span>Neutral</span>
            </div>
            <div className='flex items-center gap-1.5'>
                <div className='h-3 w-3 rounded-full bg-[#10B981]' style={{ backgroundColor: '#10B981' }} />
                <span>Positive</span>
            </div>
        </div>
    )
}
