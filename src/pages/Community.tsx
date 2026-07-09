import { Seo, JsonLd, breadcrumbSchema } from '@/lib/useSeo';
import { Layout } from '@/components/Layout';
import { Header } from '@/components/Header';
import { CommentsSection } from '@/components/comments/CommentsSection';
import { LoginArea } from '@/components/auth/LoginArea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, MessageCircle, Radio } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export default function Community() {
  const { user } = useCurrentUser();
  const communityUrl = new URL('https://goodmorningbitcoin.com/community');

  return (
    <Layout>
      <Seo
        title="Community - Good Morning Bitcoin"
        description="Join the Good Morning Bitcoin community on Nostr. Discuss Bitcoin, podcasts, and connect with fellow Bitcoiners."
        path="/community"
      />
      <JsonLd
        schemas={[
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Community', path: '/community' },
          ]),
        ]}
      />
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Community Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
                <Users className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            
            <h1 className="text-4xl font-bold mb-4">Good Morning Bitcoin Community</h1>
            <p className="text-lg text-muted-foreground mb-6">
              Connect with fellow Bitcoiners, discuss the latest episodes, and share insights from the world of Bitcoin.
            </p>
            
            {!user && (
              <div className="mb-8">
                <p className="text-sm text-muted-foreground mb-4">
                  Join our community to participate in discussions
                </p>
                <LoginArea className="max-w-60 mx-auto" />
              </div>
            )}
          </div>

          {/* Community Info Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="text-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg w-fit mx-auto mb-2">
                  <MessageCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-lg">Discuss Episodes</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground">
                  Share your thoughts on the latest Bitcoin podcasts and radio content.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg w-fit mx-auto mb-2">
                  <Radio className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-lg">Request Shows</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground">
                  Suggest new Bitcoin podcasts to add to our rotation.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg w-fit mx-auto mb-2">
                  <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle className="text-lg">Connect</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground">
                  Network with other Bitcoiners and podcast enthusiasts.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Nostr Community Features */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="secondary">Powered by Nostr</Badge>
                Community Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium mb-2">🔒 Censorship Resistant</h4>
                    <p className="text-muted-foreground">
                      Built on Nostr protocol for truly decentralized discussions.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">⚡ Lightning Integration</h4>
                    <p className="text-muted-foreground">
                      Zap great posts and support community members directly.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">🎙️ Podcast Integration</h4>
                    <p className="text-muted-foreground">
                      Discussions linked directly to podcast episodes and shows.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">🌐 Open Protocol</h4>
                    <p className="text-muted-foreground">
                      Use any Nostr client to participate in our community.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Community Discussion */}
          <CommentsSection
            root={communityUrl}
            title="Community Discussion"
            emptyStateMessage="Start the conversation!"
            emptyStateSubtitle="Be the first to share your thoughts about Good Morning Bitcoin"
          />
        </div>
      </div>
    </Layout>
  );
}
