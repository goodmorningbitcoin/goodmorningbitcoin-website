import { useQuery } from '@tanstack/react-query';
import { Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface LightningStats {
  latest: {
    channel_count: number;
    node_count: number;
    total_capacity: number;
    avg_capacity: number;
    avg_fee_rate: number;
    avg_base_fee_mtokens: number;
    med_capacity: number;
    med_fee_rate: number;
    tor_nodes: number;
    clearnet_nodes: number;
  };
}

export function LightningNetworkStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['lightning-stats'],
    queryFn: async (): Promise<LightningStats> => {
      const response = await fetch('https://mempool.space/api/v1/lightning/statistics/latest');
      if (!response.ok) throw new Error('Failed to fetch lightning stats');
      return response.json();
    },
    staleTime: 600000, // 10 minutes
    retry: 1,
  });

  const formatCapacity = (sats: number): string => {
    if (sats >= 1000000) return `${(sats / 1000000).toFixed(1)}M sats`;
    if (sats >= 1000) return `${(sats / 1000).toFixed(0)}k sats`;
    return `${sats} sats`;
  };

  const formatFeeRate = (ppm: number): string => `${ppm} sat/million`;

  if (isLoading || !stats) {
    return (
      <Card className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white border-purple-700">
        <CardContent className="p-4">
          <Skeleton className="h-6 w-full bg-purple-950/50" />
        </CardContent>
      </Card>
    );
  }

  const d = stats.latest;
  const parts = [
    `${d.channel_count.toLocaleString()} Channels`,
    `${d.node_count.toLocaleString()} Nodes`,
    `Avg Capacity: ${formatCapacity(d.avg_capacity)}`,
    `Avg Fee: ${formatFeeRate(d.avg_fee_rate)}`,
  ];

  return (
    <Card className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white border-purple-700">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center font-mono text-sm md:text-base">
          <Zap className="h-4 w-4 text-yellow-400 flex-shrink-0" />
          {parts.map((part, i) => (
            <span key={i} className="whitespace-nowrap">
              {part}
              {i < parts.length - 1 && <span className="text-purple-400 mx-1.5">|</span>}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
