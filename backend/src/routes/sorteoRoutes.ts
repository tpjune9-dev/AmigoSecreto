import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { requireAdminAuth } from '../middleware/auth';
import { generarCodigoUnicoSorteo } from '../utils/codeGenerator';
import { generarAsignacionesSinPuntosFijos } from '../utils/drawAlgorithm';

const router = Router();

router.use(requireAdminAuth);

const crearSorteoSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(3, 'El nombre del sorteo debe tener al menos 3 caracteres.')
    .max(150, 'El nombre del sorteo no puede exceder 150 caracteres.'),
  descripcion: z
    .string()
    .trim()
    .max(1000, 'La descripción no puede exceder 1000 caracteres.')
    .optional()
    .nullable(),
  fecha_evento: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Ingresa una fecha válida para el intercambio.',
  }),
  presupuesto: z
    .union([z.number(), z.string(), z.null(), z.undefined()])
    .optional()
    .transform((val) => {
      if (val === null || val === undefined || val === '') return null;
      const num = typeof val === 'number' ? val : Number(val);
      return isNaN(num) ? NaN : num;
    })
    .refine((val) => val === null || (val >= 0 && val <= 999999), {
      message: 'El presupuesto debe ser un monto válido en soles.',
    }),
});

// Crear un nuevo sorteo
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = crearSorteoSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Datos del sorteo inválidos.',
      });
      return;
    }

    const { nombre, descripcion, fecha_evento, presupuesto } = parsed.data;
    const codigo_unico = await generarCodigoUnicoSorteo(prisma);

    const nuevoSorteo = await prisma.sorteo.create({
      data: {
        administrador_id: req.admin!.adminId,
        nombre,
        codigo_unico,
        descripcion: descripcion || null,
        fecha_evento: new Date(fecha_evento),
        presupuesto: presupuesto !== null ? new Prisma.Decimal(presupuesto) : null,
        estado: 'INSCRIPCIONES_ABIERTAS',
      },
      include: {
        _count: {
          select: { participantes: true },
        },
      },
    });

    res.status(201).json({
      mensaje: '¡Sorteo creado exitosamente!',
      sorteo: {
        ...nuevoSorteo,
        presupuesto: nuevoSorteo.presupuesto ? Number(nuevoSorteo.presupuesto) : null,
        total_participantes: nuevoSorteo._count.participantes,
      },
    });
  } catch (error) {
    console.error('Error al crear sorteo:', error);
    res.status(500).json({
      error: 'Error interno al crear el sorteo.',
    });
  }
});

// Listar todos los sorteos del administrador autenticado
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const sorteos = await prisma.sorteo.findMany({
      where: { administrador_id: req.admin!.adminId },
      include: {
        _count: {
          select: { participantes: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    res.json({
      sorteos: sorteos.map((s) => ({
        id: s.id,
        nombre: s.nombre,
        codigo_unico: s.codigo_unico,
        descripcion: s.descripcion,
        fecha_evento: s.fecha_evento,
        presupuesto: s.presupuesto ? Number(s.presupuesto) : null,
        estado: s.estado,
        created_at: s.created_at,
        total_participantes: s._count.participantes,
      })),
    });
  } catch (error) {
    console.error('Error al listar sorteos:', error);
    res.status(500).json({
      error: 'Error al consultar la lista de sorteos.',
    });
  }
});

// Consultar detalle de un sorteo específico (SIN exponer las asignaciones secretas)
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const sorteoId = Number(req.params.id);
    if (isNaN(sorteoId)) {
      res.status(400).json({ error: 'Identificador de sorteo inválido.' });
      return;
    }

    const sorteo = await prisma.sorteo.findFirst({
      where: {
        id: sorteoId,
        administrador_id: req.admin!.adminId,
      },
      include: {
        participantes: {
          select: {
            id: true,
            nombre: true,
            created_at: true,
          },
          orderBy: { created_at: 'asc' },
        },
      },
    });

    if (!sorteo) {
      res.status(404).json({
        error: 'Sorteo no encontrado o no tienes permisos para administrarlo.',
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
        created_at: sorteo.created_at,
        total_participantes: sorteo.participantes.length,
        participantes: sorteo.participantes,
      },
    });
  } catch (error) {
    console.error('Error al obtener detalle del sorteo:', error);
    res.status(500).json({
      error: 'Error interno al consultar el sorteo.',
    });
  }
});

// Cerrar inscripciones del sorteo
router.patch('/:id/cerrar-inscripciones', async (req: Request, res: Response): Promise<void> => {
  try {
    const sorteoId = Number(req.params.id);
    if (isNaN(sorteoId)) {
      res.status(400).json({ error: 'Identificador de sorteo inválido.' });
      return;
    }

    const sorteo = await prisma.sorteo.findFirst({
      where: {
        id: sorteoId,
        administrador_id: req.admin!.adminId,
      },
    });

    if (!sorteo) {
      res.status(404).json({ error: 'Sorteo no encontrado.' });
      return;
    }

    if (sorteo.estado === 'SORTEO_REALIZADO') {
      res.status(400).json({
        error: 'El sorteo ya fue realizado y sus inscripciones ya están cerradas.',
      });
      return;
    }

    const actualizado = await prisma.sorteo.update({
      where: { id: sorteoId },
      data: { estado: 'INSCRIPCIONES_CERRADAS' },
    });

    res.json({
      mensaje: 'Las inscripciones se han cerrado correctamente.',
      estado: actualizado.estado,
    });
  } catch (error) {
    console.error('Error al cerrar inscripciones:', error);
    res.status(500).json({ error: 'Error interno al cerrar las inscripciones.' });
  }
});

// Reabrir inscripciones (solo si el sorteo aún no se ha realizado)
router.patch('/:id/reabrir-inscripciones', async (req: Request, res: Response): Promise<void> => {
  try {
    const sorteoId = Number(req.params.id);
    if (isNaN(sorteoId)) {
      res.status(400).json({ error: 'Identificador de sorteo inválido.' });
      return;
    }

    const sorteo = await prisma.sorteo.findFirst({
      where: {
        id: sorteoId,
        administrador_id: req.admin!.adminId,
      },
    });

    if (!sorteo) {
      res.status(404).json({ error: 'Sorteo no encontrado.' });
      return;
    }

    if (sorteo.estado === 'SORTEO_REALIZADO') {
      res.status(400).json({
        error: 'No se pueden reabrir inscripciones porque el sorteo ya fue realizado. Si necesitas modificar participantes, debes realizar un reinicio administrativo explícito.',
      });
      return;
    }

    const actualizado = await prisma.sorteo.update({
      where: { id: sorteoId },
      data: { estado: 'INSCRIPCIONES_ABIERTAS' },
    });

    res.json({
      mensaje: 'Las inscripciones están nuevamente abiertas.',
      estado: actualizado.estado,
    });
  } catch (error) {
    console.error('Error al reabrir inscripciones:', error);
    res.status(500).json({ error: 'Error interno al reabrir las inscripciones.' });
  }
});

// Retirar un participante antes de realizar el sorteo
router.delete('/:id/participantes/:participanteId', async (req: Request, res: Response): Promise<void> => {
  try {
    const sorteoId = Number(req.params.id);
    const participanteId = Number(req.params.participanteId);

    if (isNaN(sorteoId) || isNaN(participanteId)) {
      res.status(400).json({ error: 'Identificadores inválidos.' });
      return;
    }

    const sorteo = await prisma.sorteo.findFirst({
      where: {
        id: sorteoId,
        administrador_id: req.admin!.adminId,
      },
    });

    if (!sorteo) {
      res.status(404).json({ error: 'Sorteo no encontrado.' });
      return;
    }

    if (sorteo.estado === 'SORTEO_REALIZADO') {
      res.status(400).json({
        error: 'No se pueden retirar participantes después de haberse realizado el sorteo.',
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
      res.status(404).json({ error: 'Participante no encontrado en este sorteo.' });
      return;
    }

    await prisma.participante.delete({
      where: { id: participanteId },
    });

    res.json({
      mensaje: `El participante "${participante.nombre}" fue retirado del sorteo.`,
    });
  } catch (error) {
    console.error('Error al retirar participante:', error);
    res.status(500).json({ error: 'Error interno al retirar al participante.' });
  }
});

// Ejecutar el sorteo con transacción de base de datos y bloqueo contra ejecuciones simultáneas
router.post('/:id/ejecutar', async (req: Request, res: Response): Promise<void> => {
  try {
    const sorteoId = Number(req.params.id);
    if (isNaN(sorteoId)) {
      res.status(400).json({ error: 'Identificador de sorteo inválido.' });
      return;
    }

    const resultado = await prisma.$transaction(
      async (tx) => {
        const filasSorteo = await tx.$queryRaw<
          Array<{ id: number; administrador_id: number; estado: string; nombre: string }>
        >`SELECT id, administrador_id, estado, nombre FROM sorteos WHERE id = ${sorteoId} FOR UPDATE`;

        if (!filasSorteo || filasSorteo.length === 0) {
          throw { status: 404, message: 'Sorteo no encontrado.' };
        }

        const sorteoActual = filasSorteo[0];
        if (sorteoActual.administrador_id !== req.admin!.adminId) {
          throw { status: 403, message: 'No tienes permiso para ejecutar este sorteo.' };
        }

        if (sorteoActual.estado === 'SORTEO_REALIZADO') {
          throw {
            status: 409,
            message: 'Este sorteo ya fue realizado anteriormente y no puede ejecutarse más de una vez.',
          };
        }

        const asignacionesExistentes = await tx.asignacion.count({
          where: { sorteo_id: sorteoId },
        });

        if (asignacionesExistentes > 0) {
          throw {
            status: 409,
            message: 'Ya existen asignaciones registradas para este sorteo.',
          };
        }

        if (sorteoActual.estado !== 'INSCRIPCIONES_CERRADAS') {
          throw {
            status: 400,
            message: 'Debes cerrar las inscripciones antes de realizar el sorteo.',
          };
        }

        const participantes = await tx.participante.findMany({
          where: { sorteo_id: sorteoId },
          select: { id: true },
          orderBy: { id: 'asc' },
        });

        if (participantes.length < 2) {
          throw {
            status: 400,
            message: 'Se requieren al menos 2 participantes registrados para realizar el sorteo.',
          };
        }

        const ids = participantes.map((p) => p.id);
        const paresAsignacion = generarAsignacionesSinPuntosFijos(ids);

        await tx.asignacion.createMany({
          data: paresAsignacion.map((par) => ({
            sorteo_id: sorteoId,
            participante_origen_id: par.participante_origen_id,
            participante_destino_id: par.participante_destino_id,
          })),
        });

        const sorteoActualizado = await tx.sorteo.update({
          where: { id: sorteoId },
          data: { estado: 'SORTEO_REALIZADO' },
        });

        return {
          estado: sorteoActualizado.estado,
          totalAsignaciones: paresAsignacion.length,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }
    );

    res.json({
      mensaje: '🎉 ¡El sorteo se ha realizado con éxito! Las asignaciones secretas ya están listas para cada participante.',
      estado: resultado.estado,
      total_asignaciones: resultado.totalAsignaciones,
    });
  } catch (error: any) {
    if (error && typeof error.status === 'number') {
      res.status(error.status).json({ error: error.message });
      return;
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      res.status(409).json({
        error: 'El sorteo ya fue ejecutado o se detectó una solicitud simultánea.',
      });
      return;
    }
    console.error('Error al ejecutar sorteo:', error);
    res.status(500).json({
      error: 'Error interno al ejecutar el sorteo en la base de datos.',
    });
  }
});

// Reinicio administrativo explícito y confirmado
router.post('/:id/reiniciar', async (req: Request, res: Response): Promise<void> => {
  try {
    const sorteoId = Number(req.params.id);
    const { confirmacion } = req.body;

    if (confirmacion !== 'REINICIAR') {
      res.status(400).json({
        error: 'Debes confirmar explícitamente el reinicio administrativo enviando la palabra "REINICIAR".',
      });
      return;
    }

    const sorteo = await prisma.sorteo.findFirst({
      where: {
        id: sorteoId,
        administrador_id: req.admin!.adminId,
      },
    });

    if (!sorteo) {
      res.status(404).json({ error: 'Sorteo no encontrado.' });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.asignacion.deleteMany({
        where: { sorteo_id: sorteoId },
      });

      await tx.sorteo.update({
        where: { id: sorteoId },
        data: { estado: 'INSCRIPCIONES_ABIERTAS' },
      });
    });

    res.json({
      mensaje: 'El sorteo ha sido reiniciado. Se eliminaron las asignaciones anteriores y las inscripciones están abiertas nuevamente.',
      estado: 'INSCRIPCIONES_ABIERTAS',
    });
  } catch (error) {
    console.error('Error al reiniciar sorteo:', error);
    res.status(500).json({ error: 'Error interno al reiniciar el sorteo.' });
  }
});

// Eliminar un sorteo por completo junto con todos sus participantes y asignaciones en MySQL
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const sorteoId = Number(req.params.id);
    if (isNaN(sorteoId)) {
      res.status(400).json({ error: 'Identificador de sorteo inválido.' });
      return;
    }

    const sorteo = await prisma.sorteo.findFirst({
      where: {
        id: sorteoId,
        administrador_id: req.admin!.adminId,
      },
    });

    if (!sorteo) {
      res.status(404).json({
        error: 'Sorteo no encontrado o no tienes permisos para eliminarlo.',
      });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.asignacion.deleteMany({
        where: { sorteo_id: sorteoId },
      });

      await tx.participante.deleteMany({
        where: { sorteo_id: sorteoId },
      });

      await tx.sorteo.delete({
        where: { id: sorteoId },
      });
    });

    res.json({
      mensaje: `El sorteo "${sorteo.nombre}" (${sorteo.codigo_unico}), sus participantes y sus asignaciones fueron eliminados definitivamente de la base de datos.`,
    });
  } catch (error) {
    console.error('Error al eliminar sorteo:', error);
    res.status(500).json({
      error: 'Error interno al eliminar el sorteo de la base de datos.',
    });
  }
});

export default router;
