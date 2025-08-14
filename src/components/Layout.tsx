import { ReactNode } from 'react';
import { CompactAudioPlayer } from '@/components/CompactAudioPlayer';
import { OrganizationSchema } from '@/components/OrganizationSchema';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
  className?: string;
}

export function Layout({ children, className }: LayoutProps) {
  return (
    <div className="min-h-screen">
      {/* Global Organization Schema for E-A-T */}
      <OrganizationSchema />
      
      {/* Main content with bottom padding to prevent player overlap */}
      <main className={cn("pb-20", className)}>
        {children}
      </main>
      
      {/* Fixed Audio Player - Always visible at bottom of viewport */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t">
        <CompactAudioPlayer />
      </div>
    </div>
  );
}