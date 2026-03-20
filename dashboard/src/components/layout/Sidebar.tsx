'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, ListTodo, GanttChart, ShieldAlert, Activity, FolderOpen, LogOut, Inbox, Radio } from 'lucide-react';
import { signOut } from 'next-auth/react';

const navItems = [
  { href: '/', label: 'Command Center', icon: Home },
  { href: '/tasks', label: 'Task Board', icon: ListTodo },
  { href: '/gantt', label: 'Gantt Timeline', icon: GanttChart },
  { href: '/risks', label: 'Risk Dashboard', icon: ShieldAlert },
  { href: '/pipelines', label: 'Pipelines', icon: Activity },
  { href: '/capture', label: 'Capture', icon: Inbox },
  { href: '/content-pipeline', label: 'Content Pipeline', icon: Radio },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-60 border-r border-border bg-card h-screen sticky top-0">
      <div className="px-5 py-5 border-b border-border">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-accent-primary flex items-center justify-center">
            <span className="text-white text-xs font-bold font-mono">OS</span>
          </div>
          <span className="font-display text-xl text-text-primary">AI OS</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                active
                  ? 'bg-accent-primary/15 text-accent-primary'
                  : 'text-text-secondary hover:bg-hover hover:text-text-primary',
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        <div className="pt-4 pb-2">
          <p className="px-3 text-[11px] font-semibold text-accent-primary uppercase tracking-[0.15em]">
            Projects
          </p>
        </div>

        <Link
          href="/projects/ai-os"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
            pathname === '/projects/ai-os'
              ? 'bg-accent-primary/15 text-accent-primary'
              : 'text-text-secondary hover:bg-hover hover:text-text-primary',
          )}
        >
          <FolderOpen className="h-4 w-4" />
          AI Operating System
        </Link>
        <Link
          href="/projects/aiu-youtube"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
            pathname === '/projects/aiu-youtube'
              ? 'bg-accent-primary/15 text-accent-primary'
              : 'text-text-secondary hover:bg-hover hover:text-text-primary',
          )}
        >
          <FolderOpen className="h-4 w-4" />
          AI&U YouTube
        </Link>
        <Link
          href="/projects/bharatvarsh"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
            pathname === '/projects/bharatvarsh'
              ? 'bg-accent-primary/15 text-accent-primary'
              : 'text-text-secondary hover:bg-hover hover:text-text-primary',
          )}
        >
          <FolderOpen className="h-4 w-4" />
          Bharatvarsh
        </Link>
      </nav>

      <div className="px-3 py-4 border-t border-border">
        <button
          onClick={() => signOut()}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-muted hover:bg-hover hover:text-accent-red transition-colors w-full"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
