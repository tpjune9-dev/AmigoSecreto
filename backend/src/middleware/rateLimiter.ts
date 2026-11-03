import rateLimit from 'express-rate-limit';

/**
 * Limita intentos de autenticación de administrador para mitigar fuerza bruta.
 */
export const adminAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Demasiados intentos de autenticación. Por favor espera unos minutos antes de volver a intentarlo.',
  },
});

/**
 * Limita estrictamente los intentos de consultar resultados secretos adivinando PIN o códigos.
 */
export const pinVerificationLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 10, // Máximo 10 intentos cada 10 minutos por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Has superado el límite de intentos para verificar tu PIN. Por seguridad, espera 10 minutos e inténtalo de nuevo.',
  },
});

/**
 * Limita consultas masivas de validación de códigos de sorteo.
 */
export const codeLookupLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 45,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Demasiadas consultas de códigos de sorteo. Intenta nuevamente en unos minutos.',
  },
});

