import { useState } from 'react';
import { Zap, Coins, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/useToast';
import { useValueBlock } from '@/hooks/useValueBlock';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { useWallet } from '@/hooks/useWallet';
import { useNWC } from '@/hooks/useNWCContext';
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
  const [isZapping, setIsZapping] = useState(false);
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const { currentSource } = useAudioPlayer();
  const { data: valueBlock, isLoading: isLoadingValueBlock } = useValueBlock();
  const { webln } = useWallet();
  const { sendKeysend, getActiveConnection } = useNWC();

  // Debug logging (can be removed later)
  // if (valueBlock) {
  //   console.log('BoostButton: Found value block with', valueBlock.recipients?.length, 'recipients');
  // }

  if (!valueBlock) {
    // Show a debug button when no value block to help troubleshoot
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

  const handleBoost = async () => {
    if (!user || amount <= 0 || !valueBlock) return;

    setIsZapping(true);
    try {
      // Calculate individual payments based on splits
      const payments = valueBlock.recipients.map((recipient) => {
        const calculatedAmount = Math.floor((amount * recipient.split) / totalSplits);
        console.log(`Payment calculation: ${amount} sats * ${recipient.split} / ${totalSplits} = ${calculatedAmount} sats for ${recipient.name}`);
        return {
          address: recipient.address,
          amount: calculatedAmount,
          name: recipient.name || 'Unknown',
          customKey: recipient.customKey,
          customValue: recipient.customValue,
        };
      });

      // Get the current active NWC connection
      const currentNWCConnection = getActiveConnection();

      let paymentSuccessful = false;
      let successfulPayments = 0;
      let skippedPayments = 0;

      // Try to send payments to each recipient
      for (const payment of payments) {
        if (payment.amount <= 0) continue; // Skip zero-amount payments

        try {
          // Create a payment for each recipient
          console.log('Sending payment:', payment);
          
          // Check if this is a Lightning Address or a node pubkey
          const isLightningAddress = payment.address.includes('@');
          
          if (isLightningAddress) {
            // Handle Lightning Address payments via LNURL-pay
            console.log(`Lightning Address detected: ${payment.address}, using LNURL-pay`);
            
            try {
              // Resolve Lightning Address to LNURL and get invoice
              const [username, domain] = payment.address.split('@');
              const lnurlpUrl = `https://${domain}/.well-known/lnurlp/${username}`;
              
              console.log(`Resolving Lightning Address via: ${lnurlpUrl}`);
              
              // Get LNURL-pay info
              const lnurlResponse = await fetch(lnurlpUrl);
              if (!lnurlResponse.ok) {
                throw new Error(`Failed to resolve Lightning Address: ${lnurlResponse.status}`);
              }
              
              const lnurlData = await lnurlResponse.json();
              console.log('LNURL-pay data:', lnurlData);
              
              if (lnurlData.status === 'ERROR') {
                throw new Error(`LNURL Error: ${lnurlData.reason}`);
              }
              
              // Check amount limits (amounts are in millisats)
              const amountMsats = payment.amount * 1000;
              if (amountMsats < lnurlData.minSendable || amountMsats > lnurlData.maxSendable) {
                throw new Error(`Amount ${payment.amount} sats is outside allowed range`);
              }
              
              // Request invoice
              const invoiceUrl = `${lnurlData.callback}?amount=${amountMsats}`;
              const invoiceResponse = await fetch(invoiceUrl);
              const invoiceData = await invoiceResponse.json();
              
              if (invoiceData.status === 'ERROR') {
                throw new Error(`Invoice Error: ${invoiceData.reason}`);
              }
              
              console.log(`Got invoice for ${payment.amount} sats to ${payment.address}`);
              
              // Pay the invoice using WebLN
              if (webln && webln.sendPayment) {
                await webln.sendPayment(invoiceData.pr);
                console.log('Lightning Address payment successful');
                successfulPayments++;
                paymentSuccessful = true;
                continue; // Move to next recipient
              } else {
                throw new Error('WebLN not available for invoice payment');
              }
              
            } catch (lnurlError) {
              console.error('Lightning Address payment failed:', lnurlError);
              throw new Error(`Lightning Address payment failed for ${payment.name}: ${lnurlError.message}`);
            }
          }
          
          // Handle node pubkey payments via keysend
          console.log(`Node pubkey detected: ${payment.address}, using keysend`);
          
          let keysendSuccessful = false;
          
          // Try WebLN keysend first if available
          if (webln && webln.keysend) {
            try {
              console.log(`WebLN keysend: sending ${payment.amount} sats to ${payment.address}`);
              await webln.keysend({
                destination: payment.address,
                amount: payment.amount,
                customRecords: payment.customKey && payment.customValue ? {
                  [payment.customKey]: payment.customValue
                } : undefined
              });
              keysendSuccessful = true;
              successfulPayments++;
              paymentSuccessful = true;
            } catch (weblnError) {
              console.error('WebLN keysend failed:', weblnError);
              // Check if this is a "not supported" error
              if (weblnError.message?.toLowerCase().includes('not supported') || 
                  weblnError.message?.toLowerCase().includes('unsupported')) {
                console.log('WebLN does not support keysend, trying NWC fallback...');
              }
            }
          }
          
          // Try NWC keysend if WebLN failed and NWC is available
          if (!keysendSuccessful && currentNWCConnection && currentNWCConnection.connectionString && currentNWCConnection.isConnected) {
            try {
              console.log('Attempting NWC keysend:', payment);
              
              // Use the real NWC keysend function
              await sendKeysend(
                currentNWCConnection,
                payment.address,
                payment.amount,
                payment.customKey && payment.customValue ? {
                  [payment.customKey]: payment.customValue
                } : undefined
              );
              
              console.log('NWC keysend successful');
              keysendSuccessful = true;
              successfulPayments++;
              paymentSuccessful = true;
            } catch (nwcError) {
              console.error('NWC keysend failed:', nwcError);
            }
          }
          
          // If both methods failed, show a helpful error message
          if (!keysendSuccessful) {
            console.warn(`Keysend payment to ${payment.name} skipped - wallet doesn't support keysend`);
            skippedPayments++;
            // Skip this payment but don't fail the entire boost
            // The Lightning address payments will still work
            continue;
          }
        } catch (error) {
          console.error(`Failed to send payment to ${payment.name}:`, error);
          throw error;
        }
      }

      if (paymentSuccessful) {
        const totalRecipients = valueBlock.recipients.length;
        let toastTitle = 'Boost Sent! ⚡';
        let toastDescription = `${amount} sats split among ${successfulPayments} of ${totalRecipients} recipients`;
        
        if (skippedPayments > 0) {
          toastTitle = 'Boost Partially Sent ⚡';
          toastDescription += ` (${skippedPayments} keysend payments skipped - wallet doesn't support keysend)`;
        }
        
        toast({
          title: toastTitle,
          description: toastDescription,
        });

        setIsOpen(false);
        setMessage('');
      }
    } catch (error) {
      console.error('Failed to send boost:', error);
      toast({
        title: 'Boost Failed',
        description: error instanceof Error ? error.message : 'Unable to send boost. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsZapping(false);
    }
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
            <Coins className="h-5 w-5 text-orange-500" />
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
            onClick={handleBoost}
            disabled={isZapping || amount <= 0}
            className="w-full bg-orange-500 hover:bg-orange-600"
          >
            {isZapping ? (
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