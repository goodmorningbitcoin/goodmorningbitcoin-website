import { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';

// NIP-28 Channel Chat for Good Morning Bitcoin
const CHANNEL_ID = 'goodmorningbitcoin';

interface ChatMessage {
  id: string;
  author: string;
  content: string;
  timestamp: number;
}

export function LiveChat() {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { mutate: createEvent } = useNostrPublish();

  // Real-time chat messages state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Set up real-time REQ subscription for chat messages
  useEffect(() => {
    let isSubscribed = true;
    let abortController: AbortController | undefined;

    const setupRealtimeSubscription = async () => {
      try {
        setIsLoading(true);
        abortController = new AbortController();
        
        // First get recent messages using query
        const initialEvents = await nostr.query([
          {
            kinds: [42], // NIP-28 channel message
            '#e': [CHANNEL_ID],
            limit: 50
          }
        ], { signal: AbortSignal.timeout(3000) });

        if (!isSubscribed) return;

        // Convert initial events to messages
        const initialMessages = initialEvents
          .sort((a, b) => a.created_at - b.created_at)
          .map((event): ChatMessage => ({
            id: event.id,
            author: event.pubkey,
            content: event.content,
            timestamp: event.created_at * 1000,
          }));
        
        setMessages(initialMessages);
        setIsLoading(false);

        // Set up real-time REQ streaming for new messages
        const streamNewMessages = async () => {
          if (!isSubscribed) return;
          
          try {
            // Use REQ streaming for real-time updates
            for await (const msg of nostr.req([
              {
                kinds: [42],
                '#e': [CHANNEL_ID],
                since: Math.floor(Date.now() / 1000) // Only new messages from now
              }
            ], { signal: abortController!.signal })) {
              
              if (!isSubscribed) break;
              
              // Handle EVENT messages
              if (msg[0] === 'EVENT') {
                const event = msg[2];
                
                const newMessage: ChatMessage = {
                  id: event.id,
                  author: event.pubkey,
                  content: event.content,
                  timestamp: event.created_at * 1000,
                };

                setMessages(prev => {
                  // Check if message already exists (deduplication)
                  if (prev.some(m => m.id === newMessage.id)) return prev;
                  
                  const updated = [...prev, newMessage]
                    .sort((a, b) => a.timestamp - b.timestamp);
                  // Keep only last 100 messages for performance
                  return updated.slice(-100);
                });
              }
              
              // Handle EOSE (End of Stored Events) - continue streaming
              if (msg[0] === 'EOSE') {
                console.log('Live chat: Connected to real-time stream');
              }
              
              // Handle CLOSED - relay closed the subscription
              if (msg[0] === 'CLOSED') {
                console.log('Live chat: Relay closed subscription');
                break;
              }
            }
          } catch (error) {
            if (isSubscribed) {
              console.error('Live chat streaming error:', error);
            }
          }
        };

        // Start streaming new messages
        streamNewMessages();
        
      } catch (error) {
        console.error('Chat subscription setup error:', error);
        if (isSubscribed) {
          setIsLoading(false);
        }
      }
    };

    setupRealtimeSubscription();

    return () => {
      isSubscribed = false;
      abortController?.abort();
    };
  }, [nostr]);

  // Auto-scroll to bottom when new messages arrive.
  // We scroll the chat container itself, NOT the whole page —
  // scrollIntoView would scroll the page down to the chat on every load.
  useEffect(() => {
    const container = messagesEndRef.current?.parentElement;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

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
    const tempMessage: ChatMessage = {
      id: 'temp-' + Date.now(),
      author: user.pubkey,
      content: message.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, tempMessage]);
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


  // Component to render individual chat message with profile data
  function ChatMessageItem({ message, isCurrentUser }: { message: ChatMessage; isCurrentUser: boolean }) {
    const author = useAuthor(message.author);
    const metadata = author.data?.metadata;
    const displayName = isCurrentUser ? 'You' : (metadata?.display_name || metadata?.name || genUserName(message.author));
    const profileImage = metadata?.picture;

    return (
      <div className="text-sm flex items-start gap-2">
        <Avatar className="h-6 w-6 flex-shrink-0">
          <AvatarImage src={profileImage} alt={displayName} />
          <AvatarFallback className="text-xs">
            {displayName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-xs text-muted-foreground mb-0.5">
            {displayName} • {formatTime(message.timestamp)}
          </div>
          <div className="break-words">{message.content}</div>
        </div>
      </div>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Live Chat
        </CardTitle>
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
              <ChatMessageItem 
                key={msg.id}
                message={msg} 
                isCurrentUser={user?.pubkey === msg.author}
              />
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