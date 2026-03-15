import { LatestArticlesChart } from '@/components/charts/LatestArticlesChart'
import { MyTickersChart } from '@/components/charts/MyTickersChart'
import { PopularTickersChart } from '@/components/charts/PopularTickersChart'
import { GeneralMarketSentimentChart } from '@/components/charts/GeneralMarketSentimentChart'

export default function DashboardPage() {
    return (
        <div className='min-h-screen bg-gray-900 p-8 text-white'>
            <header className='mb-8'>
                <h1 className='text-4xl font-bold'>FinSight Dashboard</h1>
            </header>

            <main className='grid grid-cols-1 gap-8 lg:grid-cols-2'>
                <div className='lg:col-span-2'>
                    <GeneralMarketSentimentChart />
                </div>
                <div className='lg:col-span-2'>
                    <MyTickersChart />
                </div>
                <div className='grid grid-cols-1 gap-8 md:grid-cols-2 lg:col-span-2'>
                    <PopularTickersChart />
                    <LatestArticlesChart />
                </div>
            </main>
        </div>
    )
}
