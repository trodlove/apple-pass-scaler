import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/dashboard/passes', label: 'Passes' },
    { href: '/dashboard/campaigns', label: 'Campaigns' },
    { href: '/dashboard/sequences', label: 'Sequences' },
    { href: '/dashboard/accounts', label: 'Accounts' },
    { href: '/dashboard/templates', label: 'Templates' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="text-xl font-bold">
              Apple Pass Scaler
            </Link>
            <div className="flex gap-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    "text-muted-foreground"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}

