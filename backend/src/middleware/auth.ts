import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET no está definido en las variables de entorno.');
  }
  return secret;
};

export interface AdminTokenPayload {
  role: 'ADMIN';
  adminId: number;
  email: string;
  nombre: string;
}

export interface ParticipantTokenPayload {
  role: 'PARTICIPANT';
  participanteId: number;
  sorteoId: number;
  codigoSorteo: string;
}

declare global {
  namespace Express {
    interface Request {
      admin?: AdminTokenPayload;
      participant?: ParticipantTokenPayload;
    }
  }
}

export function generarTokenAdmin(payload: Omit<AdminTokenPayload, 'role'>): string {
  return jwt.sign({ ...payload, role: 'ADMIN' }, getJwtSecret(), {
    expiresIn: '7d',
  });
}

export function generarTokenParticipante(payload: Omit<ParticipantTokenPayload, 'role'>): string {
  return jwt.sign({ ...payload, role: 'PARTICIPANT' }, getJwtSecret(), {
    expiresIn: '2h',
  });
}

export function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'No autorizado. Debes iniciar sesión como administrador.',
    });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as AdminTokenPayload;
    if (decoded.role !== 'ADMIN' || !decoded.adminId) {
      res.status(403).json({
        error: 'Acceso denegado. Se requieren permisos de administrador.',
      });
      return;
    }
    req.admin = decoded;
    next();
  } catch {
    res.status(401).json({
      error: 'Tu sesión ha expirado o el token es inválido. Por favor inicia sesión nuevamente.',
    });
  }
}

export function requireParticipantAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'No autorizado. Debes validar tu teléfono y PIN personal para ver tu resultado.',
    });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as ParticipantTokenPayload;
    if (decoded.role !== 'PARTICIPANT' || !decoded.participanteId || !decoded.sorteoId) {
      res.status(403).json({
        error: 'Credenciales de participante no válidas.',
      });
      return;
    }
    req.participant = decoded;
    next();
  } catch {
    res.status(401).json({
      error: 'Tu sesión de consulta ha expirado. Ingresa nuevamente tu código, teléfono y PIN.',
    });
  }
}

