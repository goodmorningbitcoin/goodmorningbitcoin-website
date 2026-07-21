export interface CitadelWireStory {
  /** Story headline, e.g., "Trump imposes 50% tariffs on selected Canadian goods" */
  headline: string;
  /** Analysis lines (lines starting with --) */
  analysis: string[];
  /** Timestamp of the parent digest post */
  timestamp: number;
  /** Link to the full post on citadelwire.com */
  link: string;
  /** Event ID of the parent Nostr event */
  eventId: string;
}

/**
 * Parse a Citadel Wire text note content into individual stories.
 *
 * Input format:
 *   2026-07-21 00:00 UTC | BLOCK 958940
 *   BITCOIN $65,197 | GOLD $4,007 | OIL $88.81
 *
 *   1. Trump imposes 50% tariffs on selected Canadian goods
 *   -- The White House imposed new 50% duties...
 *   -- Concentrating the levies on...
 *
 *   2. Guyana ferry disaster leaves at least 27 dead and 83 missing
 *   -- At least 27 people died...
 */
export function parseCitadelWireStories(
  content: string,
  timestamp: number,
  link: string,
  eventId: string,
): CitadelWireStory[] {
  const lines = content.split('\n');
  const stories: CitadelWireStory[] = [];
  let currentStory: CitadelWireStory | null = null;

  for (const line of lines) {
    // Match numbered headline: "1. Some headline text"
    const headlineMatch = line.match(/^\d+\.\s+(.+)$/);
    if (headlineMatch) {
      // Save previous story
      if (currentStory) {
        stories.push(currentStory);
      }
      currentStory = {
        headline: headlineMatch[1].trim(),
        analysis: [],
        timestamp,
        link,
        eventId,
      };
    } else if (line.startsWith('--') && currentStory) {
      // Analysis line
      currentStory.analysis.push(line.replace(/^--\s*/, '').trim());
    }
  }

  // Don't forget the last story
  if (currentStory) {
    stories.push(currentStory);
  }

  return stories;
}
