import { NextRequest, NextResponse } from 'next/server'

interface CandleResponse {
    close: number[]
    timestamps: number[]
    status: 'ok' | 'mocked' | 'no_data'
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ ticker: string }> },
) {
    const { ticker } = await params
    const symbol = ticker.toUpperCase()
    const { searchParams } = new URL(request.url)

    const now = Math.floor(Date.now() / 1000)
    const from = parseInt(searchParams.get('from') || String(now - 7 * 86400))
    const to = parseInt(searchParams.get('to') || String(now))

    const apiKey = process.env.FINNHUB_API_KEY

    if (!apiKey) {
        return NextResponse.json({
            close: [],
            timestamps: [],
            status: 'no_data',
        })
    }

    try {
        const url = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${from}&to=${to}&token=${apiKey}`
        const res = await fetch(url, { next: { revalidate: 300 } })

        if (!res.ok) {
            if (res.status === 403 || res.status === 401) {
                console.warn(`Finnhub API access forbidden/unauthorized for ${symbol}. Please verify your FINNHUB_API_KEY environment variable.`)
            } else {
                console.error(`Finnhub API request failed for ${symbol} with status ${res.status}: ${res.statusText}`)
            }
            return NextResponse.json({
                close: [],
                timestamps: [],
                status: 'no_data',
            })
        }

        const data = await res.json()

        if (data.s === 'ok' && Array.isArray(data.c)) {
            const result: CandleResponse = {
                close: data.c,
                timestamps: data.t,
                status: 'ok',
            }
            return NextResponse.json(result)
        } else {
            console.warn(
                `No candles returned from Finnhub for ${symbol}.`,
            )
            return NextResponse.json({
                close: [],
                timestamps: [],
                status: 'no_data',
            })
        }
    } catch (err) {
        console.error(`Error fetching candles for ${symbol}:`, err)
        return NextResponse.json({
            close: [],
            timestamps: [],
            status: 'no_data',
        })
    }
}
