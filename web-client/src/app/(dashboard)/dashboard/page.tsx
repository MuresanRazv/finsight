import { LatestArticlesChart } from '@/components/charts/LatestArticlesChart'
import { MyTickersChart } from '@/components/charts/MyTickersChart'
import { PopularTickersChart } from '@/components/charts/PopularTickersChart'
import { GeneralMarketSentimentChart } from '@/components/charts/GeneralMarketSentimentChart'

export default function DashboardPage() {
    return (
        <div className='min-h-screen p-0 md:p-4 text-white'>
            <header className='mb-6 md:mb-8 mt-2 md:mt-0'>
                <h1 className='text-3xl md:text-4xl font-bold'>Dashboard</h1>
            </header>

            <main data-tour='dashboard-content' className='grid grid-cols-1 gap-8 pb-2 lg:grid-cols-2 w-full min-w-0'>
                <div className='lg:col-span-2 min-w-0'>
                    <GeneralMarketSentimentChart />
                </div>
                <div className='lg:col-span-2 min-w-0'>
                    <MyTickersChart />
                </div>
                <div className='grid grid-cols-1 gap-8 md:grid-cols-2 lg:col-span-2 w-full min-w-0'>
                    <PopularTickersChart />
                    <LatestArticlesChart />
                </div>
            </main>
        </div>
    )
}
