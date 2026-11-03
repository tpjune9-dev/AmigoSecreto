import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useParams, Link } from 'react-router-dom';
import {
  Search,
  User,
  Phone,
  KeyRound,
  CheckCircle2,
  Calendar,
  Coins,
  Share2,
  Sparkles,
  Eye,
  ShieldCheck,
} from 'lucide-react';
import {
  validarCodigoSorteo,
  registrarParticipante,
  SorteoResumen,
  construirEnlaceInvitacion,
  generarUrlWhatsAppCompartirInvitacion,
} from '../services/api';
import { useToast } from '../context/ToastContext';
import { StatusBadge } from '../components/StatusBadge';
import { GiftIllustration } from '../components/ChristmasDecorations';

export const JoinDrawPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const params = useParams<{ codigo?: string }>();
  const { showToast } = useToast();

  const codigoInicial = (params.codigo || searchParams.get('codigo') || '').trim().toUpperCase();

  const [codigoInput, setCodigoInput] = useState(codigoInicial);
  const [sorteo, setSorteo] = useState<SorteoResumen | null>(null);
  const [buscandoSorteo, setBuscandoSorteo] = useState(false);

  // Campos del participante
  const [nombre, setNombre] = useState('');
  const [prefijoPais, setPrefijoPais] = useState('+51');
  const [numeroCelular, setNumeroCelular] = useState('');
  const [pin, setPin] = useState('');
  const [confirmacionPin, setConfirmacionPin] = useState('');
  const [consentimiento, setConsentimiento] = useState(false);
  const [registrando, setRegistrando] = useState(false);

  // Estado posterior al registro exitoso
  const [registroExitoso, setRegistroExitoso] = useState(false);

  const cargarSorteoPorCodigo = useCallback(
    async (codigoABuscar: string) => {
      const limpio = codigoABuscar.trim().toUpperCase();
      if (!limpio) return;

      setBuscandoSorteo(true);
      try {
        const res = await validarCodigoSorteo(limpio);
        setSorteo(res.sorteo);
        setRegistroExitoso(false);
      } catch (err: any) {
        setSorteo(null);
        showToast(err.message || 'El código del sorteo no existe.', 'error');
      } finally {
        setBuscandoSorteo(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    if (codigoInicial) {
      setCodigoInput(codigoInicial);
      cargarSorteoPorCodigo(codigoInicial);
    }
  }, [codigoInicial, cargarSorteoPorCodigo]);

  const handleBuscarCodigo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigoInput.trim()) {
      showToast('Ingresa el código del sorteo para continuar.', 'info');
      return;
    }
    cargarSorteoPorCodigo(codigoInput);
  };

  const handleRegistroSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sorteo) return;

    if (!/^\d{6}$/.test(pin)) {
      showToast('Tu PIN personal debe contener exactamente 6 dígitos numéricos.', 'error');
      return;
    }

    if (pin !== confirmacionPin) {
      showToast('El PIN y la confirmación del PIN no coinciden.', 'error');
      return;
    }

    if (!consentimiento) {
      showToast('Debes aceptar el consentimiento para el tratamiento de tus datos.', 'error');
      return;
    }

    const soloDigitos = numeroCelular.replace(/\D/g, '');
    const telefonoCompleto = numeroCelular.trim().startsWith('+')
      ? numeroCelular.trim()
      : `${prefijoPais}${soloDigitos}`;

    setRegistrando(true);
    try {
      await registrarParticipante(sorteo.codigo_unico, {
        nombre: nombre.trim(),
        telefono: telefonoCompleto,
        pin,
        confirmacion_pin: confirmacionPin,
        consentimiento,
      });

      setRegistroExitoso(true);
      showToast('¡Te registraste correctamente! 🎉', 'success');
    } catch (err: any) {
      showToast(err.message || 'No se pudo completar tu registro.', 'error');
    } finally {
      setRegistrando(false);
    }
  };

  const formatearFecha = (fechaIso: string) => {
    const fecha = new Date(fechaIso);
    return fecha.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });
  };

  // Pantalla de éxito después de registrarse
  if (registroExitoso && sorteo) {
    const enlaceInvitacion = construirEnlaceInvitacion(sorteo.codigo_unico);
    const urlWhatsApp = generarUrlWhatsAppCompartirInvitacion(
      sorteo.nombre,
      sorteo.codigo_unico,
      enlaceInvitacion
    );

    return (
      <div className="max-w-lg mx-auto py-10 px-4 sm:px-6 animate-reveal">
        <div className="card-cream rounded-3xl p-6 sm:p-8 border-2 border-gold-400 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4 shadow-md">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-pine-900 mb-3">
            ¡Te registraste correctamente! 🎉
          </h1>

          <p className="text-pine-800 text-sm sm:text-base leading-relaxed mb-6">
            Ya formas parte del sorteo <strong>"{sorteo.nombre}"</strong>. Recibirás tu asignación y
            podrás descubrir a tu Amigo Secreto ingresando con tu número de WhatsApp y tu PIN
            personal de 6 dígitos cuando el administrador realice el sorteo.
          </p>

          <div className="bg-pine-900 text-cream-50 rounded-2xl p-4 mb-6 text-left border border-gold-400/50">
            <div className="flex items-center gap-2 text-gold-300 text-xs font-bold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Recuerda guardar tus datos de acceso</span>
            </div>
            <p className="text-xs sm:text-sm text-cream-200">
              Código del sorteo:{' '}
              <strong className="text-gold-400 font-display">{sorteo.codigo_unico}</strong>
              <br />
              Participante: <strong>{nombre}</strong>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={urlWhatsApp}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-1/2 py-3.5 px-4 rounded-2xl font-display font-bold text-sm bg-[#25D366] hover:bg-[#1ebe57] text-pine-950 shadow-md flex items-center justify-center gap-2 transition-all"
            >
              <Share2 className="w-4 h-4" />
              <span>Invitar por WhatsApp</span>
            </a>

            <Link
              to={`/resultado?codigo=${encodeURIComponent(sorteo.codigo_unico)}`}
              className="w-full sm:w-1/2 py-3.5 px-4 rounded-2xl font-display font-bold text-sm bg-pine-800 hover:bg-pine-700 text-gold-300 shadow-md flex items-center justify-center gap-2 transition-all"
            >
              <Eye className="w-4 h-4" />
              <span>Ir a resultados</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-8 sm:py-12 px-4 sm:px-6">
      <div className="text-center mb-6">
        <div className="flex justify-center mb-2">
          <GiftIllustration className="w-16 h-16" />
        </div>
        <h1 className="font-display font-extrabold text-2xl sm:text-4xl text-cream-50 mb-2">
          Unirme a un sorteo
        </h1>
        <p className="text-sm sm:text-base text-cream-200/85">
          Ingresa el código compartido por el organizador para registrarte desde tu celular.
        </p>
      </div>

      {/* Buscador de código del sorteo */}
      <form
        onSubmit={handleBuscarCodigo}
        className="card-pine rounded-2xl p-4 sm:p-5 mb-6 flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-gold-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={codigoInput}
            onChange={(e) => setCodigoInput(e.target.value.toUpperCase())}
            placeholder="Código del sorteo (ej. AMIGO482)"
            maxLength={20}
            aria-label="Código del sorteo"
            className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-pine-950/80 border border-gold-400/40 text-cream-50 font-display font-bold tracking-wider uppercase placeholder:normal-case placeholder:font-sans placeholder:font-normal placeholder:text-cream-300/50 focus:outline-none focus:ring-2 focus:ring-gold-400"
          />
        </div>
        <button
          type="submit"
          disabled={buscandoSorteo}
          className="px-6 py-3.5 rounded-xl font-display font-bold text-sm sm:text-base bg-gold-500 hover:bg-gold-400 text-pine-950 shadow-lg transition-all disabled:opacity-60 shrink-0"
        >
          {buscandoSorteo ? 'Buscando...' : 'Validar código'}
        </button>
      </form>

      {/* Si el sorteo fue encontrado, mostrar información del sorteo y formulario de registro */}
      {sorteo && (
        <div className="card-cream rounded-3xl p-6 sm:p-8 border-2 border-gold-400/60 animate-reveal">
          {/* Cabecera con el nombre del sorteo */}
          <div className="pb-5 mb-6 border-b border-pine-800/15">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <span className="px-3 py-1 rounded-lg bg-pine-900 text-gold-400 font-display font-bold text-xs tracking-wider">
                CÓDIGO: {sorteo.codigo_unico}
              </span>
              <StatusBadge estado={sorteo.estado} />
            </div>

            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-pine-900 mb-2">
              {sorteo.nombre}
            </h2>

            {sorteo.descripcion && (
              <p className="text-sm text-pine-700 leading-relaxed mb-3">{sorteo.descripcion}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm font-semibold text-pine-800 mt-3">
              <span className="inline-flex items-center gap-1.5 bg-cream-200 px-3 py-1.5 rounded-xl">
                <Calendar className="w-4 h-4 text-crimson-600" />
                Intercambio: {formatearFecha(sorteo.fecha_evento)}
              </span>
              {sorteo.presupuesto !== null && (
                <span className="inline-flex items-center gap-1.5 bg-cream-200 px-3 py-1.5 rounded-xl">
                  <Coins className="w-4 h-4 text-gold-600" />
                  Presupuesto sugerido: S/ {Number(sorteo.presupuesto).toFixed(2)}
                </span>
              )}
            </div>
          </div>

          {sorteo.estado !== 'INSCRIPCIONES_ABIERTAS' ? (
            <div className="text-center py-6">
              <p className="text-pine-900 font-bold text-lg mb-2">
                {sorteo.estado === 'SORTEO_REALIZADO'
                  ? '¡Este sorteo ya fue realizado!'
                  : 'Las inscripciones para este sorteo están cerradas.'}
              </p>
              <p className="text-sm text-pine-700 mb-6">
                {sorteo.estado === 'SORTEO_REALIZADO'
                  ? 'Si ya te registraste previamente, puedes consultar ahora mismo quién es tu Amigo Secreto.'
                  : 'El organizador ha cerrado el registro de nuevos participantes para proceder con el sorteo.'}
              </p>
              <Link
                to={`/resultado?codigo=${encodeURIComponent(sorteo.codigo_unico)}`}
                className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl font-display font-bold text-base bg-crimson-600 hover:bg-crimson-700 text-cream-50 shadow-lg transition-all"
              >
                <Sparkles className="w-5 h-5 text-gold-300" />
                <span>Consultar mi Amigo Secreto</span>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleRegistroSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="part-nombre"
                  className="block text-xs font-bold uppercase tracking-wider text-pine-800 mb-1.5"
                >
                  Nombre completo *
                </label>
                <div className="relative">
                  <User className="w-5 h-5 text-pine-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="part-nombre"
                    type="text"
                    required
                    minLength={2}
                    maxLength={120}
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. María Fernanda Gómez"
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white border border-pine-500/30 text-pine-900 font-medium focus:outline-none focus:ring-2 focus:ring-crimson-600"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="part-telefono"
                  className="block text-xs font-bold uppercase tracking-wider text-pine-800 mb-1.5"
                >
                  Número de WhatsApp *
                </label>
                <div className="flex gap-2">
                  <div className="w-24 shrink-0">
                    <input
                      type="text"
                      value={prefijoPais}
                      onChange={(e) => setPrefijoPais(e.target.value)}
                      aria-label="Prefijo de país"
                      className="w-full px-3 py-3.5 rounded-xl bg-cream-200 border border-pine-500/30 text-pine-900 font-bold text-center focus:outline-none focus:ring-2 focus:ring-crimson-600"
                    />
                  </div>
                  <div className="relative flex-1">
                    <Phone className="w-5 h-5 text-pine-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="part-telefono"
                      type="tel"
                      required
                      value={numeroCelular}
                      onChange={(e) => setNumeroCelular(e.target.value)}
                      placeholder="987 654 321"
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white border border-pine-500/30 text-pine-900 font-medium focus:outline-none focus:ring-2 focus:ring-crimson-600"
                    />
                  </div>
                </div>
                <p className="text-xs text-pine-700 mt-1">
                  Se utiliza para identificar tu registro único y enviarte el enlace a tu resultado.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="part-pin"
                    className="block text-xs font-bold uppercase tracking-wider text-pine-800 mb-1.5"
                  >
                    PIN personal (6 dígitos) *
                  </label>
                  <div className="relative">
                    <KeyRound className="w-5 h-5 text-crimson-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="part-pin"
                      type="password"
                      inputMode="numeric"
                      pattern="\d{6}"
                      maxLength={6}
                      required
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="••••••"
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white border border-pine-500/30 text-pine-900 font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-crimson-600"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="part-pin-confirm"
                    className="block text-xs font-bold uppercase tracking-wider text-pine-800 mb-1.5"
                  >
                    Confirmar PIN (6 dígitos) *
                  </label>
                  <div className="relative">
                    <KeyRound className="w-5 h-5 text-pine-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="part-pin-confirm"
                      type="password"
                      inputMode="numeric"
                      pattern="\d{6}"
                      maxLength={6}
                      required
                      value={confirmacionPin}
                      onChange={(e) =>
                        setConfirmacionPin(e.target.value.replace(/\D/g, '').slice(0, 6))
                      }
                      placeholder="••••••"
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white border border-pine-500/30 text-pine-900 font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-crimson-600"
                    />
                  </div>
                </div>
              </div>
              <p className="text-xs text-pine-700 -mt-2">
                🔒 Tu PIN se guarda encriptado y protege tu resultado para que nadie más pueda
                consultarlo.
              </p>

              {/* Consentimiento */}
              <div className="bg-cream-200/90 p-4 rounded-2xl border border-pine-600/20">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={consentimiento}
                    onChange={(e) => setConsentimiento(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-pine-600 text-crimson-600 focus:ring-crimson-600"
                  />
                  <span className="text-xs sm:text-sm text-pine-900 leading-snug">
                    Acepto el tratamiento de mis datos de registro (nombre y número de WhatsApp)
                    exclusivamente para la organización y comunicación del resultado de este sorteo
                    de Amigo Secreto.
                  </span>
                </label>
              </div>

              {/* Botón principal obligatorio */}
              <button
                type="submit"
                disabled={registrando}
                className="w-full py-4 rounded-2xl font-display font-bold text-lg bg-gradient-to-r from-crimson-600 to-crimson-500 hover:from-crimson-500 hover:to-crimson-600 text-cream-50 shadow-xl shadow-crimson-600/30 border border-gold-400/50 flex items-center justify-center gap-2 transition-all disabled:opacity-60"
              >
                <span>{registrando ? 'Registrando...' : '🎁 Participar en el sorteo'}</span>
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

