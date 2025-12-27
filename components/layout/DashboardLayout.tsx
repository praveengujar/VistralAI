'use client';

import { ReactNode, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ROUTES } from '@/lib/constants';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import {
  LayoutDashboard,
  Lightbulb,
  BarChart3,
  Bell,
  LogOut,
  Menu,
  X,
  Users,
  Building2,
  FileText,
  ChevronRight,
  Sparkles,
  Radar,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Command Center', href: ROUTES.DASHBOARD, icon: LayoutDashboard, description: 'Overview & metrics' },
  { name: 'Brand Story', href: ROUTES.BRAND_PROFILE, icon: Building2, description: 'Your brand profile' },
  { name: 'AI Perception', href: ROUTES.AEO, icon: Radar, description: 'AEO dashboard' },
  { name: 'Growth', href: ROUTES.INSIGHTS, icon: Lightbulb, description: 'Opportunities' },
  { name: 'Landscape', href: ROUTES.ANALYTICS, icon: BarChart3, description: 'Market analysis' },
  { name: 'Moments', href: ROUTES.ALERTS, icon: Bell, description: 'Brand alerts' },
  { name: 'Reports', href: ROUTES.REPORT, icon: FileText, description: 'Generate reports' },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isAgency = session?.user?.accountType === 'agency';

  return (
    <div
      className="min-h-screen transition-colors duration-200"
      style={{ backgroundColor: 'rgb(var(--background))' }}
    >
      {/* Sidebar - Desktop */}
      <motion.div
        initial={false}
        animate={{ width: isCollapsed ? 80 : 280 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col z-40"
      >
        <div
          className="flex flex-col flex-grow overflow-hidden shadow-soft transition-colors duration-200"
          style={{
            backgroundColor: 'rgb(var(--sidebar))',
            borderRight: '1px solid rgb(var(--sidebar-border))',
          }}
        >
          {/* Logo */}
          <div
            className="flex items-center justify-between h-16 px-4"
            style={{ borderBottom: '1px solid rgb(var(--border) / 0.5)' }}
          >
            <Link href={ROUTES.DASHBOARD} className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-soft">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent"
                  >
                    VistralAI
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'rgb(var(--foreground-muted))' }}
            >
              <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-180'}`} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto no-scrollbar">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200"
                  style={{
                    backgroundColor: isActive ? 'rgb(var(--sidebar-active))' : 'transparent',
                    color: isActive ? 'rgb(var(--primary))' : 'rgb(var(--sidebar-foreground))',
                  }}
                >
                  <div
                    className="flex-shrink-0 p-1.5 rounded-lg transition-colors"
                    style={{
                      backgroundColor: isActive ? 'rgb(var(--primary) / 0.15)' : 'transparent',
                    }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="flex-1 min-w-0"
                      >
                        <span className="text-sm font-medium">{item.name}</span>
                        {!isActive && (
                          <span
                            className="block text-xs truncate"
                            style={{ color: 'rgb(var(--foreground-muted))' }}
                          >
                            {item.description}
                          </span>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Link>
              );
            })}

            {isAgency && (
              <Link
                href={ROUTES.AGENCY}
                className="group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200"
                style={{
                  backgroundColor: pathname === ROUTES.AGENCY ? 'rgb(var(--sidebar-active))' : 'transparent',
                  color: pathname === ROUTES.AGENCY ? 'rgb(var(--primary))' : 'rgb(var(--sidebar-foreground))',
                }}
              >
                <div
                  className="flex-shrink-0 p-1.5 rounded-lg transition-colors"
                  style={{
                    backgroundColor: pathname === ROUTES.AGENCY ? 'rgb(var(--primary) / 0.15)' : 'transparent',
                  }}
                >
                  <Users className="w-5 h-5" />
                </div>
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex-1"
                    >
                      <span className="text-sm font-medium">Clients</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Link>
            )}
          </nav>

          {/* User Section */}
          <div
            className="flex-shrink-0 p-3"
            style={{ borderTop: '1px solid rgb(var(--border) / 0.5)' }}
          >
            <Link
              href={ROUTES.SETTINGS}
              className={`flex items-center gap-3 p-2 rounded-xl transition-all duration-200 ${isCollapsed ? 'justify-center' : ''}`}
              style={{
                backgroundColor: pathname?.startsWith(ROUTES.SETTINGS)
                  ? 'rgb(var(--sidebar-active))'
                  : 'rgb(var(--surface-hover))',
              }}
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-soft">
                  <span className="text-sm font-semibold text-white">
                    {session?.user?.email?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              </div>
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex-1 min-w-0"
                  >
                    <p
                      className="text-sm font-medium truncate"
                      style={{ color: 'rgb(var(--foreground))' }}
                    >
                      {session?.user?.email?.split('@')[0] || 'User'}
                    </p>
                    <p
                      className="text-xs capitalize"
                      style={{ color: 'rgb(var(--foreground-muted))' }}
                    >
                      {session?.user?.accountType || 'Brand'}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: ROUTES.LOGIN })}
              className={`w-full mt-2 flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${isCollapsed ? 'justify-center' : ''}`}
              style={{ color: 'rgb(var(--error))' }}
            >
              <LogOut className="w-4 h-4" />
              {!isCollapsed && 'Sign out'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Mobile Header */}
      <div className="lg:hidden">
        <div
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-16 px-4 backdrop-blur-xl shadow-soft transition-colors duration-200"
          style={{
            backgroundColor: 'rgb(var(--surface) / 0.95)',
            borderBottom: '1px solid rgb(var(--border) / 0.6)',
          }}
        >
          <Link href={ROUTES.DASHBOARD} className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-soft">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
              VistralAI
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl transition-colors"
              style={{ color: 'rgb(var(--foreground-secondary))' }}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 backdrop-blur-sm"
                style={{ backgroundColor: 'rgb(var(--background-inverse) / 0.2)' }}
                onClick={() => setMobileMenuOpen(false)}
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 left-0 bottom-0 z-50 w-80 shadow-elevated transition-colors duration-200"
                style={{ backgroundColor: 'rgb(var(--surface))' }}
              >
                <div className="flex flex-col h-full">
                  {/* Mobile Header */}
                  <div
                    className="flex items-center justify-between h-16 px-4"
                    style={{ borderBottom: '1px solid rgb(var(--border) / 0.5)' }}
                  >
                    <Link href={ROUTES.DASHBOARD} className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                      <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-lg font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                        VistralAI
                      </span>
                    </Link>
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-2 rounded-xl transition-colors"
                      style={{ color: 'rgb(var(--foreground-muted))' }}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Mobile Navigation */}
                  <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    {navigation.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200"
                          style={{
                            backgroundColor: isActive ? 'rgb(var(--sidebar-active))' : 'transparent',
                            color: isActive ? 'rgb(var(--primary))' : 'rgb(var(--sidebar-foreground))',
                          }}
                        >
                          <div
                            className="p-2 rounded-lg"
                            style={{
                              backgroundColor: isActive ? 'rgb(var(--primary) / 0.15)' : 'rgb(var(--surface-hover))',
                            }}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-sm font-medium">{item.name}</span>
                            <span
                              className="block text-xs"
                              style={{ color: 'rgb(var(--foreground-muted))' }}
                            >
                              {item.description}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                    {isAgency && (
                      <Link
                        href={ROUTES.AGENCY}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200"
                        style={{
                          backgroundColor: pathname === ROUTES.AGENCY ? 'rgb(var(--sidebar-active))' : 'transparent',
                          color: pathname === ROUTES.AGENCY ? 'rgb(var(--primary))' : 'rgb(var(--sidebar-foreground))',
                        }}
                      >
                        <div
                          className="p-2 rounded-lg"
                          style={{
                            backgroundColor: pathname === ROUTES.AGENCY ? 'rgb(var(--primary) / 0.15)' : 'rgb(var(--surface-hover))',
                          }}
                        >
                          <Users className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium">Clients</span>
                      </Link>
                    )}
                  </nav>

                  {/* Mobile User Section */}
                  <div
                    className="p-4"
                    style={{ borderTop: '1px solid rgb(var(--border) / 0.5)' }}
                  >
                    <Link
                      href={ROUTES.SETTINGS}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 p-3 rounded-xl mb-3 transition-all duration-200"
                      style={{
                        backgroundColor: pathname?.startsWith(ROUTES.SETTINGS)
                          ? 'rgb(var(--sidebar-active))'
                          : 'rgb(var(--surface-hover))',
                      }}
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                        <span className="text-sm font-semibold text-white">
                          {session?.user?.email?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-medium truncate"
                          style={{ color: 'rgb(var(--foreground))' }}
                        >
                          {session?.user?.email}
                        </p>
                        <p
                          className="text-xs capitalize"
                          style={{ color: 'rgb(var(--foreground-muted))' }}
                        >
                          {session?.user?.accountType}
                        </p>
                      </div>
                    </Link>
                    <button
                      onClick={() => signOut({ callbackUrl: ROUTES.LOGIN })}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors"
                      style={{
                        backgroundColor: 'rgb(var(--error-background))',
                        color: 'rgb(var(--error))',
                      }}
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Main Content */}
      <motion.div
        initial={false}
        animate={{ marginLeft: isCollapsed ? 80 : 280 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="lg:flex lg:flex-col lg:flex-1 hidden"
      >
        <main className="flex-1 py-6">
          <div className="animate-fade-in">{children}</div>
        </main>
      </motion.div>

      {/* Mobile Main Content */}
      <div className="lg:hidden pt-16">
        <main className="flex-1 py-6">
          <div className="animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
