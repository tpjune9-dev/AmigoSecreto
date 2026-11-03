import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Gift,
  Calendar,
  Coins,
  FileText,
  Copy,
  Share2,
  Users,
  Lock,
  Mail,
  User,
  Check,
  Sparkles,
  LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  loginAdmin,
  registrarAdmin,
  crearSorteo,
  SorteoResumen,
  construirEnlaceInvitacion,
  generarUrlWhatsAppCompartirInvitacion,
} from '../services/api';
import { GiftIllustration } from '../components/ChristmasDecorations';

export const CreateDrawPage: React.FC = () => {
  const { admin, token, iniciarSesion } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Estado para formulario de autenticación (Login / Registro de Administrador)
  const [modoAuth, setModoAuth] = useState<'login' | 'registro'>('login');
  const [nombreAdmin, setNombreAdmin] = useState('');
  const [emailAdmin, setEmailAdmin] = useState('');
  const [passwordAdmin, setPasswordAdmin] = useState('');
  const [cargandoAuth, setCargandoAuth] = useState(false);

  // Estado para formulario de creación de sorteo
  const [nombreSorteo, setNombreSorteo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fechaEvento, setFechaEvento] = useState('');
  const [presupuesto, setPresupuesto] = useState('');
  const [cargandoSorteo, setCargandoSorteo] = useState(false);

  // Estado de sorteo recién creado
  const [sorteoCreado, setSorteoCreado] = useState<SorteoResumen | null>(null);
  const [copiadoCodigo, setCopiadoCodigo] = useState(false);
  const [copiadoEnlace, setCopiadoEnlace] = useState(false);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargandoAuth(true);

    try {
      if (modoAuth === 'registro') {
        const res = await registrarAdmin({
          nombre: nombreAdmin,
          email: emailAdmin,
          password: passwordAdmin,
        });
        iniciarSesion(res.token, res.administrador);
        showToast('¡Cuenta de administrador creada con éxito!', 'success');
      } else {
        const res = await loginAdmin({
          email: emailAdmin,
          password: passwordAdmin,
        });
        iniciarSesion(res.token, res.administrador);
        showToast(`¡Bienvenido nuevamente, ${res.administrador.nombre}!`, 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Error al autenticar administrador.', 'error');
    } finally {
      setCargandoAuth(false);
    }
  };

  const handleCrearSorteo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setCargandoSorteo(true);
    try {
      const montoPresupuesto = presupuesto.trim() !== '' ? Number(presupuesto) : null;
      const res = await crearSorteo(token, {
        nombre: nombreSorteo,
        descripcion: descripcion.trim() || undefined,
        fecha_evento: fechaEvento,
        presupuesto: montoPresupuesto,
      });

      setSorteoCreado(res.sorteo);
      showToast(`¡Sorteo creado con el código ${res.sorteo.codigo_unico}!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'No se pudo crear el sorteo.', 'error');
    } finally {
      setCargandoSorteo(false);
    }
  };

  const copiarTexto = async (texto: string, tipo: 'codigo' | 'enlace') => {
    try {
      await navigator.clipboard.writeText(texto);
      if (tipo === 'codigo') {
        setCopiadoCodigo(true);
        setTimeout(() => setCopiadoCodigo(false), 2500);
        showToast('Código copiado al portapapeles.', 'success');
      } else {
        setCopiadoEnlace(true);
        setTimeout(() => setCopiadoEnlace(false), 2500);
        showToast('Enlace de invitación copiado al portapapeles.', 'success');
      }
    } catch {
      showToast('No se pudo copiar automáticamente. Selecciónalo manualmente.', 'info');
    }
  };

  // 1. Si no ha iniciado sesión como administrador, mostrar pantalla de autenticación
  if (!admin || !token) {
    return (
      <div className="max-w-md mx-auto py-10 px-4 sm:px-6">
        <div className="card-cream rounded-3xl p-6 sm:p-8 border-2 border-gold-400/50">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-crimson-600 text-cream-50 shadow-lg mb-3">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-pine-900">
              Acceso de Organizador
            </h1>
            <p className="text-sm text-pine-700 mt-1">
              Inicia sesión o crea tu cuenta de administrador para crear y gestionar tus sorteos.
            </p>
          </div>

          {/* Selector de pestaña */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-cream-200 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => setModoAuth('login')}
              className={`py-2.5 rounded-xl font-bold text-sm transition-all ${
                modoAuth === 'login'
                  ? 'bg-pine-800 text-cream-50 shadow'
                  : 'text-pine-800 hover:bg-cream-300/60'
              }`}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => setModoAuth('registro')}
              className={`py-2.5 rounded-xl font-bold text-sm transition-all ${
                modoAuth === 'registro'
                  ? 'bg-crimson-600 text-cream-50 shadow'
                  : 'text-pine-800 hover:bg-cream-300/60'
              }`}
            >
              Crear cuenta
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {modoAuth === 'registro' && (
              <div>
                <label
                  htmlFor="admin-nombre"
                  className="block text-xs font-bold uppercase tracking-wider text-pine-800 mb-1.5"
                >
                  Nombre completo
                </label>
                <div className="relative">
                  <User className="w-5 h-5 text-pine-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="admin-nombre"
                    type="text"
                    required
                    minLength={2}
                    value={nombreAdmin}
                    onChange={(e) => setNombreAdmin(e.target.value)}
                    placeholder="Ej. Carlos Mendoza"
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-pine-500/30 text-pine-900 font-medium focus:outline-none focus:ring-2 focus:ring-pine-600"
                  />
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="admin-email"
                className="block text-xs font-bold uppercase tracking-wider text-pine-800 mb-1.5"
              >
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-pine-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="admin-email"
                  type="email"
                  required
                  value={emailAdmin}
                  onChange={(e) => setEmailAdmin(e.target.value)}
                  placeholder="organizador@ejemplo.com"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-pine-500/30 text-pine-900 font-medium focus:outline-none focus:ring-2 focus:ring-pine-600"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-bold uppercase tracking-wider text-pine-800 mb-1.5"
              >
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-pine-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="admin-password"
                  type="password"
                  required
                  minLength={6}
                  value={passwordAdmin}
                  onChange={(e) => setPasswordAdmin(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-pine-500/30 text-pine-900 font-medium focus:outline-none focus:ring-2 focus:ring-pine-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={cargandoAuth}
              className="w-full py-4 rounded-2xl font-display font-bold text-base bg-crimson-600 hover:bg-crimson-700 text-cream-50 shadow-lg shadow-crimson-600/30 transition-all disabled:opacity-60 mt-2"
            >
              {cargandoAuth
                ? 'Verificando...'
                : modoAuth === 'login'
                ? 'Ingresar y continuar'
                : 'Registrarme como administrador'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. Si el sorteo acaba de crearse, mostrar la pantalla con código, enlace, WhatsApp y Ver participantes
  if (sorteoCreado) {
    const enlaceInvitacion = construirEnlaceInvitacion(sorteoCreado.codigo_unico);
    const urlWhatsApp = generarUrlWhatsAppCompartirInvitacion(
      sorteoCreado.nombre,
      sorteoCreado.codigo_unico,
      enlaceInvitacion
    );

    return (
      <div className="max-w-xl mx-auto py-10 px-4 sm:px-6 animate-reveal">
        <div className="card-cream rounded-3xl p-6 sm:p-8 border-2 border-gold-400 text-center">
          <div className="flex justify-center mb-4">
            <GiftIllustration className="w-20 h-20" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-pine-100 text-pine-800 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-gold-600" />
            ¡Sorteo listo para recibir participantes!
          </span>

          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-pine-900 mb-2">
            {sorteoCreado.nombre}
          </h1>
          <p className="text-sm text-pine-700 mb-6">
            Comparte este código o el enlace directo con tus amigos para que se registren desde su
            celular.
          </p>

          {/* Tarjeta destacada con el código único */}
          <div className="bg-pine-900 text-cream-50 rounded-2xl p-5 mb-6 border-2 border-gold-400 shadow-inner">
            <p className="text-xs uppercase tracking-widest text-gold-300 font-bold mb-1">
              Código del sorteo
            </p>
            <div className="font-display font-extrabold text-3xl sm:text-4xl tracking-wider text-gold-400 mb-4">
              {sorteoCreado.codigo_unico}
            </div>
            <button
              type="button"
              onClick={() => copiarTexto(sorteoCreado.codigo_unico, 'codigo')}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-pine-950 font-bold text-sm transition-all"
            >
              {copiadoCodigo ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiadoCodigo ? '¡Código copiado!' : 'Copiar código'}</span>
            </button>
          </div>

          {/* Enlace de invitación precargado */}
          <div className="text-left bg-cream-200/80 rounded-2xl p-4 mb-6 border border-pine-600/20">
            <label className="block text-xs font-bold uppercase tracking-wider text-pine-800 mb-1.5">
              Enlace directo de invitación
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={enlaceInvitacion}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white text-pine-900 text-xs sm:text-sm font-medium border border-pine-500/20 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => copiarTexto(enlaceInvitacion, 'enlace')}
                className="shrink-0 px-4 py-2.5 rounded-xl bg-pine-800 hover:bg-pine-700 text-cream-50 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors"
              >
                {copiadoEnlace ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiadoEnlace ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          {/* Botones de acción principales */}
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={urlWhatsApp}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-1/2 py-4 px-5 rounded-2xl font-display font-bold text-sm sm:text-base bg-[#25D366] hover:bg-[#1ebe57] text-pine-950 shadow-lg flex items-center justify-center gap-2 transition-all"
            >
              <Share2 className="w-5 h-5" />
              <span>Compartir por WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={() => navigate(`/admin/panel?sorteoId=${sorteoCreado.id}`)}
              className="w-full sm:w-1/2 py-4 px-5 rounded-2xl font-display font-bold text-sm sm:text-base bg-crimson-600 hover:bg-crimson-700 text-cream-50 shadow-lg flex items-center justify-center gap-2 transition-all"
            >
              <Users className="w-5 h-5" />
              <span>Ver participantes</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Formulario para crear un sorteo
  return (
    <div className="max-w-xl mx-auto py-8 sm:py-12 px-4 sm:px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-cream-50">
            🎁 Crear un nuevo sorteo
          </h1>
          <p className="text-sm text-cream-200/80">
            Organizador: <span className="font-semibold text-gold-300">{admin.nombre}</span>
          </p>
        </div>

        <Link
          to="/admin/panel"
          className="px-4 py-2 rounded-xl bg-pine-800 hover:bg-pine-700 text-gold-300 border border-gold-400/30 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors"
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Mis sorteos</span>
        </Link>
      </div>

      <div className="card-cream rounded-3xl p-6 sm:p-8 border-2 border-gold-400/50">
        <form onSubmit={handleCrearSorteo} className="space-y-5">
          <div>
            <label
              htmlFor="sorteo-nombre"
              className="block text-xs font-bold uppercase tracking-wider text-pine-800 mb-1.5"
            >
              Nombre del sorteo *
            </label>
            <div className="relative">
              <Gift className="w-5 h-5 text-crimson-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="sorteo-nombre"
                type="text"
                required
                minLength={3}
                maxLength={150}
                value={nombreSorteo}
                onChange={(e) => setNombreSorteo(e.target.value)}
                placeholder="Ej. Navidad Familia Pérez 2026"
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white border border-pine-500/30 text-pine-900 font-medium focus:outline-none focus:ring-2 focus:ring-crimson-600"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="sorteo-descripcion"
              className="block text-xs font-bold uppercase tracking-wider text-pine-800 mb-1.5"
            >
              Descripción o reglas (opcional)
            </label>
            <div className="relative">
              <FileText className="w-5 h-5 text-pine-600 absolute left-3.5 top-3.5" />
              <textarea
                id="sorteo-descripcion"
                rows={3}
                maxLength={1000}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Ej. Nos reuniremos en casa de la abuela a las 9:00 pm. ¡No olviden ponerle tarjeta al regalo!"
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-pine-500/30 text-pine-900 font-medium focus:outline-none focus:ring-2 focus:ring-crimson-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="sorteo-fecha"
                className="block text-xs font-bold uppercase tracking-wider text-pine-800 mb-1.5"
              >
                Fecha del intercambio *
              </label>
              <div className="relative">
                <Calendar className="w-5 h-5 text-pine-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="sorteo-fecha"
                  type="date"
                  required
                  value={fechaEvento}
                  onChange={(e) => setFechaEvento(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white border border-pine-500/30 text-pine-900 font-medium focus:outline-none focus:ring-2 focus:ring-crimson-600"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="sorteo-presupuesto"
                className="block text-xs font-bold uppercase tracking-wider text-pine-800 mb-1.5"
              >
                Presupuesto sugerido (S/ soles, opcional)
              </label>
              <div className="relative">
                <Coins className="w-5 h-5 text-gold-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="sorteo-presupuesto"
                  type="number"
                  min="0"
                  step="0.50"
                  value={presupuesto}
                  onChange={(e) => setPresupuesto(e.target.value)}
                  placeholder="Ej. 50.00"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white border border-pine-500/30 text-pine-900 font-medium focus:outline-none focus:ring-2 focus:ring-crimson-600"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={cargandoSorteo}
            className="w-full py-4 rounded-2xl font-display font-bold text-lg bg-gradient-to-r from-crimson-600 to-crimson-500 hover:from-crimson-500 hover:to-crimson-600 text-cream-50 shadow-xl shadow-crimson-600/30 border border-gold-400/50 flex items-center justify-center gap-2 transition-all disabled:opacity-60"
          >
            <Gift className="w-5 h-5 text-gold-300" />
            <span>{cargandoSorteo ? 'Generando código único...' : 'Crear sorteo'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

