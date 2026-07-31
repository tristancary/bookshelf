import Link from 'next/link'

export function AppBar({
  title,
  subtitle,
  back,
  actions,
}: {
  title: string
  subtitle?: string
  back?: { href: string; label?: string }
  actions?: React.ReactNode
}) {
  return (
    <header className="bg-indigo text-parchment pt-safe">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3 min-h-[64px]">
        {back ? (
          <Link
            href={back.href}
            className="rounded-md -ml-2 px-2 py-2 hover:bg-indigo-soft/30 transition-colors text-sm inline-flex items-center gap-1"
            aria-label={back.label ?? 'Back'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
        ) : null}
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold tracking-tight truncate">
            {title}
          </h1>
          {subtitle ? (
            <p className="text-xs opacity-80 truncate mt-0.5">{subtitle}</p>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  )
}
