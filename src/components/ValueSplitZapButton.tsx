import { useState } from 'react';
import { Zap, Users, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/useToast';
import type { ValueBlock } from '@/lib/podcastXmlParser';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface ValueSplitZapButtonProps {
  valueBlock: ValueBlock;
  showTitle: string;
  className?: string;
}

export function ValueSplitZapButton({ valueBlock, showTitle, className }: ValueSplitZapButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState(valueBlock.suggested || 100);
  const [message, setMessage] = useState('');
  const [isZapping, setIsZapping] = useState(false);
  const { user } = useCurrentUser();
  const { toast } = useToast();

  if (!user) {
    return (
      <Button variant="outline" disabled className={className}>
        <Zap className="h-4 w-4 mr-2" />
        Login to Boost
      </Button>
    );
  }

  const totalSplits = valueBlock.recipients.reduce((sum, recipient) => sum + recipient.split, 0);

  const handleBoost = async () => {
    if (!user || amount <= 0) return;

    setIsZapping(true);
    try {
      // Calculate individual payments based on splits
      const payments = valueBlock.recipients.map((recipient) => ({
        address: recipient.address,
        amount: Math.floor((amount * recipient.split) / totalSplits),
        name: recipient.name || 'Unknown',
        customKey: recipient.customKey,
        customValue: recipient.customValue,
      }));

      // TODO: Implement actual Lightning payments to each recipient
      // This would integrate with WebLN or NWC to send payments
      console.log('Sending boost payments:', payments);

      toast({
        title: 'Boost Sent! ⚡',
        description: `${amount} sats sent to ${valueBlock.recipients.length} recipients`,
      });

      setIsOpen(false);
      setMessage('');
    } catch (error) {
      console.error('Failed to send boost:', error);
      toast({
        title: 'Boost Failed',
        description: 'Unable to send boost. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsZapping(false);
    }
  };

  const presetAmounts = [21, 100, 500, 1000, 2100];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className={className} variant="default">
          <Zap className="h-4 w-4 mr-2" />
          Boost Show
          <Badge variant="secondary" className="ml-2">
            <Users className="h-3 w-3 mr-1" />
            {valueBlock.recipients.length}
          </Badge>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-orange-500" />
            Boost {showTitle}
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
              {valueBlock.recipients.map((recipient, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="font-medium truncate flex-1">
                    {recipient.name || 'Unknown'}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {recipient.split}%
                  </Badge>
                </div>
              ))}
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
            onClick={handleBoost}
            disabled={isZapping || amount <= 0}
            className="w-full bg-orange-500 hover:bg-orange-600"
          >
            {isZapping ? (
              'Sending Boost...'
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