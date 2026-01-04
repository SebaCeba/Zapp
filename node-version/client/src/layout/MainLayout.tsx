import Sidebar from '../components/Sidebar';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main className="main" style={{ flex: 1 }}>
        {children}
      </main>
    </div>
  );
}
