export interface ValueSplit {
  type: 'node' | 'lnaddress';
  address: string;
  split: number;
  name?: string;
  customKey?: string;
  customValue?: string;
}

export interface ValueBlock {
  type: 'lightning';
  method: 'keysend';
  suggested?: number;
  recipients: ValueSplit[];
}

export interface Episode {
  title: string;
  description: string;
  audioUrl: string;
  pubDate: string;
  duration?: string;
  link?: string;
  guid?: string;
}

export interface PodcastMetadata {
  title?: string;
  description?: string;
  author?: string;
  image?: string;
  guid?: string;
  valueBlock?: ValueBlock;
  episodes?: Episode[];
}

export function parsePodcastXml(xmlString: string): PodcastMetadata | null {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'application/xml');
    
    // Check for parsing errors
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      console.error('XML parsing error:', parserError.textContent);
      return null;
    }

    const channel = doc.querySelector('channel');
    if (!channel) {
      console.error('No channel element found in podcast XML');
      return null;
    }

    // Extract basic metadata
    const title = channel.querySelector('title')?.textContent?.trim();
    const description = channel.querySelector('description')?.textContent?.trim();
    const author = channel.querySelector('itunes\\:author, author')?.textContent?.trim();
    
    // Extract image - try multiple standards in order of preference
    let image: string | undefined;
    
    
    // 1. Try Podcast 2.0 namespace: <podcast:image> with artwork purpose
    // Note: Use different approaches for namespace selectors as they can be unreliable
    const allElements = Array.from(channel.querySelectorAll('*'));
    const podcastImageElements = allElements.filter(el => 
      el.tagName.toLowerCase() === 'podcast:image' || 
      el.tagName.toLowerCase() === 'image' && el.namespaceURI?.includes('podcastindex.org')
    );
    
    for (const podcastImage of podcastImageElements) {
      const purpose = podcastImage.getAttribute('purpose') || '';
      const href = podcastImage.getAttribute('href');
      
      // Prefer images with "artwork" purpose, or any image if no purpose specified
      if (href && (purpose.includes('artwork') || !purpose)) {
        image = href;
        break;
      }
    }
    
    // 2. Try iTunes namespace - multiple selector approaches
    if (!image) {
      // Try multiple ways to find iTunes image elements
      let itunesImage = channel.querySelector('itunes\\:image') || 
                       channel.querySelector('[href]') && 
                       Array.from(channel.querySelectorAll('[href]')).find(el => 
                         el.tagName.toLowerCase().includes('image')
                       );
      
      if (!itunesImage) {
        // Alternative approach: find by tag name pattern
        const allImageElements = allElements.filter(el => 
          el.tagName.toLowerCase().includes('image') && el.getAttribute('href')
        );
        itunesImage = allImageElements[0];
      }
      
      if (itunesImage) {
        image = itunesImage.getAttribute('href') || undefined;
      }
    }
    
    // 3. Try deprecated podcast:images srcset format
    if (!image) {
      const podcastImagesElements = allElements.filter(el => 
        el.tagName.toLowerCase() === 'podcast:images' || 
        (el.tagName.toLowerCase() === 'images' && el.getAttribute('srcset'))
      );
      
      const podcastImages = podcastImagesElements[0];
      if (podcastImages) {
        const srcset = podcastImages.getAttribute('srcset');
        if (srcset) {
          // Parse srcset format: "url1 width1, url2 width2, ..."
          // Take the first (largest) image
          const firstImage = srcset.split(',')[0];
          const imageUrl = firstImage.trim().split(' ')[0];
          if (imageUrl) {
            image = imageUrl;
          }
        }
      }
    }
    
    // 4. Try RSS 2.0 format as fallback: <image><url>...</url></image>
    if (!image) {
      const rssImage = channel.querySelector('image > url');
      if (rssImage) {
        image = rssImage.textContent?.trim() || undefined;
      }
    }
    
    const guid = channel.querySelector('guid')?.textContent?.trim();

    // Extract value block (Podcasting 2.0 value tag)
    const valueTag = channel.querySelector('podcast\\:value, value');
    let valueBlock: ValueBlock | undefined;

    // console.log('XML Parser: Looking for value tag, found:', !!valueTag);
    if (valueTag) {
      // console.log('XML Parser: Found value tag with attributes:', {
      //   type: valueTag.getAttribute('type'),
      //   method: valueTag.getAttribute('method'),
      //   suggested: valueTag.getAttribute('suggested')
      // });
      const type = valueTag.getAttribute('type') || 'lightning';
      const method = valueTag.getAttribute('method') || 'keysend';
      const suggested = valueTag.getAttribute('suggested');

      const recipients: ValueSplit[] = [];
      const valueRecipients = valueTag.querySelectorAll('podcast\\:valueRecipient, valueRecipient');

      // console.log('XML Parser: Found', valueRecipients.length, 'value recipients');
      valueRecipients.forEach(recipient => {
        const address = recipient.getAttribute('address');
        const split = recipient.getAttribute('split');
        const name = recipient.getAttribute('name');
        const customKey = recipient.getAttribute('customKey');
        const customValue = recipient.getAttribute('customValue');

        if (address && split) {
          // Determine the address type based on the address format
          let addressType: 'node' | 'lnaddress' = 'node';
          
          // Lightning addresses contain an @ symbol (email-like format)
          if (address.includes('@')) {
            addressType = 'lnaddress';
          }
          
          recipients.push({
            type: addressType,
            address,
            split: parseInt(split, 10),
            name: name || undefined,
            customKey: customKey || undefined,
            customValue: customValue || undefined,
          });
        }
      });

      if (recipients.length > 0) {
        valueBlock = {
          type: type as 'lightning',
          method: method as 'keysend',
          suggested: suggested ? parseInt(suggested, 10) : undefined,
          recipients,
        };
        // console.log('XML Parser: Created value block with', recipients.length, 'recipients:', valueBlock);
      } else {
        // console.log('XML Parser: No recipients found, no value block created');
      }
    }

    // Extract episodes
    const episodes: Episode[] = [];
    const items = doc.querySelectorAll('item');
    
    items.forEach(item => {
      const episodeTitle = item.querySelector('title')?.textContent?.trim();
      const episodeDescription = item.querySelector('description')?.textContent?.trim() || '';
      const pubDate = item.querySelector('pubDate')?.textContent?.trim() || '';
      const link = item.querySelector('link')?.textContent?.trim();
      const guid = item.querySelector('guid')?.textContent?.trim();
      
      // Extract duration from itunes:duration or other duration fields
      const duration = item.querySelector('itunes\\:duration, duration')?.textContent?.trim();
      
      // Find audio enclosure
      const enclosure = item.querySelector('enclosure');
      let audioUrl = '';
      
      if (enclosure) {
        const url = enclosure.getAttribute('url');
        const type = enclosure.getAttribute('type');
        
        if (url && type?.startsWith('audio/')) {
          // Handle Anchor.fm tracking URLs - extract the actual MP3 URL
          if (url.includes('anchor.fm') && url.includes('/podcast/play/')) {
            // Extract the encoded URL from the end
            const parts = url.split('/');
            const encodedUrl = parts[parts.length - 1];
            try {
              audioUrl = decodeURIComponent(encodedUrl);
            } catch {
              // If decoding fails, use the original URL
              audioUrl = url;
            }
          } else {
            audioUrl = url;
          }
        }
      }
      
      // Only add episode if we have title and audio URL
      if (episodeTitle && audioUrl) {
        episodes.push({
          title: episodeTitle,
          description: episodeDescription,
          audioUrl,
          pubDate,
          duration,
          link,
          guid,
        });
      }
    });

    return {
      title,
      description,
      author,
      image,
      guid,
      valueBlock,
      episodes,
    };
  } catch (error) {
    console.error('Error parsing podcast XML:', error);
    return null;
  }
}

export function extractLatestEpisodeUrl(xmlString: string): string | null {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'application/xml');
    
    const items = doc.querySelectorAll('item');
    if (items.length === 0) return null;

    // Get the first (latest) item
    const latestItem = items[0];
    const enclosure = latestItem.querySelector('enclosure');
    
    if (enclosure) {
      const url = enclosure.getAttribute('url');
      const type = enclosure.getAttribute('type');
      
      // Make sure it's an audio file
      if (url && type?.startsWith('audio/')) {
        return url;
      }
    }

    return null;
  } catch (error) {
    console.error('Error extracting episode URL:', error);
    return null;
  }
}