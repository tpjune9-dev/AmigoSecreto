import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { generarTokenAdmin, requireAdminAuth } from '../middleware/auth';
import { adminAuthLimiter } from '../middleware/rateLimiter';

const router = Router();

const registerSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(120, 'El nombre no puede superar los 120 caracteres.'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Ingresa un correo electrónico válido.')
    .max(160),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres.')
    .max(100),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Ingresa un correo electrónico válido.'),
  password: z.string().min(1, 'Ingresa tu contraseña.'),
});

router.post('/register', adminAuthLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Datos de registro inválidos.',
      });
      return;
    }

    const { nombre, email, password } = parsed.data;

    const existente = await prisma.administrador.findUnique({
      where: { email },
    });

    if (existente) {
      res.status(409).json({
        error: 'Ya existe una cuenta de administrador registrada con este correo electrónico.',
      });
      return;
    }

    const password_hash = await bcrypt.hash(password, 12);

    const admin = await prisma.administrador.create({
      data: {
        nombre,
        email,
        password_hash,
      },
    });

    const token = generarTokenAdmin({
      adminId: admin.id,
      email: admin.email,
      nombre: admin.nombre,
    });

    res.status(201).json({
      mensaje: 'Cuenta de administrador creada exitosamente.',
      token,
      administrador: {
        id: admin.id,
        nombre: admin.nombre,
        email: admin.email,
        created_at: admin.created_at,
      },
    });
  } catch (error) {
    console.error('Error en registro de administrador:', error);
    res.status(500).json({
      error: 'Error interno al registrar la cuenta de administrador.',
    });
  }
});

router.post('/login', adminAuthLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Credenciales inválidas.',
      });
      return;
    }

    const { email, password } = parsed.data;

    const admin = await prisma.administrador.findUnique({
      where: { email },
    });

    if (!admin) {
      res.status(401).json({
        error: 'Correo electrónico o contraseña incorrectos.',
      });
      return;
    }

    const passwordValido = await bcrypt.compare(password, admin.password_hash);
    if (!passwordValido) {
      res.status(401).json({
        error: 'Correo electrónico o contraseña incorrectos.',
      });
      return;
    }

    const token = generarTokenAdmin({
      adminId: admin.id,
      email: admin.email,
      nombre: admin.nombre,
    });

    res.json({
      mensaje: 'Inicio de sesión exitoso.',
      token,
      administrador: {
        id: admin.id,
        nombre: admin.nombre,
        email: admin.email,
        created_at: admin.created_at,
      },
    });
  } catch (error) {
    console.error('Error en login de administrador:', error);
    res.status(500).json({
      error: 'Error interno al iniciar sesión.',
    });
  }
});

router.get('/me', requireAdminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const admin = await prisma.administrador.findUnique({
      where: { id: req.admin!.adminId },
      select: {
        id: true,
        nombre: true,
        email: true,
        created_at: true,
      },
    });

    if (!admin) {
      res.status(404).json({ error: 'Administrador no encontrado.' });
      return;
    }

    res.json({ administrador: admin });
  } catch (error) {
    console.error('Error al consultar perfil de administrador:', error);
    res.status(500).json({ error: 'Error al obtener datos del administrador.' });
  }
});

export default router;

