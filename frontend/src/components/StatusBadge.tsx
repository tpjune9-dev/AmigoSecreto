import React from 'react';
import { CheckCircle2, Lock, Users } from 'lucide-react';
import { EstadoSorteo } from '../services/api';

export const StatusBadge: React.FC<{ estado: EstadoSorteo }> = ({ estado }) => {
  if (estado === 'INSCRIPCIONES_ABIERTAS') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
        <Users className="w-3.5 h-3.5" />
        Inscripciones abiertas
      </span>
    );
  }

  if (estado === 'INSCRIPCIONES_CERRADAS') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-500/20 text-gold-300 border border-gold-400/40">
        <Lock className="w-3.5 h-3.5" />
        Inscripciones cerradas
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-crimson-500/25 text-red-200 border border-crimson-500/50">
      <CheckCircle2 className="w-3.5 h-3.5 text-gold-400" />
      Sorteo realizado
    </span>
  );
};

