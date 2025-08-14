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
      // Use the MailerLite form endpoint from the original site
      const formData = new FormData();
      formData.append('fields[email]', email);
      formData.append('ml-submit', '1');
      formData.append('anticsrf', 'true');

      const _response = await fetch('https://assets.mailerlite.com/jsonp/1459975/forms/151930403370829428/subscribe', {
        method: 'POST',
        body: formData,
        mode: 'no-cors', // Required for cross-origin MailerLite requests
      });

      // Since we're using no-cors mode, we can't check the response status
      // but we'll assume it worked if no error was thrown
      toast({
        title: 'Success!',
        description: 'Thanks for subscribing to Bitcoin news!',
      });
      
      setEmail('');
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: 'Error',
        description: 'Failed to subscribe. Please try again.',
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