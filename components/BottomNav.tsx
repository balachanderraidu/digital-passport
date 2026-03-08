'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Shield, Hammer, Share2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/dashboard', label: 'Home',      Icon: Home },
  { href: '/vault',     label: 'Vault',     Icon: Shield },
  { href: '/snags',     label: 'Snags',     Icon: Hammer },
  { href: '/warranty',  label: 'Warranty',  Icon: Share2 },
  { href: '/assistant', label: 'AI',        Icon: Sparkles },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-vault-surface border-t border-vault-border bottom-nav-safe">
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map(({ href, label, Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition-all duration-200 min-w-[48px]',
                isActive
                  ? 'text-gold-500'
                  : 'text-vault-text-muted hover:text-vault-text'
              )}
            >
              <div className={cn(
                'relative p-1.5 rounded-xl transition-all duration-200',
                isActive && 'bg-gold-500/10 shadow-gold-glow-sm'
              )}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                {isActive && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-gold-500 rounded-full" />
                )}
              </div>
              <span className={cn(
                'text-[10px] font-medium tracking-wide',
                isActive ? 'text-gold-500' : 'text-vault-text-muted'
              )}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
