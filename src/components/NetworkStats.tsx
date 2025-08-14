import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface MempoolFees {
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
  economyFee: number;
  minimumFee: number;
}

interface HashrateData {
  currentHashrate: number;
  currentDifficulty: number;
}

interface DifficultyAdjustment {
  progressPercent: number;
  difficultyChange: number;
  estimatedRetargetDate: number;
  remainingBlocks: number;
  remainingTime: number;
}

interface BitcoinPrice {
  bitcoin: {
    usd: number;
  };
}

export function NetworkStats() {
  const { data: fees } = useQuery({
    queryKey: ['mempool-fees'],
    queryFn: async (): Promise<MempoolFees> => {
      const response = await fetch('https://mempool.space/api/v1/fees/recommended');
      return response.json();
    },
    staleTime: 60000,
    retry: 1,
  });

  const { data: blockHeight } = useQuery({
    queryKey: ['block-height'],
    queryFn: async (): Promise<number> => {
      const response = await fetch('https://mempool.space/api/v1/blocks/tip/height');
      return response.json();
    },
    staleTime: 30000,
    retry: 1,
  });

  const { data: hashrate } = useQuery({
    queryKey: ['hashrate'],
    queryFn: async (): Promise<HashrateData> => {
      const response = await fetch('https://mempool.space/api/v1/mining/hashrate/3d');
      return response.json();
    },
    staleTime: 300000, // 5 minutes
    retry: 1,
  });

  const { data: diffAdj } = useQuery({
    queryKey: ['difficulty-adjustment'],
    queryFn: async (): Promise<DifficultyAdjustment> => {
      const response = await fetch('https://mempool.space/api/v1/difficulty-adjustment');
      return response.json();
    },
    staleTime: 300000, // 5 minutes
    retry: 1,
  });

  const { data: price } = useQuery({
    queryKey: ['bitcoin-price'],
    queryFn: async (): Promise<BitcoinPrice> => {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
      return response.json();
    },
    staleTime: 60000,
    retry: 1,
  });

  const formatHashrate = (hashrate: number): string => {
    const units = ['H/s', 'kH/s', 'MH/s', 'GH/s', 'TH/s', 'PH/s', 'EH/s', 'ZH/s'];
    let value = hashrate;
    let unitIndex = 0;
    
    while (value >= 1000 && unitIndex < units.length - 1) {
      value /= 1000;
      unitIndex++;
    }
    
    return `${value.toFixed(2)} ${units[unitIndex]}`;
  };

  const formatDifficulty = (difficulty: number): string => {
    const exp = Math.floor(Math.log10(difficulty));
    const power = Math.floor(exp / 3) * 3;
    const base = difficulty / Math.pow(10, power);
    return `${base.toFixed(1)}×10^${power}`;
  };

  const formatNextDate = (timestamp: number): string => {
    const ms = timestamp < 1e12 ? timestamp * 1000 : timestamp;
    return new Date(ms).toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const isLoading = !fees || !blockHeight || !hashrate || !diffAdj || !price;

  if (isLoading) {
    return (
      <Card className="bg-black text-white">
        <CardContent className="p-4">
          <Skeleton className="h-6 w-full bg-gray-700" />
        </CardContent>
      </Card>
    );
  }

  const statsText = [
    price?.bitcoin?.usd ? `$${price.bitcoin.usd.toLocaleString()}` : 'N/A',
    fees?.fastestFee ? `${fees.fastestFee} sat/vB` : 'N/A',
    blockHeight?.toLocaleString() || 'N/A',
    hashrate?.currentDifficulty ? formatDifficulty(hashrate.currentDifficulty) : 'N/A',
    diffAdj?.estimatedRetargetDate ? `Next Difficulty: ${formatNextDate(diffAdj.estimatedRetargetDate)}` : 'N/A',
    hashrate?.currentHashrate ? formatHashrate(hashrate.currentHashrate) : 'N/A'
  ].join(' | ');

  return (
    <Card className="bg-black text-white">
      <CardContent className="p-4">
        <div className="text-center font-mono text-sm md:text-base overflow-x-auto">
          {statsText}
        </div>
      </CardContent>
    </Card>
  );
}