// ============================================================================
// EnvioTrack — Bottom Navigation (estilo iOS)
// ============================================================================
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, PlusCircle, Trash2, Settings, ScanLine } from 'lucide-react';

const navItems = [
  { href: '/', icon: Home, label: 'Inicio' },
  { href: '/new', icon: PlusCircle, label: 'Agregar' },
  { href: '/scanner', icon: ScanLine, label: 'Escanear' },
  { href: '/trash', icon: Trash2, label: 'Papelera' },
  { href: '/settings', icon: Settings, label: 'Ajustes' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-border-light">
      <div className="flex items-center justify-around max-w-lg mx-auto h-[var(--bottom-nav-height)] pb-[var(--safe-area-bottom)]">
        {navItems.map((item) => {
          const isActive = item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-colors"
            >
              <div className="relative">
                <Icon
                  className={`w-6 h-6 transition-colors duration-200 ${
                    isActive ? 'text-accent' : 'text-muted'
                  }`}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </div>
              <span
                className={`text-[10px] font-medium transition-colors duration-200 ${
                  isActive ? 'text-accent' : 'text-muted'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
