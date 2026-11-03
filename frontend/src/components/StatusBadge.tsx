import React from 'react';
import { CheckCircle2, Lock, Users } from 'lucide-react';
import { EstadoSorteo } from '../services/api';

export const StatusBadge: React.FC<{ estado: EstadoSorteo }> = ({ estado }) => {
  if (estado === 'INSCRIPCIONES_ABIERTAS') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-700 text-cream-50 border border-emerald-400/50 shadow-sm">
        <Users className="w-3.5 h-3.5 text-emerald-200" />
        Inscripciones abiertas
      </span>
    );
  }

  if (estado === 'INSCRIPCIONES_CERRADAS') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-500 text-pine-950 border border-amber-600/40 shadow-sm">
        <Lock className="w-3.5 h-3.5 text-pine-950" />
        Inscripciones cerradas
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-crimson-600 text-cream-50 border border-gold-400/60 shadow-sm">
      <CheckCircle2 className="w-3.5 h-3.5 text-gold-300" />
      Sorteo realizado
    </span>
  );
};
