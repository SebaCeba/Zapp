import { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';
import { PageHeader } from './PageHeader';

interface MainLayoutProps {
  children: ReactNode;
  headerProps?: React.ComponentProps<typeof PageHeader>;
}

export function MainLayout({ children, headerProps }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-cream text-on-background antialiased">
      <AppSidebar />
      
      <main className="ml-56 min-h-screen relative">
        {headerProps && <PageHeader {...headerProps} />}
        
        <div className="p-8 max-w-7xl mx-auto space-y-8 pb-16">
          {children}
        </div>
      </main>
    </div>
  );
}
