import { useState } from 'react';
import { Zap, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useValueBlock } from '@/hooks/useValueBlock';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useBoost } from '@/hooks/useBoost';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface BoostButtonProps {
  className?: string;
  size?: 'sm' | 'default' | 'lg' | 'icon';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  iconOnly?: boolean;
}

export function BoostButton({ className, size = 'default', variant = 'default', iconOnly = false }: BoostButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState(100);
  const [message, setMessage] = useState('');
  const { user } = useCurrentUser();
  const { currentSource } = useAudioPlayer();
  const { data: valueBlock, isLoading: isLoadingValueBlock } = useValueBlock();
  const { handleBoost, isBoosting } = useBoost();

  if (!valueBlock) {
    return (
      <Button variant="outline" disabled className={className} size={size}>
        {iconOnly ? (
          <Zap className="h-4 w-4 opacity-50" />
        ) : (
          <>
            <Zap className="h-4 w-4 mr-2 opacity-50" />
            No Value Block
          </>
        )}
      </Button>
    );
  }

  if (!user) {
    return (
      <Button variant="outline" disabled className={className} size={size}>
        {iconOnly ? (
          <Zap className="h-4 w-4" />
        ) : (
          <>
            <Zap className="h-4 w-4 mr-2" />
            Login to Boost
          </>
        )}
      </Button>
    );
  }

  const totalSplits = valueBlock.recipients.reduce((sum, recipient) => sum + recipient.split, 0);

  const onBoost = () => {
    handleBoost(valueBlock, amount, () => {
      setIsOpen(false);
      setMessage('');
    });
  };

  const presetAmounts = [21, 100, 500, 1000, 2100];

  const getShowTitle = () => {
    if (currentSource?.type === 'podcast') {
      return currentSource.showTitle || currentSource.title;
    } else if (currentSource?.type === 'radio') {
      return currentSource.title;
    }
    return 'Show';
  };

  if (isLoadingValueBlock) {
    return (
      <Button variant={variant} disabled className={className} size={size}>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className={className} variant={variant} size={size}>
          {iconOnly ? (
            <Zap className="h-4 w-4" />
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" />
              Boost
              <Badge variant="secondary" className="ml-2">
                <Users className="h-3 w-3 mr-1" />
                {valueBlock.recipients.length}
              </Badge>
            </>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-500" />
            Boost {getShowTitle()}
          </DialogTitle>
          <DialogDescription>
            Send a Podcasting 2.0 boost that gets split among {valueBlock.recipients.length} recipients
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Value Recipients */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Split Recipients</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {valueBlock.recipients.map((recipient, index) => {
                const percentage = Math.round((recipient.split / totalSplits) * 100);
                return (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate flex-1">
                      {recipient.name || 'Unknown'}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {percentage}%
                    </Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Separator />

          {/* Amount Selection */}
          <div className="space-y-3">
            <Label htmlFor="amount">Boost Amount (sats)</Label>
            <div className="flex gap-2 flex-wrap">
              {presetAmounts.map((preset) => (
                <Button
                  key={preset}
                  type="button"
                  variant={amount === preset ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAmount(preset)}
                >
                  {preset}
                </Button>
              ))}
            </div>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
              placeholder="Enter custom amount"
              min="1"
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Boost Message (optional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Great show! Keep up the amazing work..."
              rows={3}
            />
          </div>

          {/* Send Button */}
          <Button
            onClick={onBoost}
            disabled={isBoosting || amount <= 0}
            className="w-full bg-orange-500 hover:bg-orange-600"
          >
            {isBoosting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending Boost...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Send {amount} sat boost
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            This boost will be split automatically among all recipients based on their percentages
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
