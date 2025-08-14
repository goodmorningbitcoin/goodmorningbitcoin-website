# Good Morning Bitcoin Radio

A Nostr-powered Bitcoin radio station featuring live streaming, podcast directory, and Lightning payments. Built with React 18.x, TailwindCSS 3.x, Vite, shadcn/ui, and Nostrify.

## Features

### 🎵 Audio Streaming
- **Live Bitcoin Radio** - 24/7 streaming of Bitcoin podcasts and content
- **Podcast Directory** - Browse and play episodes from top Bitcoin podcasters
- **Audio Player** - Full-featured player with compact and expanded views
- **Auto-Discovery** - Automatically detects value blocks in podcast RSS feeds

### ⚡ Lightning Integration
- **Podcasting 2.0 Boosts** - Send Lightning payments to support podcast creators
- **Value Split Support** - Automatic payment distribution based on podcast value blocks
- **Lightning Addresses** - LNURL-pay integration for seamless payments
- **WebLN & NWC** - Support for both WebLN browser wallets and Nostr Wallet Connect
- **Keysend Payments** - Direct Lightning node payments via NWC

### 🔐 Nostr Integration
- **Nostr Authentication** - Log in with Nostr keys or browser extensions
- **Multiple Accounts** - Switch between different Nostr identities
- **Profile Management** - Edit and manage your Nostr profile
- **Social Features** - Built on the decentralized Nostr protocol

## Technology Stack

- **Frontend**: React 18.x with TypeScript
- **Styling**: TailwindCSS 3.x + shadcn/ui components
- **Build Tool**: Vite for fast development and production builds
- **Nostr**: Nostrify framework for protocol integration
- **Lightning**: WebLN and NWC for Bitcoin payments
- **Audio**: HTML5 audio with custom controls
- **Data Fetching**: TanStack Query for caching and state management

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Audio Sources

The radio streams from a curated collection of Bitcoin podcasts including:
- TFTC: A Bitcoin Podcast
- Bitcoin Audible
- Citadel Dispatch
- Simply Bitcoin
- And many more...

## Lightning Payments

Support your favorite podcasters with Lightning payments:
1. **Connect a Wallet** - Use WebLN browser extensions or Nostr Wallet Connect
2. **Play a Podcast** - Choose any episode with value block support
3. **Send a Boost** - Click the lightning button to send sats to creators
4. **Auto-Split** - Payments are automatically distributed per podcast settings

## Configuration

The app automatically detects:
- **Value Blocks** from podcast RSS feeds (Podcasting 2.0 standard)
- **Lightning Addresses** and node pubkeys for payments
- **WebLN** browser wallet availability
- **NWC** connections for enhanced payment options

## Supported Wallets

### WebLN Compatible
- Alby Browser Extension
- Joule Browser Extension
- LNbits WebLN

### NWC Compatible
- Alby Hub
- Zeus (mobile)
- Mutiny Wallet
- Any NWC-enabled Lightning wallet

