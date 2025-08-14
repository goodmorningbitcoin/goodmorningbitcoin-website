import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Send, MessageCircle, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';

// NIP-28 Channel Chat for Good Morning Bitcoin
const CHANNEL_ID = 'goodmorningbitcoin';

interface ChatMessage {
  id: string;
  author: string;
  content: string;
  timestamp: number;
  authorName?: string;
}

export function LiveChat() {
  const [message, setMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { mutate: createEvent } = useNostrPublish();
  const queryClient = useQueryClient();

  // Fetch chat messages (NIP-28 kind 42 events)
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['chat-messages', CHANNEL_ID],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      const events = await nostr.query([
        {
          kinds: [42], // NIP-28 channel message
          '#e': [CHANNEL_ID],
          limit: 50
        }
      ], { signal });

      // Sort by timestamp
      const sortedEvents = events.sort((a, b) => a.created_at - b.created_at);
      
      return sortedEvents.map((event): ChatMessage => ({
        id: event.id,
        author: event.pubkey,
        content: event.content,
        timestamp: event.created_at * 1000,
        // TODO: Fetch author metadata for display names
      }));
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && isExpanded) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isExpanded]);

  const handleSendMessage = () => {
    if (!message.trim() || !user) return;

    // Create NIP-28 channel message
    createEvent({
      kind: 42,
      content: message.trim(),
      tags: [
        ['e', CHANNEL_ID, '', 'root'], // Reference to channel
        ['p', user.pubkey], // Self-reference for threading
      ],
    });

    setMessage('');

    // Optimistically update the UI
    queryClient.setQueryData(['chat-messages', CHANNEL_ID], (old: ChatMessage[] = []) => [
      ...old,
      {
        id: 'temp-' + Date.now(),
        author: user.pubkey,
        content: message.trim(),
        timestamp: Date.now(),
        authorName: 'You',
      }
    ]);

    // Refresh messages shortly after
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', CHANNEL_ID] });
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateKey = (key: string) => {
    return `${key.slice(0, 8)}...${key.slice(-4)}`;
  };

  if (!isExpanded) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Live Chat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{messages.length > 0 ? `${messages.length} messages` : 'No messages yet'}</span>
            </div>
            {messages.slice(-2).map((msg) => (
              <div key={msg.id} className="text-sm">
                <div className="font-medium text-xs text-muted-foreground">
                  {msg.authorName || truncateKey(msg.author)} • {formatTime(msg.timestamp)}
                </div>
                <div className="line-clamp-2">{msg.content}</div>
              </div>
            ))}
          </div>
          <Button 
            onClick={() => setIsExpanded(true)}
            className="w-full"
            variant="outline"
          >
            Join Chat
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Live Chat
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsExpanded(false)}
          >
            Minimize
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-3">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-2 mb-3 max-h-64">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))
          ) : messages.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-4">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="text-sm">
                <div className="font-medium text-xs text-muted-foreground">
                  {msg.authorName || truncateKey(msg.author)} • {formatTime(msg.timestamp)}
                </div>
                <div className="break-words">{msg.content}</div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        {user ? (
          <div className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1"
              maxLength={280}
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!message.trim()}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="text-center text-sm text-muted-foreground py-2">
            <div>Sign in to join the chat</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}