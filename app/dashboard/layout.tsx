'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Layout,
  Layers,
  Plus,
  Bell,
  Calendar,
  BarChart3,
  Settings,
  MessageCircle,
  LogOut,
  ArrowLeft,
  Lock,
  Wallet,
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const appleNavItems = [
    { href: '/dashboard/passes', label: 'Library', icon: Layers },
    { href: '/dashboard/passes/new', label: 'Create', icon: Plus },
    { href: '/dashboard/notifications', label: 'Notification', icon: Bell },
    { href: '/dashboard/campaigns', label: 'Campaigns', icon: Calendar },
    { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/dashboard/accounts', label: 'Settings', icon: Settings },
  ];

  const googleNavItems = [
    { href: '/dashboard/google-wallet', label: 'Google Wallet', icon: Wallet },
  ];

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <Link href="/dashboard/passes" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-800 rounded flex items-center justify-center">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-gray-900">Apple Pass Ferda Scaler</span>
            <ArrowLeft className="w-4 h-4 text-gray-500 ml-auto" />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {/* Apple Wallet Section */}
          <div className="mb-2">
            <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Apple Wallet
            </p>
          </div>
          {appleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || 
              (item.href !== '/dashboard/passes' && pathname?.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                  isActive
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}

          {/* Divider */}
          <div className="my-4 border-t border-gray-200" />

          {/* Google Wallet Section */}
          <div className="mb-2">
            <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Google Wallet
            </p>
          </div>
          {googleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname?.startsWith(item.href);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
          
          {/* Contact Support */}
          <div className="mt-4">
            <Link
              href="/support"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="font-medium">Contact support</span>
            </Link>
          </div>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-gray-700">CO</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Michael</p>
            </div>
          </div>
          <button
            onClick={() => {
              // Handle logout
              router.push('/');
            }}
            className="flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-gray-50">
        <div className="container mx-auto px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
