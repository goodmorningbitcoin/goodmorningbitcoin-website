import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { LoginArea } from '@/components/auth/LoginArea';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';

export function Header() {
  const { user } = useCurrentUser();
  const [isOpen, setIsOpen] = useState(false);

  const navigationLinks = [
    { to: '/about', label: 'About', type: 'internal' },
    ...(user ? [{ to: '/community', label: 'Community', type: 'internal' }] : []),
    { to: 'https://www.orangem.art/', label: 'Orange', type: 'external' },
    { to: '/shows', label: 'Shows', type: 'internal' },
    { to: 'https://nostr.blue/naddr1qqjxzdrxv5cxxvfk943r2drz956rzve495urxwtr95unjcmp8pjxzepkxccnjq3qn35s0hnjukw675njzqargeym7l9qzpg2dr6q9924yr798kafwvxsxpqqqpaq2va54sn', label: 'Nostr Radio', type: 'external' },
  ];

  return (
    <header className="bg-gmb-orange text-white">
      <div className="container flex h-16 items-center px-4">
        {/* Left: Hamburger menu (mobile) and Site name (desktop) */}
        <div className="flex items-center gap-4">
          {/* Mobile hamburger menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-white hover:bg-white/20"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] bg-gmb-orange text-white border-r-0">
              <SheetHeader>
                <SheetTitle className="text-white text-left text-lg font-bold">
                  <Link to="/">GoodMorningBitcoin.com</Link>
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-8 flex flex-col gap-2">
                {navigationLinks.map((link) => (
                  link.type === 'internal' ? (
                    <Link 
                      key={link.to}
                      to={link.to}
                      className="text-white hover:bg-white/10 px-3 py-2 rounded-md transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <a 
                      key={link.to}
                      href={link.to}
                      className="text-white hover:bg-white/10 px-3 py-2 rounded-md transition-colors"
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={() => setIsOpen(false)}
                    >
                      {link.label}
                    </a>
                  )
                ))}
              </nav>
            </SheetContent>
          </Sheet>
          
          {/* Desktop site name */}
          <Link
            to="/"
            className="hidden md:block text-xl font-bold hover:opacity-80 transition-opacity"
          >
            GOOD MORNING BITCOIN.COM
          </Link>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right: Desktop Links and Login/Profile */}
        <div className="flex items-center gap-4">
          {/* Desktop navigation links */}
          <nav className="hidden md:flex items-center gap-4">
            {navigationLinks.map((link) => (
              link.type === 'internal' ? (
                <Link 
                  key={link.to}
                  to={link.to}
                  className="text-white hover:bg-white/10 px-3 py-2 rounded-md transition-colors text-sm font-medium"
                >
                  {link.label}
                </Link>
              ) : (
                <a 
                  key={link.to}
                  href={link.to}
                  className="text-white hover:bg-white/10 px-3 py-2 rounded-md transition-colors text-sm font-medium"
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  {link.label}
                </a>
              )
            ))}
          </nav>
          
          {/* Login/Profile */}
          <LoginArea className="max-w-60" />
        </div>
      </div>
    </header>
  );
}