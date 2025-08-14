import type { NostrEvent } from '@nostrify/nostrify';

export const COMMUNITY_DEFINITION_KIND = 34550;
export const COMMUNITY_POST_KIND = 1111;
export const COMMUNITY_APPROVAL_KIND = 4550;

export interface CommunityMetadata {
  id: string;
  name: string;
  description?: string;
  image?: string;
  moderators: Array<{
    pubkey: string;
    relay?: string;
    role: string;
  }>;
  relays: Array<{
    url: string;
    marker?: 'author' | 'requests' | 'approvals';
  }>;
  event: NostrEvent;
}

export function extractCommunityMetadata(event: NostrEvent): CommunityMetadata {
  const dTag = event.tags.find(([name]) => name === 'd')?.[1] || '';
  const nameTag = event.tags.find(([name]) => name === 'name')?.[1];
  const descriptionTag = event.tags.find(([name]) => name === 'description')?.[1];
  const imageTag = event.tags.find(([name]) => name === 'image');

  const moderators = event.tags
    .filter(([name, , , role]) => name === 'p' && role === 'moderator')
    .map(([, pubkey, relay, role]) => ({
      pubkey,
      relay,
      role,
    }));

  const relays = event.tags
    .filter(([name]) => name === 'relay')
    .map(([, url, marker]) => ({
      url,
      marker: marker as 'author' | 'requests' | 'approvals' | undefined,
    }));

  return {
    id: `${COMMUNITY_DEFINITION_KIND}:${event.pubkey}:${dTag}`,
    name: nameTag || dTag,
    description: descriptionTag,
    image: imageTag ? imageTag[1] : undefined,
    moderators,
    relays,
    event,
  };
}

export function parseCommunityId(communityId: string): { kind: number; pubkey: string; identifier: string } {
  const parts = communityId.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid community ID format');
  }
  
  return {
    kind: parseInt(parts[0]),
    pubkey: parts[1],
    identifier: parts[2],
  };
}

export function createCommunityPostTags(communityId: string, parentEventId?: string): string[][] {
  const { kind, pubkey } = parseCommunityId(communityId);
  
  const tags: string[][] = [
    ['A', communityId],
    ['a', communityId],
    ['P', pubkey],
    ['p', pubkey],
    ['K', kind.toString()],
    ['k', kind.toString()],
  ];
  
  if (parentEventId) {
    // For replies, lowercase tags point to parent
    tags.push(
      ['e', parentEventId],
      ['k', COMMUNITY_POST_KIND.toString()]
    );
  } else {
    // For top-level posts, lowercase tags point to community
    tags.push(
      ['a', communityId],
      ['p', pubkey],
      ['k', kind.toString()]
    );
  }
  
  return tags;
}