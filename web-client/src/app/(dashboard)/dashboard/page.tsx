
import { LatestArticlesChart } from '@/components/charts/LatestArticlesChart';
import { MyTickersChart } from '@/components/charts/MyTickersChart';
import { PopularTickersChart } from '@/components/charts/PopularTickersChart';

export default function DashboardPage() {
    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <header className="mb-8">
                <h1 className="text-4xl font-bold">FinSight Dashboard</h1>
            </header>

            <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="lg:col-span-2">
                    <MyTickersChart />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:col-span-2">
                    <PopularTickersChart />
                    <LatestArticlesChart />
                </div>
            </main>
        </div>
    );
}
