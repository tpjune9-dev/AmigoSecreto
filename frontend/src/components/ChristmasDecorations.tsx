import React from 'react';

/**
 * Ilustración SVG navideña de una caja de regalo festiva con lazo dorado.
 */
export const GiftIllustration: React.FC<{ className?: string }> = ({ className = 'w-20 h-20' }) => (
  <svg
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Sombra base */}
    <ellipse cx="60" cy="108" rx="42" ry="6" fill="#03110A" fillOpacity="0.45" />
    {/* Cuerpo de la caja */}
    <rect x="24" y="48" width="72" height="56" rx="8" fill="#B91C1C" stroke="#F5C542" strokeWidth="2.5" />
    {/* Cinta vertical */}
    <rect x="52" y="48" width="16" height="56" fill="#F5C542" />
    {/* Tapa de la caja */}
    <rect x="18" y="34" width="84" height="18" rx="6" fill="#D42426" stroke="#F5C542" strokeWidth="2.5" />
    {/* Cinta en la tapa */}
    <rect x="51" y="34" width="18" height="18" fill="#FDE047" />
    {/* Lazo izquierdo */}
    <path
      d="M60 34C60 34 42 12 31 20C20 28 36 36 60 34Z"
      fill="#F5C542"
      stroke="#B59024"
      strokeWidth="2"
    />
    {/* Lazo derecho */}
    <path
      d="M60 34C60 34 78 12 89 20C100 28 84 36 60 34Z"
      fill="#F5C542"
      stroke="#B59024"
      strokeWidth="2"
    />
    {/* Destellos navideños */}
    <circle cx="20" cy="18" r="3" fill="#FDE047" />
    <circle cx="102" cy="24" r="2.5" fill="#FDE047" />
    <circle cx="14" cy="70" r="2" fill="#FFFDF9" fillOpacity="0.7" />
    <circle cx="106" cy="66" r="2.5" fill="#FFFDF9" fillOpacity="0.7" />
  </svg>
);

/**
 * Ilustración SVG de un sobre navideño lacrado con sello dorado para revelar el Amigo Secreto.
 */
export const EnvelopeIllustration: React.FC<{ className?: string }> = ({ className = 'w-24 h-24' }) => (
  <svg
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <ellipse cx="60" cy="106" rx="44" ry="6" fill="#03110A" fillOpacity="0.4" />
    {/* Cuerpo del sobre */}
    <rect
      x="16"
      y="30"
      width="88"
      height="66"
      rx="10"
      fill="#FDFBF3"
      stroke="#D4AF37"
      strokeWidth="3"
    />
    {/* Pliegues inferiores */}
    <path d="M18 93L52 63" stroke="#E5D5B5" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M102 93L68 63" stroke="#E5D5B5" strokeWidth="2.5" strokeLinecap="round" />
    {/* Solapa superior */}
    <path
      d="M17 33L60 68L103 33"
      fill="#F2E6C9"
      stroke="#D4AF37"
      strokeWidth="3"
      strokeLinejoin="round"
    />
    {/* Sello de lacre rojo y dorado */}
    <circle cx="60" cy="64" r="14" fill="#D42426" stroke="#F5C542" strokeWidth="2.5" />
    <path
      d="M60 56L62.4 61.2L68 61.9L63.8 65.7L64.9 71.2L60 68.4L55.1 71.2L56.2 65.7L52 61.9L57.6 61.2L60 56Z"
      fill="#FDE047"
    />
  </svg>
);

