import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { normalizarTelefono, esTelefonoValido } from '../utils/phoneUtils';
import { codeLookupLimiter, pinVerificationLimiter } from '../middleware/rateLimiter';
import { generarTokenParticipante, requireParticipantAuth } from '../middleware/auth';

const router = Router();

const registroParticipanteSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, 'Ingresa tu nombre completo (mínimo 2 caracteres).')
    .max(120, 'El nombre no puede superar los 120 caracteres.'),
  telefono: z.string().trim().min(7, 'Ingresa tu número de WhatsApp.'),
  pin: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'El PIN personal debe tener exactamente 6 dígitos numéricos.'),
  confirmacion_pin: z.string().trim(),
  consentimiento: z.boolean().refine((val) => val === true, {
    message: 'Debes aceptar el consentimiento para el tratamiento de tus datos de registro.',
  }),
});

const consultaResultadoSchema = z.object({
  codigo: z
    .string()
    .trim()
    .min(3, 'Ingresa el código del sorteo.')
    .max(20)
    .transform((v) => v.toUpperCase()),
  telefono: z.string().trim().min(7, 'Ingresa tu número de WhatsApp registrado.'),
  pin: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Ingresa tu PIN personal de 6 dígitos.'),
});

// 1. Validar código de sorteo y devolver únicamente información pública (nunca teléfonos ni resultados)
router.get(
  '/sorteos/codigo/:codigo',
  codeLookupLimiter,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const codigo = (req.params.codigo || '').trim().toUpperCase();
      if (!codigo || codigo.length < 3 || codigo.length > 20) {
        res.status(400).json({
          error: 'El formato del código de sorteo no es válido.',
        });
        return;
      }

      const sorteo = await prisma.sorteo.findUnique({
        where: { codigo_unico: codigo },
        include: {
          _count: {
            select: { participantes: true },
          },
        },
      });

      if (!sorteo) {
        res.status(404).json({
          error: 'El código del sorteo no existe. Verifica que esté bien escrito.',
        });
        return;
      }

      res.json({
        sorteo: {
          id: sorteo.id,
          nombre: sorteo.nombre,
          codigo_unico: sorteo.codigo_unico,
          descripcion: sorteo.descripcion,
          fecha_evento: sorteo.fecha_evento,
          presupuesto: sorteo.presupuesto ? Number(sorteo.presupuesto) : null,
          estado: sorteo.estado,
          total_participantes: sorteo._count.participantes,
        },
      });
    } catch (error) {
      console.error('Error al validar código de sorteo:', error);
      res.status(500).json({
        error: 'Error al consultar la información del sorteo.',
      });
    }
  }
);

// 2. Registrar participante en un sorteo
router.post(
  '/sorteos/:codigo/participantes',
  codeLookupLimiter,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const codigo = (req.params.codigo || '').trim().toUpperCase();
      if (!codigo) {
        res.status(400).json({ error: 'Código de sorteo requerido.' });
        return;
      }

      const parsed = registroParticipanteSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: parsed.error.issues[0]?.message || 'Datos de registro inválidos.',
        });
        return;
      }

      const { nombre, telefono, pin, confirmacion_pin, consentimiento } = parsed.data;

      if (pin !== confirmacion_pin) {
        res.status(400).json({
          error: 'El PIN y la confirmación del PIN no coinciden.',
        });
        return;
      }

      const telefonoNormalizado = normalizarTelefono(telefono);
      if (!esTelefonoValido(telefonoNormalizado)) {
        res.status(400).json({
          error:
            'Ingresa un número de WhatsApp válido (por ejemplo: +51 987654321 o 9 dígitos para Perú).',
        });
        return;
      }

      const sorteo = await prisma.sorteo.findUnique({
        where: { codigo_unico: codigo },
      });

      if (!sorteo) {
        res.status(404).json({
          error: 'El código del sorteo no existe.',
        });
        return;
      }

      if (sorteo.estado !== 'INSCRIPCIONES_ABIERTAS') {
        res.status(400).json({
          error:
            sorteo.estado === 'SORTEO_REALIZADO'
              ? 'Este sorteo ya fue realizado y no acepta nuevos participantes.'
              : 'Las inscripciones para este sorteo se encuentran cerradas.',
        });
        return;
      }

      // Verificar que no exista el mismo teléfono en este sorteo
      const duplicado = await prisma.participante.findUnique({
        where: {
          uq_sorteo_telefono: {
            sorteo_id: sorteo.id,
            telefono: telefonoNormalizado,
          },
        },
      });

      if (duplicado) {
        res.status(409).json({
          error: 'Este número de WhatsApp ya se encuentra registrado en este sorteo.',
        });
        return;
      }

      const pin_hash = await bcrypt.hash(pin, 10);

      const participante = await prisma.participante.create({
        data: {
          sorteo_id: sorteo.id,
          nombre,
          telefono: telefonoNormalizado,
          pin_hash,
          consentimiento,
        },
      });

      res.status(201).json({
        mensaje: '¡Te registraste correctamente! 🎉',
        detalle:
          'Recibirás tu asignación o podrás consultarla con tu número y PIN cuando el administrador realice el sorteo.',
        participante: {
          id: participante.id,
          nombre: participante.nombre,
          created_at: participante.created_at,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        res.status(409).json({
          error: 'Este número de WhatsApp ya se encuentra registrado en este sorteo.',
        });
        return;
      }
      console.error('Error al registrar participante:', error);
      res.status(500).json({
        error: 'Error interno al registrar tu participación.',
      });
    }
  }
);

// 3. Autenticar participante con código, teléfono y PIN para consultar su resultado privado
router.post(
  '/resultado/consultar',
  pinVerificationLimiter,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const parsed = consultaResultadoSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: parsed.error.issues[0]?.message || 'Datos de consulta inválidos.',
        });
        return;
      }

      const { codigo, telefono, pin } = parsed.data;
      const telefonoNormalizado = normalizarTelefono(telefono);

      const sorteo = await prisma.sorteo.findUnique({
        where: { codigo_unico: codigo },
      });

      if (!sorteo) {
        res.status(404).json({
          error: 'El código del sorteo ingresado no existe.',
        });
        return;
      }

      const participante = await prisma.participante.findUnique({
        where: {
          uq_sorteo_telefono: {
            sorteo_id: sorteo.id,
            telefono: telefonoNormalizado,
          },
        },
      });

      if (!participante) {
        res.status(401).json({
          error:
            'Credenciales incorrectas. Verifica tu código de sorteo, número de WhatsApp y PIN personal.',
        });
        return;
      }

      const pinValido = await bcrypt.compare(pin, participante.pin_hash);
      if (!pinValido) {
        res.status(401).json({
          error:
            'Credenciales incorrectas. Verifica tu código de sorteo, número de WhatsApp y PIN personal.',
        });
        return;
      }

      if (sorteo.estado !== 'SORTEO_REALIZADO') {
        res.status(400).json({
          error:
            'Tus credenciales son válidas, pero el administrador aún no ha realizado el sorteo. ¡Vuelve a consultar cuando el sorteo haya finalizado!',
          estado_sorteo: sorteo.estado,
        });
        return;
      }

      const asignacion = await prisma.asignacion.findUnique({
        where: {
          uq_sorteo_origen: {
            sorteo_id: sorteo.id,
            participante_origen_id: participante.id,
          },
        },
        include: {
          participanteDestino: {
            select: {
              nombre: true,
            },
          },
        },
      });

      if (!asignacion) {
        res.status(404).json({
          error: 'No se encontró una asignación para tu registro en este sorteo.',
        });
        return;
      }

      const token = generarTokenParticipante({
        participanteId: participante.id,
        sorteoId: sorteo.id,
        codigoSorteo: sorteo.codigo_unico,
      });

      res.json({
        token,
        sorteo: {
          nombre: sorteo.nombre,
          codigo_unico: sorteo.codigo_unico,
          descripcion: sorteo.descripcion,
          fecha_evento: sorteo.fecha_evento,
          presupuesto: sorteo.presupuesto ? Number(sorteo.presupuesto) : null,
        },
        participante: {
          nombre: participante.nombre,
        },
        amigo_secreto: {
          nombre: asignacion.participanteDestino.nombre,
        },
      });
    } catch (error) {
      console.error('Error al consultar resultado privado:', error);
      res.status(500).json({
        error: 'Error interno al consultar tu resultado de Amigo Secreto.',
      });
    }
  }
);

// 4. Consultar mi asignación con sesión activa de participante (protegido contra manipulación de IDs en URL)
router.get(
  '/resultado/mi-asignacion',
  requireParticipantAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Si el usuario intenta pasar otro participanteId por query o params, se rechaza o ignora estrictamente
      const requestedId = req.query.participanteId ? Number(req.query.participanteId) : null;
      if (requestedId !== null && requestedId !== req.participant!.participanteId) {
        res.status(403).json({
          error: 'Acceso denegado. No puedes consultar el resultado de otro participante.',
        });
        return;
      }

      const { participanteId, sorteoId } = req.participant!;

      const sorteo = await prisma.sorteo.findUnique({
        where: { id: sorteoId },
      });

      if (!sorteo || sorteo.estado !== 'SORTEO_REALIZADO') {
        res.status(400).json({
          error: 'El sorteo no está disponible o aún no se ha realizado.',
        });
        return;
      }

      const participante = await prisma.participante.findFirst({
        where: {
          id: participanteId,
          sorteo_id: sorteoId,
        },
      });

      if (!participante) {
        res.status(404).json({
          error: 'Participante no encontrado.',
        });
        return;
      }

      const asignacion = await prisma.asignacion.findUnique({
        where: {
          uq_sorteo_origen: {
            sorteo_id: sorteoId,
            participante_origen_id: participanteId,
          },
        },
        include: {
          participanteDestino: {
            select: {
              nombre: true,
            },
          },
        },
      });

      if (!asignacion) {
        res.status(404).json({
          error: 'Asignación no encontrada.',
        });
        return;
      }

      res.json({
        sorteo: {
          nombre: sorteo.nombre,
          codigo_unico: sorteo.codigo_unico,
          descripcion: sorteo.descripcion,
          fecha_evento: sorteo.fecha_evento,
          presupuesto: sorteo.presupuesto ? Number(sorteo.presupuesto) : null,
        },
        participante: {
          nombre: participante.nombre,
        },
        amigo_secreto: {
          nombre: asignacion.participanteDestino.nombre,
        },
      });
    } catch (error) {
      console.error('Error al recuperar asignación del participante:', error);
      res.status(500).json({
        error: 'Error al recuperar tu asignación.',
      });
    }
  }
);

export default router;

