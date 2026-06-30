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

export default function Sidebar() {
  const pathname = usePathname()

  async function handleLogout() {
    const supabase = getSupabaseBrowser()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span>🗣️</span> FonoCRM
      </div>
      <nav>
        {links.map((link) => {
          const Icon = link.icon
          const isActive = pathname.startsWith(link.href)
          return (
            <Link key={link.href} href={link.href} className={isActive ? 'active' : ''}>
              <Icon size={18} />
              {link.label}
            </Link>
          )
        })}
      </nav>
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 mt-auto px-3 py-2.5 rounded-sm text-sm cursor-pointer border"
        style={{ background: 'none', borderColor: 'var(--border)', color: 'var(--muted)' }}
      >
        <LogOut size={16} />
        Sair
      </button>
    </aside>
  )
}
