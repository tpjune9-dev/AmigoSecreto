import React from 'react';
import { Link } from 'react-router-dom';
import {
  Gift,
  Users,
  Sparkles,
  ShieldCheck,
  Smartphone,
  Lock,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { GiftIllustration, EnvelopeIllustration } from '../components/ChristmasDecorations';

export const HomePage: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between">
      {/* Hero Principal */}
      <section className="relative py-10 sm:py-16 lg:py-20 px-4 sm:px-6 overflow-hidden">
        {/* Luces decorativas de fondo */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-[36rem] h-[22rem] bg-gold-400/10 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute top-32 -right-24 w-72 h-72 bg-crimson-600/15 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Insignia superior */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pine-800/90 border border-gold-400/40 text-gold-300 text-xs sm:text-sm font-semibold mb-6 shadow-lg">
            <Sparkles className="w-4 h-4 text-gold-400" />
            <span>Edición Especial de Intercambio de Regalos</span>
          </div>

          {/* Ilustración animada */}
          <div className="flex justify-center items-center gap-4 mb-6">
            <div className="animate-float">
              <GiftIllustration className="w-24 h-24 sm:w-28 sm:h-28" />
            </div>
            <div className="hidden sm:block animate-float" style={{ animationDelay: '1.2s' }}>
              <EnvelopeIllustration className="w-24 h-24 sm:w-28 sm:h-28" />
            </div>
          </div>

          {/* Título principal obligatorio */}
          <h1 className="font-display font-extrabold text-4xl sm:text-6xl lg:text-7xl tracking-tight text-cream-50 mb-5 drop-shadow-sm">
            🎁 Amigo Secreto
          </h1>

          {/* Subtítulo obligatorio */}
          <p className="max-w-2xl mx-auto text-base sm:text-xl text-cream-200/90 font-normal leading-relaxed mb-10 px-2">
            Organiza tu intercambio de regalos de una manera divertida, fácil y sorprendente.
          </p>

          {/* Dos botones principales obligatorios */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-xl mx-auto mb-8">
            <Link
              to="/crear-sorteo"
              className="w-full sm:w-1/2 py-4 px-6 rounded-2xl font-display font-bold text-base sm:text-lg bg-gradient-to-r from-crimson-600 to-crimson-500 hover:from-crimson-500 hover:to-crimson-600 text-cream-50 shadow-xl shadow-crimson-900/50 border-2 border-gold-400/60 flex items-center justify-center gap-2.5 transform hover:-translate-y-0.5 transition-all"
            >
              <Gift className="w-5 h-5 text-gold-300 shrink-0" />
              <span>Crear un sorteo</span>
            </Link>

            <Link
              to="/unirse"
              className="w-full sm:w-1/2 py-4 px-6 rounded-2xl font-display font-bold text-base sm:text-lg card-cream text-pine-900 hover:bg-cream-200 border-2 border-gold-400 flex items-center justify-center gap-2.5 transform hover:-translate-y-0.5 transition-all"
            >
              <Users className="w-5 h-5 text-crimson-600 shrink-0" />
              <span>Unirme a un sorteo</span>
            </Link>
          </div>

          {/* Acceso directo para participantes que ya tienen sorteo realizado */}
          <div className="inline-flex items-center justify-center">
            <Link
              to="/resultado"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-pine-800/80 hover:bg-pine-700/90 text-gold-300 border border-gold-400/30 text-sm font-semibold transition-all group"
            >
              <Eye className="w-4 h-4 text-gold-400" />
              <span>¿Ya se realizó tu sorteo? Consulta tu Amigo Secreto aquí</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Sección de Pasos / Beneficios */}
      <section className="py-12 px-4 sm:px-6 bg-pine-950/60 border-t border-gold-500/20">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-center text-cream-50 mb-10">
            ¿Cómo funciona nuestro sorteo navideño?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card-pine rounded-3xl p-6 sm:p-7 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-crimson-600/20 border border-crimson-500/40 flex items-center justify-center text-gold-400 mb-5">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-xl text-cream-50 mb-2">
                  1. Crea y comparte por WhatsApp
                </h3>
                <p className="text-sm text-cream-200/80 leading-relaxed">
                  El organizador crea el evento en segundos y recibe un código único (ej.{' '}
                  <code className="text-gold-300 font-bold">AMIGO482</code>) con enlace directo para
                  invitar al grupo desde cualquier celular.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-gold-500/15 text-xs text-gold-300 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Sin instalar aplicaciones
              </div>
            </div>

            <div className="card-pine rounded-3xl p-6 sm:p-7 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-gold-500/20 border border-gold-400/40 flex items-center justify-center text-gold-300 mb-5">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-xl text-cream-50 mb-2">
                  2. Sorteo criptográfico sin repetidos
                </h3>
                <p className="text-sm text-cream-200/80 leading-relaxed">
                  Nuestro algoritmo en el servidor garantiza matemáticamente que nadie se regale a sí
                  mismo y que cada participante reciba exactamente un regalo.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-gold-500/15 text-xs text-gold-300 font-semibold flex items-center gap-1.5">
                <Lock className="w-4 h-4" /> Protegido en base de datos MySQL
              </div>
            </div>

            <div className="card-pine rounded-3xl p-6 sm:p-7 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 mb-5">
                  <Gift className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-xl text-cream-50 mb-2">
                  3. Resultado 100% secreto con PIN
                </h3>
                <p className="text-sm text-cream-200/80 leading-relaxed">
                  Cada participante elige un PIN personal de 6 dígitos al inscribirse. Ni siquiera el
                  administrador puede ver a quién le tocó regalar a cada persona.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-gold-500/15 text-xs text-gold-300 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Revelación animada con confeti
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

