import rateLimit from 'express-rate-limit';
import { Request } from 'express';

/**
 * Limita intentos de autenticación de administrador para mitigar fuerza bruta.
 */
export const adminAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Demasiados intentos de autenticación. Por favor espera unos minutos antes de volver a intentarlo.',
  },
});

/**
 * Limita los intentos de adivinar el PIN por cada usuario específico (código + nombre de usuario),
 * permitiendo que cientos de participantes distintos consulten su resultado al mismo tiempo
 * incluso si están conectados al mismo Wi-Fi.
 */
export const pinVerificationLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 15, // 15 intentos por cada usuario específico
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const codigo = String(req.body?.codigo || '').trim().toUpperCase();
    const nombre = String(req.body?.nombre || '').trim().toLowerCase();
    return `${req.ip || 'ip'}:${codigo}:${nombre}`;
  },
  validate: false,
  message: {
    error: 'Has superado el límite de intentos para verificar tu PIN. Por seguridad, espera 10 minutos e inténtalo de nuevo.',
  },
});

/**
 * Permite que cientos de participantes validen el código y se registren simultáneamente.
 */
export const codeLookupLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Demasiadas consultas seguidas. Intenta nuevamente en unos minutos.',
  },
});
