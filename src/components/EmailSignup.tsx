import { useState } from 'react';
import { Mail, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/useToast';

export function EmailSignup() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);

    try {
      // MailerLite subscribe endpoint (account 1459975, form 151930403370829428)
      const formData = new FormData();
      formData.append('fields[email]', email);
      formData.append('ml-submit', '1');
      formData.append('anticsrf', 'true');

      const response = await fetch('https://assets.mailerlite.com/jsonp/1459975/forms/151930403370829428/subscribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      // MailerLite returns JSON when the form accepts the submission.
      // If the email is invalid or already subscribed, it returns a
      // status field we can check.
      let alreadySubscribed = false;
      try {
        const data = await response.json();
        if (data.status === 'ERROR' || data.errors) {
          throw new Error(data.reason || data.message || 'Subscription was rejected.');
        }
        alreadySubscribed = !!data.already;
      } catch {
        // Response wasn't JSON — some MailerLite configs return a redirect
        // or HTML. Treat a 2xx response as success.
      }

      toast({
        title: alreadySubscribed ? 'Already subscribed!' : 'Success!',
        description: alreadySubscribed
          ? 'You are already on our list.'
          : 'Thanks for subscribing to Bitcoin news!',
      });

      setEmail('');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error
          ? `Failed to subscribe: ${error.message}`
          : 'Failed to subscribe. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl-bold flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Signup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Signup for the latest Bitcoin news!
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full"
          />
          <Button
            type="submit"
            disabled={isLoading || !email.trim()}
            className="w-full bg-black hover:bg-gray-800 text-white"
          >
            {isLoading ? (
              'Subscribing...'
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Subscribe
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
