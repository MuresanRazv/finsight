import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TickerPage({ params }: { params: { ticker: string } }) {
  return (
    <div>
      <PageHeader title={`Asset: ${params.ticker.toUpperCase()}`} description={`Sentiment analysis and data for ${params.ticker.toUpperCase()}.`} />
      <Card>
        <CardHeader>
          <CardTitle>Sentiment History</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Chart will be here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
