import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  abierto: boolean;
  titulo: string;
  descripcion: string;
  textoConfirmar: string;
  textoCancelar?: string;
  variante?: 'danger' | 'primary';
  cargando?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  abierto,
  titulo,
  descripcion,
  textoConfirmar,
  textoCancelar = 'Cancelar',
  variante = 'primary',
  cargando = false,
  onConfirmar,
  onCancelar,
}) => {
  if (!abierto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-pine-950/80 backdrop-blur-sm animate-reveal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="card-cream w-full max-w-md rounded-3xl p-6 sm:p-7 relative border-2 border-gold-400/50">
        <button
          onClick={onCancelar}
          disabled={cargando}
          className="absolute top-4 right-4 p-2 rounded-xl text-pine-700 hover:bg-cream-200 transition-colors"
          aria-label="Cerrar ventana de confirmación"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3.5 mb-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              variante === 'danger'
                ? 'bg-crimson-100 text-crimson-600'
                : 'bg-pine-100 text-pine-700'
            }`}
          >
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 id="modal-title" className="font-display font-bold text-xl text-pine-900">
            {titulo}
          </h3>
        </div>

        <p className="text-pine-800/90 text-sm sm:text-base leading-relaxed mb-6">
          {descripcion}
        </p>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
          <button
            type="button"
            onClick={onCancelar}
            disabled={cargando}
            className="w-full sm:w-auto px-5 py-3 rounded-xl font-semibold text-pine-800 bg-cream-200 hover:bg-cream-300 transition-colors"
          >
            {textoCancelar}
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={cargando}
            className={`w-full sm:w-auto px-5 py-3 rounded-xl font-bold text-cream-50 shadow-lg transition-all ${
              variante === 'danger'
                ? 'bg-crimson-600 hover:bg-crimson-700 shadow-crimson-600/30'
                : 'bg-pine-600 hover:bg-pine-700 shadow-pine-700/30'
            } disabled:opacity-50`}
          >
            {cargando ? 'Procesando...' : textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
};

