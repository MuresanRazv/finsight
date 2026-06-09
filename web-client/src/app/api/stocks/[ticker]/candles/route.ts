import { NextRequest, NextResponse } from 'next/server'

interface CandleResponse {
    close: number[]
    timestamps: number[]
    status: 'ok' | 'mocked' | 'no_data'
}

// Simple seedable random number generator
function seedRandom(seedStr: string) {
    let hash = 0
    for (let i = 0; i < seedStr.length; i++) {
        hash = seedStr.charCodeAt(i) + ((hash << 5) - hash)
    }
    return () => {
        const x = Math.sin(hash++) * 10000
        return x - Math.floor(x)
    }
}

function generateMockCandles(ticker: string, from: number, to: number): CandleResponse {
    const symbol = ticker.toUpperCase()
    const rand = seedRandom(`${symbol}-${from}-${to}`)

    // Pick a realistic starting price
    let basePrice = 150
    if (symbol === 'NVDA') basePrice = 850
    else if (symbol === 'TSM') basePrice = 135
    else if (symbol === 'AMD') basePrice = 170
    else if (symbol === 'AAPL') basePrice = 185
    else if (symbol === 'MSFT') basePrice = 415
    else {
        // Procedural base price
        const code = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
        basePrice = 40 + (code % 250)
    }

    const close: number[] = []
    const timestamps: number[] = []

    // Create daily points between from and to (step of 1 day = 86400 seconds)
    const step = 86400
    let current = from
    let price = basePrice

    while (current <= to) {
        const changePercent = (rand() - 0.45) * 0.04 // daily fluctuation
        price = price * (1 + changePercent)
        close.push(parseFloat(price.toFixed(2)))
        timestamps.push(current)
        current += step
    }

    return {
        close,
        timestamps,
        status: 'mocked',
    }
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
        return NextResponse.json(generateMockCandles(symbol, from, to))
    }

    try {
        const url = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${from}&to=${to}&token=${apiKey}`
        const res = await fetch(url, { next: { revalidate: 300 } })

        if (!res.ok) {
            if (res.status === 403 || res.status === 401) {
                console.warn(`Finnhub API access forbidden/unauthorized for ${symbol}. Falling back to mock data.`)
            } else {
                console.error(`Finnhub API request failed for ${symbol} with status ${res.status}: ${res.statusText}. Falling back to mock data.`)
            }
            return NextResponse.json(generateMockCandles(symbol, from, to))
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
                `No candles returned from Finnhub for ${symbol}, falling back to mock data.`,
            )
            return NextResponse.json(generateMockCandles(symbol, from, to))
        }
    } catch (err) {
        console.error(`Error fetching candles for ${symbol}, falling back to mock data:`, err)
        return NextResponse.json(generateMockCandles(symbol, from, to))
    }
}
