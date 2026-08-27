import './App.css'
import Productos from './pages/productos';
import Vencimientos from './pages/vencimientos';
import { useState, useEffect, type FormEvent } from 'react'
import { supabase } from "./supabaseClient";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
  type NavLinkProps
} from 'react-router-dom'

import {
  Package,
  CalendarClock,
  Lock
} from 'lucide-react'

interface SupabaseSession {
  user: {
    id: string;
    email?: string;
  };
}

function App() {
  const [session, setSession] = useState<SupabaseSession | null | any>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [authError, setAuthError] = useState<string>('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setAuthError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setAuthError('Acceso denegado. Verifica los datos.')
  }

  const menuClass: NavLinkProps['className'] = ({ isActive }) =>
    `flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 font-medium
    ${isActive
      ? 'bg-blue-600 text-white shadow-md'
      : 'text-gray-300 hover:bg-white/10 hover:text-white'
    }`

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center text-white">
        <p className="animate-pulse font-medium text-sm">Cargando sistema...</p>
      </div>
    )
  }

  // Modificado: Login adaptado al modo oscuro para no lastimar los ojos
  if (!session) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-4">
        <div className="bg-[#1a1d26] p-8 rounded-2xl shadow-2xl max-w-md w-full border border-gray-800">
          <div className="flex flex-col items-center mb-6">
            <div className="bg-blue-950 p-3 rounded-full text-blue-400 mb-3 border border-blue-900/50">
              <Lock size={30} />
            </div>
            <h2 className="text-2xl font-bold text-white text-center">Control de Acceso</h2>
            <p className="text-sm text-gray-400 text-center mt-1">Ingresa las credenciales de la tienda</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Usuario / Email</label>
              <input
                type="email"
                className="w-full px-4 py-2 bg-[#0f1117] border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
                placeholder="tunombre@tiendly.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Contraseña</label>
              <input
                type="password"
                className="w-full px-4 py-2 bg-[#0f1117] border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {authError && <p className="text-red-400 text-xs font-medium bg-red-950/50 border border-red-900/50 p-2 rounded-lg">{authError}</p>}

            <button type="submit" className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl hover:bg-blue-700 transition duration-300 shadow-md">
              Entrar al Sistema
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Navbar */}
        <nav className="sticky top-0 z-50 bg-[#0f1117] border-b border-gray-800 shadow-lg">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 gap-3">
              {/* Menú */}
              <div className="flex flex-wrap gap-2">
                <NavLink to="/" end className={menuClass}>
                  <Package size={18} />
                  <span>Productos</span>
                </NavLink>

                <NavLink to="/vencimientos" className={menuClass}>
                  <CalendarClock size={18} />
                  <span>Vencimientos</span>
                </NavLink>
              </div>
            </div>
          </div>
        </nav>

        {/* Contenido */}
        <main className="w-full">
          <Routes>
            <Route path="/" element={<Productos />} />
            <Route path="/vencimientos" element={<Vencimientos />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
