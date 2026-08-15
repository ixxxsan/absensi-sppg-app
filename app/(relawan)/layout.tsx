import BottomNav from '@/components/BottomNav';

export default function RelawanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="page-shell">
      {/* Main content area with bottom padding for nav */}
      <main className="flex-1 pb-24">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
