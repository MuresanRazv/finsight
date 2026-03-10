
'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getMyTickers } from '@/app/actions/charts';
import { ChartDataResponse } from "@/lib/types/charts";
import { ChartFilters } from './ChartFilters';

export function MyTickersChart() {
  const [data, setData] = useState<ChartDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const isInitialLoad = useRef(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await getMyTickers(filters);
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
        console.error('Failed to fetch my tickers:', error);
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
  const lines = chartData.length > 0 ? Object.keys(chartData[0]).filter(k => k !== 'date') : [];

  return (
    <Card className="w-full h-[500px] flex flex-col">
      <CardHeader>
        <CardTitle>My Tickers</CardTitle>
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
              <LineChart
                data={chartData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                {lines.map((line, index) => (
                  <Line
                    key={line}
                    type="monotone"
                    dataKey={line}
                    stroke={`hsl(${index * 137}, 70%, 50%)`}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
