import Sidebar from '../components/Sidebar';
import type { ReactNode } from 'react';

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen overflow-hidden bg-surface-bright">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto overflow-x-hidden bg-cream">
        {children}
      </main>
    </div>
  );
}
