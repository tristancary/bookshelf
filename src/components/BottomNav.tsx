'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const items = [
  {
    href: '/',
    label: 'Library',
    match: (p: string) => p === '/' || p.startsWith('/book/'),
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4v16M8 4v16M14 4l2 16M18 4l2 16" />
      </svg>
    ),
  },
  {
    href: '/add',
    label: 'Add',
    match: (p: string) => p.startsWith('/add'),
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M12 9v6M9 12h6" />
      </svg>
    ),
  },
  {
    href: '/readers',
    label: 'Readers',
    match: (p: string) => p.startsWith('/readers'),
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: '/household',
    label: 'Household',
    match: (p: string) => p.startsWith('/household'),
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11l9-7 9 7" />
        <path d="M5 10v10h14V10" />
      </svg>
    ),
  },
]

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav
      className="fixed bottom-0 inset-x-0 bg-parchment border-t border-line pb-safe z-40"
      aria-label="Main navigation"
    >
      <div className="max-w-5xl mx-auto grid grid-cols-4">
        {items.map((item) => {
          const active = item.match(pathname)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-2.5 min-h-[56px] gap-0.5 transition-colors ${
                active ? 'text-indigo' : 'text-ink-muted hover:text-ink'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              {item.icon}
              <span className="text-[11px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
