
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
import { getPopularTickers } from '@/app/actions/charts';
import { ChartDataResponse } from '@/lib/types/charts';
import { ChartFilters } from './ChartFilters';

const CustomBar = (props: any) => {
  const { x, y, width, height, payload } = props;
  const score = payload.average_sentiment;
  const isPositive = score > 0.5;
  const fillColor = isPositive ? '#22c55e' : '#ef4444';

  const arrowPath = isPositive
    ? `M${x + width / 2},${y + 5} L${x + width / 2 - 5},${y + 15} L${x + width / 2 + 5},${y + 15} Z`
    : `M${x + width / 2},${y + 15} L${x + width / 2 - 5},${y + 5} L${x + width / 2 + 5},${y + 5} Z`;

  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={fillColor} />
      <path d={arrowPath} fill="white" />
    </g>
  );
};

export function PopularTickersChart() {
  const [data, setData] = useState<ChartDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const isInitialLoad = useRef(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await getPopularTickers(filters);
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
        console.error('Failed to fetch popular tickers:', error);
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

  const chartData = Array.isArray(data?.data) ? data.data : [];

  return (
    <Card className="w-full h-[500px] flex flex-col">
      <CardHeader>
        <CardTitle>Popular Tickers</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0 pb-4">
        <ChartFilters
            filters={data?.available_filters || []}
            activeFilters={filters}
            onFilterChange={handleFilterChange}
        />
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
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="ticker" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" shape={CustomBar} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
