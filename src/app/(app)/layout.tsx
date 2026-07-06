'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseBrowser } from '@/lib/supabase'
import { LayoutDashboard, Users, Kanban, Calendar, BarChart3, LogOut } from 'lucide-react'

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pacientes', label: 'Pacientes', icon: Users },
  { href: '/kanban', label: 'Kanban', icon: Kanban },
  { href: '/agenda', label: 'Agenda', icon: Calendar },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart3 },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  async function handleLogout() {
    const supabase = getSupabaseBrowser()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden lg:flex w-60 bg-surface border-r border-border flex-col flex-shrink-0 p-6 fixed h-screen">
        <div className="flex items-center gap-2.5 text-lg font-bold font-display mb-8 px-2">
          <span>🗣️</span> FonoCRM
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          {links.map((link) => {
            const Icon = link.icon
            const isActive = pathname.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-sm text-sm font-medium no-underline transition-all ${isActive ? 'text-accent bg-accent-soft' : 'text-fg-2 hover:text-fg hover:bg-accent-soft'}`}
              >
                <Icon size={18} />
                {link.label}
              </Link>
            )
          })}
        </nav>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 mt-auto px-3 py-2.5 rounded-sm text-sm cursor-pointer border border-border text-muted hover:text-danger hover:border-danger bg-transparent transition-colors"
        >
          <LogOut size={16} />
          Sair
        </button>
      </aside>

      <main className="flex-1 lg:ml-60 p-4 sm:p-8 pb-[calc(var(--nav-height)+env(safe-area-inset-bottom,0)+16px)] lg:pb-8 overflow-y-auto">
        {children}
      </main>

      <nav className="botton-nav">
        {links.map((link) => {
          const Icon = link.icon
          const isActive = pathname.startsWith(link.href)
          return (
            <Link key={link.href} href={link.href} className={isActive ? 'active' : ''}>
              <Icon size={20} />
              <span>{link.label}</span>
            </Link>
          )
        })}
        <button onClick={handleLogout} className="flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium no-underline transition-colors relative" style={{ color: 'var(--muted)', minWidth: 48, height: '100%', padding: '4px 8px', background: 'none', border: 'none' }}>
          <LogOut size={20} />
          <span>Sair</span>
        </button>
      </nav>
    </div>
  )
}
