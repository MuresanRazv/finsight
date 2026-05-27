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

const MOCK_STOCK_DATA: Record<
    string,
    {
        name: string
        logo?: string
        price: number
        change: number
        changePercent: number
        industry: string
        exchange: string
    }
> = {
    AAPL: {
        name: 'Apple Inc.',
        logo: 'https://static2.finnhub.io/logo/879907ae-adc4-11e9-910c-080027040653.png',
        price: 189.84,
        change: 1.25,
        changePercent: 0.66,
        industry: 'Technology',
        exchange: 'NASDAQ',
    },
    NVDA: {
        name: 'NVIDIA Corp',
        logo: 'https://static2.finnhub.io/logo/NVIDIA.png',
        price: 940.2,
        change: 18.5,
        changePercent: 2.01,
        industry: 'Semiconductors',
        exchange: 'NASDAQ',
    },
    TSLA: {
        name: 'Tesla Inc',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Tesla_logo.png',
        price: 179.24,
        change: -2.45,
        changePercent: -1.35,
        industry: 'Automotive',
        exchange: 'NASDAQ',
    },
    MSFT: {
        name: 'Microsoft Corp',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg',
        price: 421.9,
        change: 3.12,
        changePercent: 0.74,
        industry: 'Technology',
        exchange: 'NASDAQ',
    },
    GOOGL: {
        name: 'Alphabet Inc.',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg',
        price: 173.56,
        change: -0.45,
        changePercent: -0.26,
        industry: 'Technology',
        exchange: 'NASDAQ',
    },
    AMZN: {
        name: 'Amazon.com, Inc.',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
        price: 181.28,
        change: 1.15,
        changePercent: 0.64,
        industry: 'Retail',
        exchange: 'NASDAQ',
    },
}

function getProceduralMockData(ticker: string) {
    const code = ticker
        .split('')
        .reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const price = 50 + (code % 300) + (code % 10) / 100
    const isPositive = code % 2 === 0
    const change = (isPositive ? 1 : -1) * (1 + (code % 15) + (code % 7) / 100)
    const changePercent = (change / price) * 100

    const industries = [
        'Technology',
        'Semiconductors',
        'Automotive',
        'Retail',
        'Financial Services',
        'Healthcare',
        'Energy',
    ]
    const industry = industries[code % industries.length]

    return {
        name: `${ticker.toUpperCase()} Corp.`,
        logo: null,
        price: parseFloat(price.toFixed(2)),
        change: parseFloat(change.toFixed(2)),
        changePercent: parseFloat(changePercent.toFixed(2)),
        industry,
        exchange: code % 3 === 0 ? 'NYSE' : 'NASDAQ',
    }
}

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
        // Fallback to mock data
        const mockData =
            MOCK_STOCK_DATA[symbol] || getProceduralMockData(symbol)
        const result: StockData = {
            ticker: symbol,
            ...mockData,
            logo: mockData.logo || null,
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
            throw new Error('Failed to fetch from Finnhub')
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
        const mockData =
            MOCK_STOCK_DATA[symbol] || getProceduralMockData(symbol)
        const result: StockData = {
            ticker: symbol,
            ...mockData,
            logo: mockData.logo || null,
        }
        return NextResponse.json(result)
    }
}
