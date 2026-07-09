/**
 * Organization Schema Component for E-A-T (Expertise, Authority, Trust)
 * This should be included on every page to establish site authority
 */
export function OrganizationSchema() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Good Morning Bitcoin Radio",
    "alternateName": "GMB Radio",
    "description": "The premier 24/7 Bitcoin radio station streaming curated podcasts, breaking news, and community discussions with Lightning Network zap support.",
    "url": "https://goodmorningbitcoin.com",
    "logo": {
      "@type": "ImageObject",
      "url": "https://goodmorningbitcoin.com/assets/img/og-default.jpg",
      "width": 1200,
      "height": 630
    },
    "image": "https://goodmorningbitcoin.com/assets/img/og-default.jpg",
    
    // Contact and business information
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "availableLanguage": "English"
    },
    
    // Social media profiles for authority
    "sameAs": [
      "https://github.com/goodmorningbitcoin",
      "https://nostr.com/npub1goodmorningbitcoin" // Replace with actual Nostr profile when available
    ],
    
    // What the organization does
    "knowsAbout": [
      "Bitcoin",
      "Cryptocurrency",
      "Lightning Network",
      "Podcast Streaming",
      "Bitcoin Education",
      "Digital Currency",
      "Decentralized Finance",
      "Financial Technology"
    ],
    
    // Services offered
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Bitcoin Radio Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "24/7 Bitcoin Radio Streaming",
            "description": "Continuous Bitcoin podcast and news streaming"
          }
        },
        {
          "@type": "Offer", 
          "itemOffered": {
            "@type": "Service",
            "name": "Bitcoin Podcast Directory",
            "description": "Curated directory of Bitcoin podcasts with Lightning zap support"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service", 
            "name": "Lightning Network Integration",
            "description": "Bitcoin zap support for podcast creators"
          }
        }
      ]
    },
    
    // Technical and expertise areas
    "areaServed": "Worldwide",
    "audience": {
      "@type": "Audience",
      "audienceType": "Bitcoin enthusiasts, podcast listeners, Bitcoin community"
    },
    
    // Publishing information
    "publishingPrinciples": "https://goodmorningbitcoin.com/about",
    "foundingDate": "2024",
    "founders": [
      {
        "@type": "Person",
        "name": "Good Morning Bitcoin Team"
      }
    ],
    
    // Website structure
    "mainEntityOfPage": {
      "@type": "WebSite",
      "name": "Good Morning Bitcoin Radio",
      "url": "https://goodmorningbitcoin.com",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://goodmorningbitcoin.com/shows?search={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    },
    
    // Awards or recognition (add when available)
    "award": [],
    
    // Verification and trust signals
    "isVerified": true,
    "slogan": "The Voice of Bitcoin, Every Morning"
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(organizationSchema, null, 2)
      }}
    />
  );
}