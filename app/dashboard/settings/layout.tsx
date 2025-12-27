'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  User,
  Shield,
  Bell,
  Palette,
  Key,
  Link2,
  Building2,
  Users,
  CreditCard,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

const accountNavItems: NavItem[] = [
  { label: 'Profile', href: '/dashboard/settings/profile', icon: User },
  { label: 'Security', href: '/dashboard/settings/security', icon: Shield },
  { label: 'Notifications', href: '/dashboard/settings/notifications', icon: Bell },
  { label: 'Appearance', href: '/dashboard/settings/appearance', icon: Palette },
];

const developerNavItems: NavItem[] = [
  { label: 'API Keys', href: '/dashboard/settings/api-keys', icon: Key },
  { label: 'Connected Accounts', href: '/dashboard/settings/connections', icon: Link2 },
];

const organizationNavItems: NavItem[] = [
  { label: 'General', href: '/dashboard/settings/organization', icon: Building2, adminOnly: true },
  { label: 'Team Members', href: '/dashboard/settings/organization/members', icon: Users, adminOnly: true },
  { label: 'Billing', href: '/dashboard/settings/organization/billing', icon: CreditCard, adminOnly: true },
];

function NavSection({
  title,
  items,
  currentPath,
  isAdmin = false,
}: {
  title: string;
  items: NavItem[];
  currentPath: string;
  isAdmin?: boolean;
}) {
  const filteredItems = items.filter(item => !item.adminOnly || isAdmin);

  if (filteredItems.length === 0) return null;

  return (
    <div className="mb-6">
      <h3 className="text-xs font-semibold uppercase tracking-wider mb-2 px-3" style={{ color: 'rgb(var(--foreground-muted))' }}>
        {title}
      </h3>
      <nav className="space-y-1">
        {filteredItems.map((item) => {
          const isActive = currentPath === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                  : 'hover:opacity-80'
              }`}
              style={!isActive ? { color: 'rgb(var(--foreground-secondary))' } : {}}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-primary-600 dark:text-primary-400' : ''}`} style={!isActive ? { color: 'rgb(var(--foreground-muted))' } : {}} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Check if user is an admin (has org admin role or is enterprise account)
  const isAdmin =
    (session?.user as any)?.organizationRole === 'ADMIN' ||
    (session?.user as any)?.organizationRole === 'OWNER' ||
    session?.user?.accountType === 'enterprise';

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: 'rgb(var(--foreground))' }}>Settings</h1>
          <p className="mt-1 text-sm" style={{ color: 'rgb(var(--foreground-muted))' }}>
            Manage your account settings and preferences
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="sticky top-8">
              <NavSection
                title="Account"
                items={accountNavItems}
                currentPath={pathname}
              />
              <NavSection
                title="Developer"
                items={developerNavItems}
                currentPath={pathname}
              />
              <NavSection
                title="Organization"
                items={organizationNavItems}
                currentPath={pathname}
                isAdmin={isAdmin}
              />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="rounded-xl shadow-sm" style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}>
              {children}
            </div>
          </main>
        </div>
      </div>
    </DashboardLayout>
  );
}
