/**
 * WebSite Schema Component for site-wide SEO
 * Includes search functionality and navigation structure
 */
export function WebSiteSchema() {
  const webSiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Good Morning Bitcoin Radio",
    "alternateName": "GMB Radio",
    "url": "https://goodmorningbitcoin.com",
    "description": "The premier 24/7 Bitcoin radio station streaming curated podcasts, breaking news, and community discussions with Lightning Network zap support.",
    
    // Search functionality
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://goodmorningbitcoin.com/shows?search={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    },
    
    // Publisher information  
    "publisher": {
      "@type": "Organization",
      "name": "Good Morning Bitcoin Radio",
      "url": "https://goodmorningbitcoin.com"
    },
    
    // Site navigation structure
    "mainEntity": [
      {
        "@type": "WebPage",
        "name": "Home", 
        "url": "https://goodmorningbitcoin.com",
        "description": "24/7 Bitcoin radio streaming and podcast directory"
      },
      {
        "@type": "WebPage",
        "name": "Bitcoin Podcast Directory",
        "url": "https://goodmorningbitcoin.com/shows", 
        "description": "Discover the best Bitcoin podcasts with Lightning zap support"
      },
      {
        "@type": "WebPage",
        "name": "About",
        "url": "https://goodmorningbitcoin.com/about",
        "description": "Learn about Good Morning Bitcoin Radio and our mission"
      },
      {
        "@type": "WebPage", 
        "name": "Community",
        "url": "https://goodmorningbitcoin.com/community",
        "description": "Join the Bitcoin community discussion"
      }
    ],
    
    // Content categories
    "about": [
      {
        "@type": "Thing",
        "name": "Bitcoin",
        "description": "Digital cryptocurrency and decentralized monetary system"
      },
      {
        "@type": "Thing", 
        "name": "Podcast Streaming",
        "description": "Audio content delivery and streaming platform"
      },
      {
        "@type": "Thing",
        "name": "Lightning Network", 
        "description": "Bitcoin layer 2 payment protocol"
      }
    ],
    
    // Site features
    "hasPart": [
      {
        "@type": "WebPageElement",
        "name": "Live Bitcoin Radio Stream",
        "description": "24/7 streaming Bitcoin podcasts and news"
      },
      {
        "@type": "WebPageElement",
        "name": "Podcast Directory",
        "description": "Searchable directory of Bitcoin podcasts"
      },
      {
        "@type": "WebPageElement", 
        "name": "Lightning Zap Support",
        "description": "Send Bitcoin tips to podcast creators"
      }
    ],
    
    // Audience and language
    "audience": {
      "@type": "Audience",
      "audienceType": "Bitcoin enthusiasts, cryptocurrency investors, podcast listeners"
    },
    "inLanguage": "en-US"
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(webSiteSchema, null, 2)
      }}
    />
  );
}