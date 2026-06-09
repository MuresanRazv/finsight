import { NextRequest, NextResponse } from 'next/server'

interface StockData {
    ticker: string
    name: string
    logo: string | null
    industry: string
    exchange: string
    price: number | null
    change: number | null
    changePercent: number | null
    prevClose?: number | null
}

const cache = new Map<string, { data: StockData; expiry: number }>()
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ ticker: string }> },
) {
    const { ticker } = await params
    const symbol = ticker.toUpperCase()

    // Check Cache
    const cached = cache.get(symbol)
    if (cached && cached.expiry > Date.now()) {
        return NextResponse.json(cached.data)
    }

    const apiKey = process.env.FINNHUB_API_KEY

    if (!apiKey) {
        const result: StockData = {
            ticker: symbol,
            name: `${symbol} Corp.`,
            logo: null,
            industry: 'N/A',
            exchange: 'N/A',
            price: null,
            change: null,
            changePercent: null,
            prevClose: null,
        }
        cache.set(symbol, { data: result, expiry: Date.now() + CACHE_TTL_MS })
        return NextResponse.json(result)
    }

    try {
        const [quoteRes, profileRes] = await Promise.all([
            fetch(
                `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`,
                { next: { revalidate: 300 } },
            ),
            fetch(
                `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${apiKey}`,
                { next: { revalidate: 3600 } },
            ),
        ])

        if (!quoteRes.ok || !profileRes.ok) {
            const status = !quoteRes.ok ? quoteRes.status : profileRes.status
            const statusText = !quoteRes.ok ? quoteRes.statusText : profileRes.statusText
            if (status === 403 || status === 401) {
                console.warn(`Finnhub API access forbidden/unauthorized for ${symbol}. Please verify your FINNHUB_API_KEY environment variable.`)
            } else {
                console.error(`Finnhub API request failed for ${symbol} with status ${status}: ${statusText}`)
            }
            const result: StockData = {
                ticker: symbol,
                name: `${symbol} Corp.`,
                logo: null,
                industry: 'N/A',
                exchange: 'N/A',
                price: null,
                change: null,
                changePercent: null,
                prevClose: null,
            }
            return NextResponse.json(result)
        }

        const quoteData = await quoteRes.json()
        const profileData = await profileRes.json()

        const name = profileData.name || `${symbol} Corp.`
        const logo = profileData.logo || null
        const industry = profileData.finnhubIndustry || 'N/A'
        const exchange = profileData.exchange || 'N/A'

        const price =
            typeof quoteData.c === 'number' && quoteData.c !== 0
                ? quoteData.c
                : null
        const change = typeof quoteData.d === 'number' ? quoteData.d : null
        const changePercent =
            typeof quoteData.dp === 'number' ? quoteData.dp : null
        const prevClose = typeof quoteData.pc === 'number' ? quoteData.pc : null

        const result: StockData = {
            ticker: symbol,
            name,
            logo,
            industry,
            exchange,
            price,
            change,
            changePercent,
            prevClose,
        }

        cache.set(symbol, { data: result, expiry: Date.now() + CACHE_TTL_MS })
        return NextResponse.json(result)
    } catch (error) {
        console.error(`Error fetching Finnhub data for ${symbol}:`, error)
        const result: StockData = {
            ticker: symbol,
            name: `${symbol} Corp.`,
            logo: null,
            industry: 'N/A',
            exchange: 'N/A',
            price: null,
            change: null,
            changePercent: null,
            prevClose: null,
        }
        return NextResponse.json(result)
    }
}
