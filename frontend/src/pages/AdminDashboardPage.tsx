import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  PlusCircle,
  Copy,
  Share2,
  Lock,
  Unlock,
  Sparkles,
  RefreshCw,
  Trash2,
  Calendar,
  Coins,
  Users,
  Phone,
  Clock,
  Check,
  MessageCircle,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  SorteoResumen,
  ParticipanteAdmin,
  RespuestaNotificacionWhatsApp,
  listarMisSorteos,
  obtenerDetalleSorteo,
  cerrarInscripcionesSorteo,
  reabrirInscripcionesSorteo,
  retirarParticipanteSorteo,
  ejecutarSorteo,
  reiniciarSorteoAdmin,
  prepararNotificacionesWhatsApp,
  construirEnlaceInvitacion,
  construirEnlaceResultado,
  generarUrlWhatsAppCompartirInvitacion,
  generarUrlWhatsAppParticipanteDirecto,
  obtenerBaseUrlFrontend,
} from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmModal } from '../components/ConfirmModal';

export const AdminDashboardPage: React.FC = () => {
  const { admin, token } = useAuth();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [sorteos, setSorteos] = useState<SorteoResumen[]>([]);
  const [sorteoActual, setSorteoActual] = useState<SorteoResumen | null>(null);
  const [cargandoLista, setCargandoLista] = useState(true);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [copiadoCodigo, setCopiadoCodigo] = useState(false);

  // Estados de modales de confirmación
  const [participanteAEliminar, setParticipanteAEliminar] = useState<ParticipanteAdmin | null>(null);
  const [modalCerrarAbierto, setModalCerrarAbierto] = useState(false);
  const [modalSorteoAbierto, setModalSorteoAbierto] = useState(false);
  const [modalReiniciarAbierto, setModalReiniciarAbierto] = useState(false);
  const [procesandoAccion, setProcesandoAccion] = useState(false);

  // Estado de integración WhatsApp Business API / wa.me
  const [infoWhatsApp, setInfoWhatsApp] = useState<RespuestaNotificacionWhatsApp | null>(null);
  const [cargandoWhatsApp, setCargandoWhatsApp] = useState(false);

  const cargarDetalle = useCallback(
    async (id: number, mostrarNotificacion = false) => {
      if (!token) return;
      setCargandoDetalle(true);
      try {
        const res = await obtenerDetalleSorteo(token, id);
        setSorteoActual(res.sorteo);
        setSorteos((prev) =>
          prev.map((s) =>
            s.id === res.sorteo.id
              ? {
                  ...s,
                  estado: res.sorteo.estado,
                  total_participantes: res.sorteo.total_participantes,
                }
              : s
          )
        );
        if (mostrarNotificacion) {
          const etiquetaEstado =
            res.sorteo.estado === 'INSCRIPCIONES_ABIERTAS'
              ? 'Inscripciones abiertas'
              : res.sorteo.estado === 'INSCRIPCIONES_CERRADAS'
              ? 'Inscripciones cerradas'
              : 'Sorteo realizado';
          showToast(
            `Estado actualizado: ${etiquetaEstado} (${res.sorteo.total_participantes} participantes).`,
            'info'
          );
        }
      } catch (err: any) {
        showToast(err.message || 'No se pudo cargar el detalle del sorteo.', 'error');
      } finally {
        setCargandoDetalle(false);
      }
    },
    [token, showToast]
  );

  const cargarSorteos = useCallback(async () => {
    if (!token) return;
    setCargandoLista(true);
    try {
      const res = await listarMisSorteos(token);
      setSorteos(res.sorteos);

      const paramId = Number(searchParams.get('sorteoId'));
      const seleccionado =
        res.sorteos.find((s) => s.id === paramId) || res.sorteos[0] || null;

      if (seleccionado) {
        await cargarDetalle(seleccionado.id);
      } else {
        setSorteoActual(null);
      }
    } catch (err: any) {
      showToast(err.message || 'Error al cargar tus sorteos.', 'error');
    } finally {
      setCargandoLista(false);
    }
  }, [token, searchParams, cargarDetalle, showToast]);

  useEffect(() => {
    cargarSorteos();
  }, [cargarSorteos]);

  if (!admin || !token) {
    return (
      <div className="max-w-lg mx-auto py-14 px-4 text-center">
        <div className="card-cream rounded-3xl p-8">
          <h1 className="font-display font-bold text-2xl text-pine-900 mb-3">
            Inicia sesión como administrador
          </h1>
          <p className="text-sm text-pine-700 mb-6">
            Necesitas autenticarte con tu cuenta de organizador para acceder al panel de sorteos.
          </p>
          <Link
            to="/crear-sorteo"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-crimson-600 text-cream-50 font-display font-bold"
          >
            Ir a iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  const seleccionarSorteo = (id: number) => {
    setInfoWhatsApp(null);
    setSearchParams({ sorteoId: String(id) });
    cargarDetalle(id);
  };

  const handleCopiarCodigo = async () => {
    if (!sorteoActual) return;
    try {
      await navigator.clipboard.writeText(sorteoActual.codigo_unico);
      setCopiadoCodigo(true);
      setTimeout(() => setCopiadoCodigo(false), 2500);
      showToast(`Código ${sorteoActual.codigo_unico} copiado al portapapeles.`, 'success');
    } catch {
      showToast('No se pudo copiar automáticamente.', 'info');
    }
  };

  const handleCompartirInvitacion = async () => {
    if (!sorteoActual) return;
    const enlace = construirEnlaceInvitacion(sorteoActual.codigo_unico);
    const urlWhatsApp = generarUrlWhatsAppCompartirInvitacion(
      sorteoActual.nombre,
      sorteoActual.codigo_unico,
      enlace
    );
    window.open(urlWhatsApp, '_blank', 'noopener,noreferrer');
  };

  const handleCerrarInscripciones = async () => {
    if (!sorteoActual || !token) return;
    setProcesandoAccion(true);
    try {
      const res = await cerrarInscripcionesSorteo(token, sorteoActual.id);
      showToast(res.mensaje, 'success');
      setModalCerrarAbierto(false);
      await cargarDetalle(sorteoActual.id);
    } catch (err: any) {
      showToast(err.message || 'No se pudieron cerrar las inscripciones.', 'error');
    } finally {
      setProcesandoAccion(false);
    }
  };

  const handleReabrirInscripciones = async () => {
    if (!sorteoActual || !token) return;
    setProcesandoAccion(true);
    try {
      const res = await reabrirInscripcionesSorteo(token, sorteoActual.id);
      showToast(res.mensaje, 'success');
      await cargarDetalle(sorteoActual.id);
    } catch (err: any) {
      showToast(err.message || 'No se pudieron reabrir las inscripciones.', 'error');
    } finally {
      setProcesandoAccion(false);
    }
  };

  const handleIniciarSorteoClick = () => {
    if (!sorteoActual) return;
    if (sorteoActual.estado === 'SORTEO_REALIZADO') {
      showToast('Este sorteo ya fue realizado anteriormente.', 'info');
      return;
    }
    if (sorteoActual.total_participantes < 2) {
      showToast(
        'Se necesitan al menos 2 participantes registrados para poder realizar el sorteo.',
        'error'
      );
      return;
    }
    if (sorteoActual.estado !== 'INSCRIPCIONES_CERRADAS') {
      showToast(
        'Primero debes cerrar las inscripciones antes de realizar el sorteo.',
        'error'
      );
      return;
    }
    setModalSorteoAbierto(true);
  };

  const handleConfirmarEjecutarSorteo = async () => {
    if (!sorteoActual || !token) return;
    setProcesandoAccion(true);
    try {
      const res = await ejecutarSorteo(token, sorteoActual.id);
      showToast(res.mensaje, 'success');
      setModalSorteoAbierto(false);
      await cargarDetalle(sorteoActual.id);
    } catch (err: any) {
      showToast(err.message || 'Error al realizar el sorteo.', 'error');
    } finally {
      setProcesandoAccion(false);
    }
  };

  const handleConfirmarRetirarParticipante = async () => {
    if (!sorteoActual || !participanteAEliminar || !token) return;
    setProcesandoAccion(true);
    try {
      const res = await retirarParticipanteSorteo(
        token,
        sorteoActual.id,
        participanteAEliminar.id
      );
      showToast(res.mensaje, 'success');
      setParticipanteAEliminar(null);
      await cargarDetalle(sorteoActual.id);
    } catch (err: any) {
      showToast(err.message || 'Error al retirar participante.', 'error');
    } finally {
      setProcesandoAccion(false);
    }
  };

  const handleConfirmarReinicioAdmin = async () => {
    if (!sorteoActual || !token) return;
    setProcesandoAccion(true);
    try {
      const res = await reiniciarSorteoAdmin(token, sorteoActual.id);
      showToast(res.mensaje, 'info');
      setModalReiniciarAbierto(false);
      setInfoWhatsApp(null);
      await cargarDetalle(sorteoActual.id);
    } catch (err: any) {
      showToast(err.message || 'Error al reiniciar el sorteo.', 'error');
    } finally {
      setProcesandoAccion(false);
    }
  };

  const handleNotificarWhatsAppBackend = async () => {
    if (!sorteoActual || !token) return;
    setCargandoWhatsApp(true);
    try {
      const res = await prepararNotificacionesWhatsApp(
        token,
        sorteoActual.id,
        obtenerBaseUrlFrontend()
      );
      setInfoWhatsApp(res);
      showToast(res.mensajeEstado, res.configurado ? 'success' : 'info');
    } catch (err: any) {
      showToast(err.message || 'Error al procesar notificaciones de WhatsApp.', 'error');
    } finally {
      setCargandoWhatsApp(false);
    }
  };

  const formatearFecha = (fechaIso: string) => {
    return new Date(fechaIso).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });
  };

  const formatearFechaHora = (fechaIso: string) => {
    return new Date(fechaIso).toLocaleString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      {/* Cabecera del Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-4xl text-cream-50">
            Panel del Administrador
          </h1>
          <p className="text-sm text-cream-200/80">
            Gestiona tus sorteos de Amigo Secreto, inscripciones y participantes en tiempo real.
          </p>
        </div>

        <Link
          to="/crear-sorteo"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-display font-bold text-sm sm:text-base bg-crimson-600 hover:bg-crimson-500 text-cream-50 shadow-lg border border-gold-400/40 transition-all"
        >
          <PlusCircle className="w-5 h-5 text-gold-300" />
          <span>Crear nuevo sorteo</span>
        </Link>
      </div>

      {cargandoLista ? (
        <div className="card-pine rounded-3xl p-12 text-center">
          <RefreshCw className="w-8 h-8 text-gold-400 animate-spin mx-auto mb-3" />
          <p className="text-cream-100 font-medium">Cargando tus sorteos desde MySQL...</p>
        </div>
      ) : sorteos.length === 0 ? (
        <div className="card-cream rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto">
          <h2 className="font-display font-bold text-2xl text-pine-900 mb-2">
            Aún no has creado ningún sorteo
          </h2>
          <p className="text-sm text-pine-700 mb-6">
            Crea tu primer sorteo de Amigo Secreto para obtener un código de invitación y
            compartirlo por WhatsApp.
          </p>
          <Link
            to="/crear-sorteo"
            className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl bg-crimson-600 hover:bg-crimson-700 text-cream-50 font-display font-bold shadow-lg"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Crear mi primer sorteo</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Columna izquierda: Selector de sorteos del administrador */}
          <aside className="lg:col-span-4 space-y-3">
            <h2 className="font-display font-bold text-sm uppercase tracking-wider text-gold-300 px-1">
              Mis Sorteos ({sorteos.length})
            </h2>
            <div className="space-y-2.5 max-h-[32rem] overflow-y-auto pr-1">
              {sorteos.map((item) => {
                const activo = sorteoActual?.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => seleccionarSorteo(item.id)}
                    className={`w-full text-left p-4 rounded-2xl transition-all border ${
                      activo
                        ? 'bg-cream-100 text-pine-950 border-gold-400 shadow-xl'
                        : 'card-pine text-cream-100 hover:bg-pine-800/90 border-gold-500/20'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span
                        className={`text-xs font-display font-extrabold px-2.5 py-0.5 rounded-md ${
                          activo
                            ? 'bg-pine-900 text-gold-400'
                            : 'bg-pine-950/80 text-gold-300'
                        }`}
                      >
                        {item.codigo_unico}
                      </span>
                      <span
                        className={`text-xs font-semibold flex items-center gap-1 ${
                          activo ? 'text-pine-800' : 'text-cream-200'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        {item.total_participantes}
                      </span>
                    </div>
                    <h3 className="font-display font-bold text-base truncate mb-2">
                      {item.nombre}
                    </h3>
                    <StatusBadge estado={item.estado} />
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Columna derecha: Detalle completo del sorteo seleccionado */}
          <div className="lg:col-span-8 space-y-6">
            {sorteoActual && (
              <>
                {/* Tarjeta Principal de Información y Acciones del Sorteo */}
                <div className="card-pine rounded-3xl p-6 sm:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-gold-500/20">
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5 mb-2">
                        <span className="px-3.5 py-1 rounded-xl bg-gold-500 text-pine-950 font-display font-extrabold text-sm tracking-wider">
                          CÓDIGO: {sorteoActual.codigo_unico}
                        </span>
                        <StatusBadge estado={sorteoActual.estado} />
                      </div>
                      <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-cream-50">
                        {sorteoActual.nombre}
                      </h2>
                      {sorteoActual.descripcion && (
                        <p className="text-sm text-cream-200/85 mt-1.5">
                          {sorteoActual.descripcion}
                        </p>
                      )}
                    </div>

                    {/* Contador de participantes destacado */}
                    <div className="bg-pine-950/90 border border-gold-400/40 rounded-2xl px-5 py-3 text-center shrink-0">
                      <span className="block font-display font-extrabold text-2xl sm:text-3xl text-gold-400">
                        {sorteoActual.total_participantes}
                      </span>
                      <span className="text-xs font-semibold text-cream-200">
                        Participantes
                      </span>
                    </div>
                  </div>

                  {/* Metadatos del evento */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-4 text-sm text-cream-100">
                    <div className="flex items-center gap-2.5 bg-pine-950/50 p-3 rounded-xl border border-gold-500/15">
                      <Calendar className="w-5 h-5 text-gold-400 shrink-0" />
                      <span>
                        Fecha del intercambio:{' '}
                        <strong className="text-cream-50">
                          {formatearFecha(sorteoActual.fecha_evento)}
                        </strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5 bg-pine-950/50 p-3 rounded-xl border border-gold-500/15">
                      <Coins className="w-5 h-5 text-gold-400 shrink-0" />
                      <span>
                        Presupuesto sugerido:{' '}
                        <strong className="text-cream-50">
                          {sorteoActual.presupuesto !== null
                            ? `S/ ${Number(sorteoActual.presupuesto).toFixed(2)}`
                            : 'Libre / No especificado'}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* Botones de Acción Obligatorios del Panel */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-4 border-t border-gold-500/20">
                    {/* 1. Copiar código */}
                    <button
                      type="button"
                      onClick={handleCopiarCodigo}
                      className="py-3 px-4 rounded-xl bg-pine-800 hover:bg-pine-700 text-cream-50 font-semibold text-sm border border-gold-400/30 flex items-center justify-center gap-2 transition-all"
                    >
                      {copiadoCodigo ? (
                        <Check className="w-4 h-4 text-gold-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-gold-400" />
                      )}
                      <span>{copiadoCodigo ? '¡Código copiado!' : 'Copiar código'}</span>
                    </button>

                    {/* 2. Compartir invitación */}
                    <button
                      type="button"
                      onClick={handleCompartirInvitacion}
                      className="py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#1ebe57] text-pine-950 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Compartir invitación</span>
                    </button>

                    {/* 3. Consultar estado del sorteo */}
                    <button
                      type="button"
                      disabled={cargandoDetalle}
                      onClick={() => cargarDetalle(sorteoActual.id, true)}
                      className="py-3 px-4 rounded-xl bg-pine-800 hover:bg-pine-700 text-cream-50 font-semibold text-sm border border-gold-400/30 flex items-center justify-center gap-2 transition-all"
                    >
                      <RefreshCw
                        className={`w-4 h-4 text-gold-400 ${
                          cargandoDetalle ? 'animate-spin' : ''
                        }`}
                      />
                      <span>Consultar estado del sorteo</span>
                    </button>

                    {/* 4. Cerrar / Reabrir inscripciones */}
                    {sorteoActual.estado === 'INSCRIPCIONES_ABIERTAS' && (
                      <button
                        type="button"
                        onClick={() => setModalCerrarAbierto(true)}
                        className="py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-pine-950 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md"
                      >
                        <Lock className="w-4 h-4" />
                        <span>Cerrar inscripciones</span>
                      </button>
                    )}

                    {sorteoActual.estado === 'INSCRIPCIONES_CERRADAS' && (
                      <button
                        type="button"
                        onClick={handleReabrirInscripciones}
                        disabled={procesandoAccion}
                        className="py-3.5 px-4 rounded-xl bg-pine-700 hover:bg-pine-600 text-gold-300 border border-gold-400/30 font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                      >
                        <Unlock className="w-4 h-4" />
                        <span>Reabrir inscripciones</span>
                      </button>
                    )}

                    {/* 5. Realizar sorteo */}
                    {sorteoActual.estado !== 'SORTEO_REALIZADO' && (
                      <button
                        type="button"
                        onClick={handleIniciarSorteoClick}
                        className="sm:col-span-2 py-3.5 px-5 rounded-xl bg-gradient-to-r from-crimson-600 to-crimson-500 hover:from-crimson-500 hover:to-crimson-600 text-cream-50 font-display font-bold text-base border border-gold-400/50 shadow-lg flex items-center justify-center gap-2 transition-all"
                      >
                        <Sparkles className="w-5 h-5 text-gold-300" />
                        <span>Realizar sorteo</span>
                      </button>
                    )}
                  </div>

                  {/* Sección de comunicación por WhatsApp una vez realizado el sorteo */}
                  {sorteoActual.estado === 'SORTEO_REALIZADO' && (
                    <div className="mt-6 pt-5 border-t border-gold-500/25 space-y-4">
                      <div className="bg-pine-950/85 border border-gold-400/40 rounded-2xl p-4 sm:p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <h3 className="font-display font-bold text-base sm:text-lg text-gold-300 flex items-center gap-2">
                              <MessageCircle className="w-5 h-5 text-[#25D366]" />
                              <span>Comunicar resultados por WhatsApp</span>
                            </h3>
                            <p className="text-xs sm:text-sm text-cream-200/85 mt-1">
                              Envía a cada participante su enlace privado por WhatsApp (mediante{' '}
                              <code className="text-gold-300">wa.me</code> en la lista inferior) o
                              verifica el envío con WhatsApp Business Cloud API desde el servidor.
                            </p>
                          </div>

                          <button
                            type="button"
                            disabled={cargandoWhatsApp}
                            onClick={handleNotificarWhatsAppBackend}
                            className="shrink-0 px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1ebe57] text-pine-950 font-bold text-xs sm:text-sm transition-all"
                          >
                            {cargandoWhatsApp
                              ? 'Consultando servidor...'
                              : 'Preparar / Enviar con API Backend'}
                          </button>
                        </div>

                        {infoWhatsApp && (
                          <div className="mt-3 p-3.5 rounded-xl bg-pine-900 border border-gold-400/30 text-xs sm:text-sm text-cream-100">
                            <p className="font-semibold text-gold-300 mb-1">
                              Modalidad activa:{' '}
                              {infoWhatsApp.configurado
                                ? 'API Oficial de WhatsApp Business Cloud'
                                : 'Enlaces directos wa.me (confirmación manual)'}
                            </p>
                            <p>{infoWhatsApp.mensajeEstado}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 text-xs text-cream-200/75 px-1">
                        <span className="flex items-center gap-1.5">
                          <ShieldAlert className="w-4 h-4 text-gold-400 shrink-0" />
                          Por privacidad, las asignaciones secretas están encriptadas y no son
                          visibles para el administrador.
                        </span>
                        <button
                          type="button"
                          onClick={() => setModalReiniciarAbierto(true)}
                          className="shrink-0 inline-flex items-center gap-1 text-red-300 hover:text-red-200 underline font-semibold"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Reinicio administrativo
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tarjeta / Tabla de Participantes Registrados */}
                <div className="card-cream rounded-3xl p-6 sm:p-8 border-2 border-gold-400/50">
                  <div className="flex items-center justify-between gap-2 mb-5">
                    <div>
                      <h3 className="font-display font-bold text-xl text-pine-900">
                        Participantes Registrados ({sorteoActual.participantes?.length || 0})
                      </h3>
                      <p className="text-xs sm:text-sm text-pine-700">
                        Los números de teléfono son visibles únicamente para ti como administrador.
                      </p>
                    </div>
                  </div>

                  {!sorteoActual.participantes || sorteoActual.participantes.length === 0 ? (
                    <div className="text-center py-10 bg-cream-200/60 rounded-2xl border border-dashed border-pine-600/30">
                      <Users className="w-10 h-10 text-pine-600 mx-auto mb-2 opacity-75" />
                      <p className="font-display font-bold text-pine-900">
                        Aún no hay participantes inscritos
                      </p>
                      <p className="text-xs sm:text-sm text-pine-700 mt-1 max-w-md mx-auto">
                        Comparte el código <strong>{sorteoActual.codigo_unico}</strong> o el enlace
                        de invitación por WhatsApp para que tus amigos se anoten.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sorteoActual.participantes.map((p, index) => {
                        const enlaceRes = construirEnlaceResultado(sorteoActual.codigo_unico);
                        const waMeDirecto = generarUrlWhatsAppParticipanteDirecto(
                          p.telefono,
                          p.nombre,
                          sorteoActual.nombre,
                          sorteoActual.codigo_unico,
                          enlaceRes
                        );

                        return (
                          <div
                            key={p.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-pine-600/15 shadow-sm hover:border-gold-500/60 transition-all"
                          >
                            <div className="flex items-start sm:items-center gap-3.5">
                              <div className="w-9 h-9 rounded-xl bg-pine-800 text-gold-300 font-display font-bold text-sm flex items-center justify-center shrink-0">
                                {index + 1}
                              </div>
                              <div>
                                <h4 className="font-display font-bold text-base text-pine-900">
                                  {p.nombre}
                                </h4>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-pine-700 mt-0.5">
                                  <span className="inline-flex items-center gap-1 font-semibold text-pine-800">
                                    <Phone className="w-3.5 h-3.5 text-crimson-600" />
                                    {p.telefono}
                                  </span>
                                  <span className="inline-flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 text-pine-600" />
                                    {formatearFechaHora(p.created_at)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-2">
                              {sorteoActual.estado === 'SORTEO_REALIZADO' && (
                                <a
                                  href={waMeDirecto}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#1ebe57] text-pine-950 font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition-all"
                                  title={`Enviar enlace de resultado por WhatsApp a ${p.nombre}`}
                                >
                                  <MessageCircle className="w-4 h-4" />
                                  <span>Avisar por WhatsApp</span>
                                </a>
                              )}

                              {sorteoActual.estado !== 'SORTEO_REALIZADO' && (
                                <button
                                  type="button"
                                  onClick={() => setParticipanteAEliminar(p)}
                                  className="px-3 py-2 rounded-xl text-crimson-600 hover:bg-crimson-50 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors"
                                  title={`Retirar a ${p.nombre} del sorteo`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                  <span>Retirar</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal 1: Confirmar cierre de inscripciones */}
      <ConfirmModal
        abierto={modalCerrarAbierto}
        titulo="¿Cerrar las inscripciones?"
        descripcion="Al cerrar las inscripciones, ningún nuevo participante podrá registrarse con el código del sorteo. Esto es necesario antes de ejecutar el sorteo."
        textoConfirmar="Sí, cerrar inscripciones"
        cargando={procesandoAccion}
        onConfirmar={handleCerrarInscripciones}
        onCancelar={() => setModalCerrarAbierto(false)}
      />

      {/* Modal 2: Confirmar ejecución del sorteo */}
      <ConfirmModal
        abierto={modalSorteoAbierto}
        titulo="🎁 ¿Realizar el sorteo ahora?"
        descripcion={`Se asignará aleatoriamente un Amigo Secreto para cada uno de los ${
          sorteoActual?.total_participantes || 0
        } participantes registrados. Nadie se regalará a sí mismo y las asignaciones quedarán guardadas de forma segura en MySQL.`}
        textoConfirmar="¡Sí, realizar sorteo!"
        cargando={procesandoAccion}
        onConfirmar={handleConfirmarEjecutarSorteo}
        onCancelar={() => setModalSorteoAbierto(false)}
      />

      {/* Modal 3: Confirmar retiro de participante */}
      <ConfirmModal
        abierto={!!participanteAEliminar}
        titulo="¿Retirar participante?"
        descripcion={`¿Estás seguro de que deseas retirar a "${participanteAEliminar?.nombre}" (${participanteAEliminar?.telefono}) de este sorteo?`}
        textoConfirmar="Sí, retirar participante"
        variante="danger"
        cargando={procesandoAccion}
        onConfirmar={handleConfirmarRetirarParticipante}
        onCancelar={() => setParticipanteAEliminar(null)}
      />

      {/* Modal 4: Confirmar reinicio administrativo explícito */}
      <ConfirmModal
        abierto={modalReiniciarAbierto}
        titulo="⚠️ Reinicio Administrativo del Sorteo"
        descripcion="Esta acción eliminará todas las asignaciones secretas actuales de la base de datos y volverá a abrir las inscripciones para permitir modificar participantes y sortear de nuevo. ¿Confirmas el reinicio?"
        textoConfirmar="Confirmar reinicio total"
        variante="danger"
        cargando={procesandoAccion}
        onConfirmar={handleConfirmarReinicioAdmin}
        onCancelar={() => setModalReiniciarAbierto(false)}
      />
    </div>
  );
};

