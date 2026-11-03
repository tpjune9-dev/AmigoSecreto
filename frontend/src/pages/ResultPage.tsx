import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  KeyRound,
  User,
  Hash,
  Sparkles,
  Gift,
  Calendar,
  Coins,
  Share2,
  EyeOff,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import {
  consultarResultadoPrivado,
  recuperarMiAsignacionConToken,
  ResultadoPrivado,
  construirEnlaceResultado,
  generarUrlWhatsAppCompartirResultados,
} from '../services/api';
import { useToast } from '../context/ToastContext';
import { EnvelopeIllustration, GiftIllustration } from '../components/ChristmasDecorations';

const PARTICIPANT_TOKEN_KEY = 'amigo_secreto_participant_jwt';

export const ResultPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();

  const codigoUrl = (searchParams.get('codigo') || '').trim().toUpperCase();

  const [codigo, setCodigo] = useState(codigoUrl);
  const [nombre, setNombre] = useState('');
  const [pin, setPin] = useState('');
  const [consultando, setConsultando] = useState(false);

  const [resultado, setResultado] = useState<ResultadoPrivado | null>(null);
  const [revelado, setRevelado] = useState(false);

  // Recuperar asignación si el participante recarga la página con su token de sesión activo
  useEffect(() => {
    const tokenGuardado = sessionStorage.getItem(PARTICIPANT_TOKEN_KEY);
    if (!tokenGuardado) return;

    recuperarMiAsignacionConToken(tokenGuardado)
      .then((res) => {
        if (!codigoUrl || res.sorteo.codigo_unico === codigoUrl) {
          setResultado(res);
        }
      })
      .catch(() => {
        sessionStorage.removeItem(PARTICIPANT_TOKEN_KEY);
      });
  }, [codigoUrl]);

  useEffect(() => {
    if (codigoUrl) {
      setCodigo(codigoUrl);
    }
  }, [codigoUrl]);

  const lanzarConfetiNavideno = () => {
    const colores = ['#D42426', '#F5C542', '#1B5E3A', '#FFFDF9'];
    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.6 },
      colors: colores,
    });
    setTimeout(() => {
      confetti({
        particleCount: 60,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colores,
      });
      confetti({
        particleCount: 60,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colores,
      });
    }, 220);
  };

  const handleConsultarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!/^\d{6}$/.test(pin)) {
      showToast('Ingresa tu PIN personal de 6 dígitos.', 'error');
      return;
    }

    setConsultando(true);
    try {
      const res = await consultarResultadoPrivado({
        codigo: codigo.trim().toUpperCase(),
        nombre: nombre.trim(),
        pin,
      });

      if (res.token) {
        sessionStorage.setItem(PARTICIPANT_TOKEN_KEY, res.token);
      }

      setResultado(res);
      setRevelado(false);
      showToast(`¡Hola, ${res.participante.nombre}! Tu sobre secreto está listo.`, 'success');
    } catch (err: any) {
      showToast(err.message || 'No se pudo validar tu acceso.', 'error');
    } finally {
      setConsultando(false);
    }
  };

  const handleDescubrirAmigoSecreto = () => {
    setRevelado(true);
    lanzarConfetiNavideno();
  };

  const handleSalirConsulta = () => {
    sessionStorage.removeItem(PARTICIPANT_TOKEN_KEY);
    setResultado(null);
    setRevelado(false);
    setPin('');
  };

  const formatearFecha = (fechaIso: string) => {
    return new Date(fechaIso).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });
  };

  // Si el participante ya validó sus credenciales, mostrar la tarjeta especial de revelación
  if (resultado) {
    const enlaceSorteo = construirEnlaceResultado(resultado.sorteo.codigo_unico);
    const urlCompartirWhatsApp = generarUrlWhatsAppCompartirResultados(
      resultado.sorteo.nombre,
      resultado.sorteo.codigo_unico,
      enlaceSorteo
    );

    return (
      <div className="max-w-lg mx-auto py-10 px-4 sm:px-6 animate-reveal">
        <div className="card-cream rounded-3xl p-6 sm:p-9 border-2 border-gold-400 text-center relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-bold text-pine-700 mb-4 pb-3 border-b border-pine-800/15">
            <span className="px-2.5 py-1 rounded-lg bg-pine-900 text-gold-400 font-display">
              {resultado.sorteo.codigo_unico}
            </span>
            <span>Usuario: {resultado.participante.nombre}</span>
          </div>

          <h2 className="font-display font-bold text-lg text-pine-800 mb-1">
            {resultado.sorteo.nombre}
          </h2>

          {/* Título obligatorio de la tarjeta especial */}
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-crimson-600 mb-6">
            🎉 ¡Tu amigo secreto es...!
          </h1>

          {!revelado ? (
            <div className="py-6 px-4 rounded-3xl bg-pine-900 text-cream-50 border-2 border-gold-400 shadow-xl mb-6">
              <div className="flex justify-center mb-4 animate-float">
                <EnvelopeIllustration className="w-28 h-28" />
              </div>
              <p className="text-xs sm:text-sm text-cream-200 max-w-xs mx-auto mb-6">
                Asegúrate de que nadie esté mirando tu pantalla antes de abrir tu sobre navideño.
              </p>

              {/* Botón obligatorio para revelar con confeti */}
              <button
                type="button"
                onClick={handleDescubrirAmigoSecreto}
                className="w-full py-4 px-6 rounded-2xl font-display font-extrabold text-base sm:text-lg bg-gradient-to-r from-gold-400 to-gold-500 hover:from-gold-300 hover:to-gold-400 text-pine-950 shadow-xl transform hover:scale-[1.02] transition-all"
              >
                🎁 Descubrir mi amigo secreto
              </button>
            </div>
          ) : (
            <div className="py-7 px-5 rounded-3xl bg-gradient-to-b from-pine-900 to-pine-950 text-cream-50 border-2 border-gold-400 shadow-2xl mb-6 animate-reveal">
              <div className="flex justify-center mb-3">
                <GiftIllustration className="w-20 h-20" />
              </div>
              <span className="inline-flex items-center gap-1 text-xs uppercase tracking-widest text-gold-300 font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5" /> Te toca regalarle a:
              </span>
              <div className="font-display font-extrabold text-3xl sm:text-4xl text-gold-400 tracking-tight py-2 px-3 rounded-2xl bg-pine-800/80 border border-gold-400/40 my-2">
                {resultado.amigo_secreto.nombre}
              </div>
              <p className="text-xs text-cream-200/80 mt-3">
                🤫 ¡Guarda el secreto hasta el día del intercambio!
              </p>

              <button
                type="button"
                onClick={() => setRevelado(false)}
                className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-pine-800 hover:bg-pine-700 text-xs font-semibold text-cream-200 transition-colors"
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span>Ocultar nombre nuevamente</span>
              </button>
            </div>
          )}

          {/* Detalles del sorteo */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm font-semibold text-pine-800 mb-6">
            <span className="inline-flex items-center gap-1.5 bg-cream-200 px-3 py-1.5 rounded-xl">
              <Calendar className="w-4 h-4 text-crimson-600" />
              Intercambio: {formatearFecha(resultado.sorteo.fecha_evento)}
            </span>
            {resultado.sorteo.presupuesto !== null && (
              <span className="inline-flex items-center gap-1.5 bg-cream-200 px-3 py-1.5 rounded-xl">
                <Coins className="w-4 h-4 text-gold-600" />
                Presupuesto: S/ {Number(resultado.sorteo.presupuesto).toFixed(2)}
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={urlCompartirWhatsApp}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-1/2 py-3.5 px-4 rounded-2xl font-display font-bold text-xs sm:text-sm bg-[#25D366] hover:bg-[#1ebe57] text-pine-950 shadow-md flex items-center justify-center gap-2 transition-all"
            >
              <Share2 className="w-4 h-4" />
              <span>Compartir enlace del sorteo</span>
            </a>

            <button
              type="button"
              onClick={handleSalirConsulta}
              className="w-full sm:w-1/2 py-3.5 px-4 rounded-2xl font-display font-bold text-xs sm:text-sm bg-cream-200 hover:bg-cream-300 text-pine-900 flex items-center justify-center gap-2 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Consultar otro usuario</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-10 px-4 sm:px-6">
      <div className="text-center mb-6">
        <div className="flex justify-center mb-3">
          <EnvelopeIllustration className="w-20 h-20" />
        </div>
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-cream-50 mb-2">
          Descubre tu Amigo Secreto
        </h1>
        <p className="text-sm text-cream-200/85">
          Ingresa el código del sorteo, tu nombre de usuario y tu PIN personal de 6 dígitos.
        </p>
      </div>

      <div className="card-cream rounded-3xl p-6 sm:p-8 border-2 border-gold-400/60">
        <form onSubmit={handleConsultarSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="res-codigo"
              className="block text-xs font-bold uppercase tracking-wider text-pine-800 mb-1.5"
            >
              Código del sorteo *
            </label>
            <div className="relative">
              <Hash className="w-5 h-5 text-crimson-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="res-codigo"
                type="text"
                required
                maxLength={20}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                placeholder="Ej. AMIGO445"
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white border border-pine-500/30 text-pine-900 font-display font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-crimson-600"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="res-nombre"
              className="block text-xs font-bold uppercase tracking-wider text-pine-800 mb-1.5"
            >
              Nombre de usuario registrado *
            </label>
            <div className="relative">
              <User className="w-5 h-5 text-pine-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="res-nombre"
                type="text"
                required
                minLength={2}
                maxLength={120}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Carlos"
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white border border-pine-500/30 text-pine-900 font-medium focus:outline-none focus:ring-2 focus:ring-crimson-600"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="res-pin"
              className="block text-xs font-bold uppercase tracking-wider text-pine-800 mb-1.5"
            >
              PIN personal (6 dígitos) *
            </label>
            <div className="relative">
              <KeyRound className="w-5 h-5 text-crimson-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="res-pin"
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

          <button
            type="submit"
            disabled={consultando}
            className="w-full py-4 rounded-2xl font-display font-bold text-base sm:text-lg bg-gradient-to-r from-crimson-600 to-crimson-500 hover:from-crimson-500 hover:to-crimson-600 text-cream-50 shadow-xl shadow-crimson-600/30 border border-gold-400/50 flex items-center justify-center gap-2 transition-all disabled:opacity-60 mt-2"
          >
            <Gift className="w-5 h-5 text-gold-300" />
            <span>{consultando ? 'Verificando credenciales...' : 'Ingresar a mi resultado'}</span>
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-pine-800/15 flex items-center gap-2 text-xs text-pine-700">
          <ShieldCheck className="w-4 h-4 text-pine-700 shrink-0" />
          <span>
            Acceso privado protegido con tu nombre de usuario único y tu PIN encriptado.
          </span>
        </div>
      </div>
    </div>
  );
};
