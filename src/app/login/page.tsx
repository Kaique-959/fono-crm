'use client'

import { useState } from 'react'
import { getSupabaseBrowser } from '@/lib/supabase'
import { Stethoscope } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = getSupabaseBrowser()

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    toast.success('Login realizado!')
    window.location.href = '/dashboard'
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-6" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-md mb-3 sm:mb-5" style={{ background: 'var(--accent-soft)' }}>
            <Stethoscope size={24} style={{ color: 'var(--accent)' }} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold" style={{ color: 'var(--fg)' }}>
            FonoCRM
          </h1>
          <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--muted)' }}>
            Dra. Libertad Delgado — Fonoaudiologia
          </p>
        </div>

        <div className="rounded-lg border p-5 sm:p-8 shadow-sm" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1" style={{ color: 'var(--fg-2)' }}>
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1" style={{ color: 'var(--fg-2)' }}>
                Senha
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5 text-sm">
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] sm:text-xs mt-4 sm:mt-6" style={{ color: 'var(--muted)' }}>
          Dra. Libertad Delgado — Fonoaudiologia
        </p>
      </div>
    </div>
  )
}
