
'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getLatestArticles } from '@/app/actions/charts';
import { ChartDataResponse } from '@/lib/types/charts';
import { ArticleDto } from '@/lib/types/article';
import { ChartFilters } from './ChartFilters';
import { SentimentLegend } from './SentimentLegend';

// Helper function to format the tick
const formatTick = (tick: string) => {
  // If the tick is too long, truncate it
  if (tick.length > 15) {
      return tick.substring(0, 15) + '...';
  }
  return tick;
};

const CustomBar = (props: any) => {
  const { x, y, width, height, payload } = props;
  const score = payload.overall_sentiment_score;
  
  let fillColor = '#eab308'; // yellow-500
  if (score > 0.70) {
    fillColor = '#22c55e'; // green-500
  } else if (score < 0.30) {
    fillColor = '#ef4444'; // red-500
  }

  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={fillColor} />
    </g>
  );
};

export function LatestArticlesChart() {
  const [data, setData] = useState<ChartDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const isInitialLoad = useRef(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await getLatestArticles(filters);
        setData(result);

        if (isInitialLoad.current && result.available_filters) {
          isInitialLoad.current = false;
          const defaultFilters = result.available_filters.reduce((acc, filter) => {
            if (filter.key && filter.default_value) {
              acc[filter.key] = filter.default_value;
            }
            return acc;
          }, {} as Record<string, string>);

          if (Object.keys(defaultFilters).length > 0) {
            setFilters(defaultFilters);
          }
        }
      } catch (error) {
        console.error('Failed to fetch latest articles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  if (loading && !data) {
    return (
      <Card className="w-full h-[500px] flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </Card>
    );
  }

  const chartData = Array.isArray(data?.data) ? (data.data as ArticleDto[])
    .slice() // Create a copy to avoid mutating state if strict mode
    .reverse() // Sort oldest to latest
    .map((article) => ({
    ...article,
    name: new Date(article.processed_at).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }),
    fullUrl: article.url // Keep full url for tooltip if needed
  })) : [];


  return (
    <Card className="w-full h-[500px] flex flex-col">
      <CardHeader>
        <CardTitle>{data?.title || 'Latest Articles'}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0 pb-4">
        <div className="flex justify-between items-start mb-2">
            <ChartFilters
                filters={data?.available_filters || []}
                activeFilters={filters}
                onFilterChange={handleFilterChange}
            />
        </div>
        <SentimentLegend />
        {chartData.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            No data found
          </div>
        ) : (
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 60, // Increased bottom margin for rotated labels
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{
                  fontSize: 12,
                  width: 80,
                  textAnchor: 'end',
                  angle: -45,
                }}
                tickFormatter={formatTick}
                interval={0} // Show all ticks
                />
                <YAxis />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const value = payload[0].value;
                      return (
                        <div className="bg-background border rounded p-2 shadow-sm text-sm">
                          <p className="font-semibold">{label}</p>
                          <p>Sentiment Score: {typeof value === 'number' ? value.toFixed(2) : value}</p>
                          {data.fullUrl && (
                             <p className="text-xs text-muted-foreground max-w-[300px] truncate mt-1">{data.fullUrl}</p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="overall_sentiment_score" shape={CustomBar} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
