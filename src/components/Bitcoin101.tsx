import { GraduationCap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function Bitcoin101() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl-bold flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          Bitcoin 101
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Learn about Bitcoin basics and get started on your journey to understanding the future of money.
        </p>
        <Button asChild className="w-full bg-gmb-orange hover:bg-[#d55520]">
          <a href="https://bitcoin101.goodmorningbitcoin.com" target="_blank" rel="noopener noreferrer">
            Get Started
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}