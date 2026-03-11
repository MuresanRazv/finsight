
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
import { getGeneralMarketSentiment } from '@/app/actions/charts';
import { ChartDataResponse } from "@/lib/types/charts";
import { ChartFilters } from './ChartFilters';
import { SentimentLegend } from './SentimentLegend';

const CustomDot = (props: any) => {
  const { cx, cy, value } = props;
  
  if (value === undefined || value === null) return null;

  let color = '#eab308'; // yellow-500
  if (value > 0.70) {
    color = '#22c55e'; // green-500
  } else if (value < 0.30) {
    color = '#ef4444'; // red-500
  }
  
  return (
    <circle cx={cx} cy={cy} r={4} fill={color} strokeWidth={0} />
  );
};

const CustomActiveDot = (props: any) => {
  const { cx, cy, value } = props;
  
  if (value === undefined || value === null) return null;

  let color = '#eab308'; // yellow-500
  if (value > 0.70) {
    color = '#22c55e'; // green-500
  } else if (value < 0.30) {
    color = '#ef4444'; // red-500
  }

  return (
    <circle cx={cx} cy={cy} r={6} fill={color} stroke="white" strokeWidth={2} />
  );
};

export function GeneralMarketSentimentChart() {
  const [data, setData] = useState<ChartDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const isInitialLoad = useRef(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await getGeneralMarketSentiment(filters);
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
        console.error('Failed to fetch general market sentiment:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (filters.range === '24h') {
        return date.toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit',
        });
      }
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
    } catch (e) {
      return dateStr;
    }
  };

  if (loading && !data) {
    return (
      <Card className="w-full h-[500px] flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </Card>
    );
  }

  const chartData = Array.isArray(data?.data) ? data.data : [];

  const getGradientStops = () => {
    const values = chartData.map((d: any) => d.sentiment as number).filter((v: any) => typeof v === 'number');
    if (values.length === 0) return null;

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    
    const getColor = (val: number) => val > 0.70 ? '#22c55e' : (val < 0.30 ? '#ef4444' : '#eab308');

    if (range === 0) {
      const color = getColor(max);
      return (
        <>
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={color} />
        </>
      );
    }

    const stops = [];
    stops.push(<stop key="start" offset="0%" stopColor={getColor(max)} />);
    
    if (min < 0.70 && max > 0.70) {
      const off = (max - 0.70) / range;
      stops.push(<stop key="70-1" offset={off} stopColor="#22c55e" />);
      stops.push(<stop key="70-2" offset={off} stopColor="#eab308" />);
    }
    
    if (min < 0.30 && max > 0.30) {
      const off = (max - 0.30) / range;
      stops.push(<stop key="30-1" offset={off} stopColor="#eab308" />);
      stops.push(<stop key="30-2" offset={off} stopColor="#ef4444" />);
    }
    
    stops.push(<stop key="end" offset="100%" stopColor={getColor(min)} />);
    return stops;
  };

  return (
    <Card className="w-full h-[500px] flex flex-col">
      <CardHeader>
        <CardTitle>{data?.title || 'General Market Sentiment'}</CardTitle>
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
              <LineChart
                data={chartData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <defs>
                  <linearGradient id="splitColorSentiment" x1="0" y1="0" x2="0" y2="1">
                    {getGradientStops()}
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                />
                <YAxis domain={[0, 1]} />
                <Tooltip 
                  formatter={(value: any) => typeof value === 'number' ? value.toFixed(2) : value}
                  labelFormatter={(label) => formatDate(label as string)}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="sentiment"
                  name="Sentiment"
                  stroke="url(#splitColorSentiment)"
                  strokeWidth={2}
                  dot={<CustomDot />}
                  activeDot={<CustomActiveDot />}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
