import React from 'react';
import { Link } from 'react-router-dom';
import { Gift, Users, Sparkles, ArrowRight, Eye } from 'lucide-react';
import { GiftIllustration, EnvelopeIllustration } from '../components/ChristmasDecorations';

export const HomePage: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
      {/* Hero Principal */}
      <section className="relative w-full py-12 sm:py-16 px-4 sm:px-6 overflow-hidden">
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

          {/* Título principal */}
          <h1 className="font-display font-extrabold text-4xl sm:text-6xl lg:text-7xl tracking-tight text-cream-50 mb-5 drop-shadow-sm">
            🎁 Amigo Secreto
          </h1>

          {/* Subtítulo */}
          <p className="max-w-2xl mx-auto text-base sm:text-xl text-cream-200/90 font-normal leading-relaxed mb-10 px-2">
            Organiza tu intercambio de regalos de una manera divertida, fácil y sorprendente.
          </p>

          {/* Dos botones principales */}
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
    </div>
  );
};
