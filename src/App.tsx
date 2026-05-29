import './App.css'
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
  Store
} from 'lucide-react'

import Productos from './pages/productos'
import Vencimientos from './pages/vencimientos'

function App() {

  const menuClass: NavLinkProps['className'] = ({ isActive }) =>
    `flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 font-medium
    ${isActive
      ? 'bg-blue-600 text-white shadow-md'
      : 'text-gray-300 hover:bg-white/10 hover:text-white'
    }`

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">

        {/* Navbar */}
        <nav className="sticky top-0 z-50 bg-[#0f1117] border-b border-gray-800 shadow-lg">
          <div className="max-w-7xl mx-auto px-4">

            <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 gap-3">

              {/* Logo */}
              <div className="flex items-center gap-3">

                <div className="bg-blue-600 p-2 rounded-xl">
                  <Store size={22} className="text-white" />
                </div>

                <div>
                  <h1 className="font-bold text-lg text-white">
                    Sistema de Inventario
                  </h1>
                  <p className="text-xs text-gray-400">
                    Gestión de productos y vencimientos
                  </p>
                </div>

              </div>

              {/* Menú */}
              <div className="flex flex-wrap gap-2">

                <NavLink
                  to="/"
                  end
                  className={menuClass}
                >
                  <Package size={18} />
                  <span>Productos</span>
                </NavLink>

                <NavLink
                  to="/vencimientos"
                  className={menuClass}
                >
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