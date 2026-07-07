import { useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { useWallet } from '@/hooks/useWallet';
import { useNWC } from '@/hooks/useNWCContext';
import type { ValueBlock, ValueSplit } from '@/lib/podcastXmlParser';

export interface PaymentResult {
  name: string;
  address: string;
  amount: number;
  status: 'success' | 'skipped' | 'failed';
  error?: string;
}

/**
 * Shared hook for sending Podcasting 2.0 boost payments (value splits).
 *
 * Implements the Podcasting 2.0 spec for value blocks:
 * - Lightning address recipients → LNURL-pay flow
 * - Node pubkey recipients → keysend
 *
 * Payment routing priority: WebLN keysend/LNURL → NWC fallback.
 * Extracted from BoostButton.tsx so both BoostButton and
 * ValueSplitZapButton share the same payment implementation.
 */
export function useBoost() {
  const [isBoosting, setIsBoosting] = useState(false);
  const { toast } = useToast();
  const { webln } = useWallet();
  const { sendKeysend, getActiveConnection } = useNWC();

  /**
   * Resolve a Lightning address to a BOLT11 invoice via LNURL-pay.
   */
  const resolveLightningAddress = async (address: string, amountSats: number): Promise<string | null> => {
    const [username, domain] = address.split('@');
    if (!username || !domain) return null;

    const lnurlpUrl = `https://${domain}/.well-known/lnurlp/${username}`;
    const lnurlResponse = await fetch(lnurlpUrl);
    if (!lnurlResponse.ok) {
      throw new Error(`Failed to resolve Lightning Address: ${lnurlResponse.status}`);
    }

    const lnurlData = await lnurlResponse.json();
    if (lnurlData.status === 'ERROR') {
      throw new Error(`LNURL Error: ${lnurlData.reason}`);
    }

    const amountMsats = amountSats * 1000;
    if (amountMsats < lnurlData.minSendable || amountMsats > lnurlData.maxSendable) {
      throw new Error(`Amount ${amountSats} sats is outside allowed range`);
    }

    const invoiceUrl = `${lnurlData.callback}?amount=${amountMsats}`;
    const invoiceResponse = await fetch(invoiceUrl);
    const invoiceData = await invoiceResponse.json();

    if (invoiceData.status === 'ERROR') {
      throw new Error(`Invoice Error: ${invoiceData.reason}`);
    }

    return invoiceData.pr;
  };

  /**
   * Pay a single recipient using their preferred method.
   */
  const payRecipient = async (
    address: string,
    amountSats: number,
    customKey?: string,
    customValue?: string
  ): Promise<boolean> => {
    const isLightningAddress = address.includes('@');

    if (isLightningAddress) {
      const invoice = await resolveLightningAddress(address, amountSats);

      if (webln?.sendPayment && invoice) {
        await webln.sendPayment(invoice);
        return true;
      }
      throw new Error('No wallet available for Lightning Address payment');
    }

    // Node pubkey → keysend
    const customRecords = customKey && customValue ? { [customKey]: customValue } : undefined;

    // Try WebLN keysend first
    if (webln?.keysend) {
      try {
        await webln.keysend({ destination: address, amount: amountSats, customRecords });
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : '';
        if (!msg.toLowerCase().includes('not supported') && !msg.toLowerCase().includes('unsupported')) {
          throw err;
        }
      }
    }

    // NWC keysend fallback
    const nwc = getActiveConnection();
    if (nwc?.connectionString && nwc.isConnected) {
      await sendKeysend(nwc, address, amountSats, customRecords);
      return true;
    }

    throw new Error('Wallet does not support keysend');
  };

  /**
   * Send a boost split to all recipients in the value block.
   * Returns per-recipient results so callers can show accurate feedback.
   */
  const sendBoost = async (valueBlock: ValueBlock, totalAmountSats: number): Promise<PaymentResult[]> => {
    if (totalAmountSats <= 0) return [];

    const totalSplits = valueBlock.recipients.reduce((sum, r) => sum + r.split, 0);

    const payments: Array<ValueSplit & { amount: number }> = valueBlock.recipients.map(recipient => ({
      ...recipient,
      amount: Math.floor((totalAmountSats * recipient.split) / totalSplits),
    }));

    const results: PaymentResult[] = [];

    for (const payment of payments) {
      if (payment.amount <= 0) continue;

      try {
        await payRecipient(payment.address, payment.amount, payment.customKey, payment.customValue);
        results.push({ name: payment.name || 'Unknown', address: payment.address, amount: payment.amount, status: 'success' });
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Unknown error';
        const isUnsupported = error.toLowerCase().includes('not supported') || error.toLowerCase().includes('keysend');

        results.push({
          name: payment.name || 'Unknown',
          address: payment.address,
          amount: payment.amount,
          status: isUnsupported ? 'skipped' : 'failed',
          error,
        });
      }
    }

    return results;
  };

  /**
   * Full boost flow with toast notifications. Used by UI components.
   */
  const handleBoost = async (valueBlock: ValueBlock, amount: number, onClose?: () => void) => {
    if (amount <= 0) return;

    setIsBoosting(true);
    try {
      const results = await sendBoost(valueBlock, amount);

      const successful = results.filter(r => r.status === 'success');
      const skipped = results.filter(r => r.status === 'skipped');
      const failed = results.filter(r => r.status === 'failed');

      if (successful.length > 0) {
        let title = 'Boost Sent! ⚡';
        let description = `${amount} sats split among ${successful.length} of ${valueBlock.recipients.length} recipients`;

        if (skipped.length > 0 || failed.length > 0) {
          title = 'Boost Partially Sent ⚡';
          const issues: string[] = [];
          if (skipped.length > 0) issues.push(`${skipped.length} keysend not supported`);
          if (failed.length > 0) issues.push(`${failed.length} failed`);
          description += ` (${issues.join(', ')})`;
        }

        toast({ title, description });
        onClose?.();
      } else if (skipped.length > 0 && failed.length === 0) {
        toast({
          title: 'Boost Not Sent',
          description: 'Your wallet does not support keysend. Try connecting via NWC.',
          variant: 'destructive',
        });
      } else {
        const firstError = failed[0]?.error || 'Unable to send boost.';
        toast({ title: 'Boost Failed', description: firstError, variant: 'destructive' });
      }
    } catch (error) {
      toast({
        title: 'Boost Failed',
        description: error instanceof Error ? error.message : 'Unable to send boost. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsBoosting(false);
    }
  };

  return { sendBoost, handleBoost, isBoosting };
}
