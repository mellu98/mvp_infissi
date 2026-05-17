'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  ScrollText,
  Settings,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/customers', label: 'Clienti', icon: Users },
  { href: '/quotes', label: 'Preventivi', icon: FileText },
  { href: '/products', label: 'Catalogo', icon: Package },
  { href: '/pricelists', label: 'Listini', icon: ScrollText },
  { href: '/settings', label: 'Impostazioni', icon: Settings },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-60 shrink-0 border-r bg-muted/40 md:block">
      <div className="flex h-14 items-center gap-2 border-b px-4 font-semibold">
        <Building2 className="h-5 w-5" />
        <span>Link Infissi</span>
      </div>
      <nav className="flex flex-col gap-1 p-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
