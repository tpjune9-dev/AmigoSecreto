import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Gift, Sparkles, UserCheck, LogOut, ShieldCheck, PlusCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const Navbar: React.FC = () => {
  const { admin, cerrarSesion } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    cerrarSesion();
    showToast('Has cerrado sesión correctamente.', 'info');
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-pine-950/85 backdrop-blur-md border-b border-gold-500/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <Link
          to="/"
          className="flex items-center gap-2.5 group focus:outline-none"
          aria-label="Ir a la página principal de Amigo Secreto"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-crimson-500 to-crimson-700 flex items-center justify-center shadow-lg shadow-crimson-700/30 border border-gold-400/50 group-hover:scale-105 transition-transform">
            <Gift className="w-5 h-5 text-cream-50" />
          </div>
          <div>
            <span className="font-display font-bold text-lg sm:text-xl tracking-tight text-cream-50 flex items-center gap-1.5">
              Amigo Secreto
              <Sparkles className="w-4 h-4 text-gold-400 hidden sm:inline" />
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-1.5 sm:gap-3">
          <Link
            to="/unirse"
            className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
              location.pathname.startsWith('/unirse')
                ? 'bg-pine-700 text-gold-300 border border-gold-400/30'
                : 'text-cream-200 hover:text-cream-50 hover:bg-pine-800/70'
            }`}
          >
            Unirme
          </Link>

          <Link
            to="/resultado"
            className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 ${
              location.pathname.startsWith('/resultado')
                ? 'bg-pine-700 text-gold-300 border border-gold-400/30'
                : 'text-cream-200 hover:text-cream-50 hover:bg-pine-800/70'
            }`}
          >
            <UserCheck className="w-4 h-4 text-gold-400 hidden sm:inline" />
            <span>Mi Amigo Secreto</span>
          </Link>

          {admin ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link
                to="/admin/panel"
                className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                  location.pathname.startsWith('/admin')
                    ? 'bg-gold-500 text-pine-950 shadow-md shadow-gold-500/20'
                    : 'bg-pine-800 text-gold-300 border border-gold-400/30 hover:bg-pine-700'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span className="hidden md:inline">Panel ({admin.nombre.split(' ')[0]})</span>
                <span className="md:hidden">Panel</span>
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-cream-200 hover:text-crimson-500 hover:bg-pine-800/80 transition-colors"
                title="Cerrar sesión de administrador"
                aria-label="Cerrar sesión de administrador"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/crear-sorteo"
              className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-crimson-600 hover:bg-crimson-500 text-cream-50 shadow-md shadow-crimson-800/40 border border-gold-400/30 transition-all flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Crear sorteo</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

