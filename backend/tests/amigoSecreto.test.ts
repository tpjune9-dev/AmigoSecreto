import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/prisma';
import { generarAsignacionesSinPuntosFijos } from '../src/utils/drawAlgorithm';

describe('Suite de Pruebas Automatizadas — Amigo Secreto (Algoritmo + API + MySQL)', () => {
  let adminToken = '';
  let sorteoId = 0;
  let codigoSorteo = '';
  const testEmail = `admin_test_${Date.now()}@amigosecreto.pe`;

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    // Limpiar datos de prueba creados por este administrador
    if (testEmail) {
      await prisma.administrador.deleteMany({
        where: { email: testEmail },
      });
    }
    await prisma.$disconnect();
  });

  describe('1. Algoritmo de Sorteo Criptográfico (Permutación sin puntos fijos)', () => {
    const tamanos = [2, 3, 5, 10, 20, 35];

    it.each(tamanos)(
      'debe asignar correctamente con %i participantes sin que nadie se asigne a sí mismo ni se repitan destinatarios',
      (cantidad) => {
        const ids = Array.from({ length: cantidad }, (_, i) => i + 101);

        // Ejecutar múltiples iteraciones para comprobar consistencia estadística
        for (let iter = 0; iter < 25; iter++) {
          const asignaciones = generarAsignacionesSinPuntosFijos(ids);

          expect(asignaciones).toHaveLength(cantidad);

          const origenes = new Set<number>();
          const destinos = new Set<number>();

          for (const par of asignaciones) {
            // Regla: Nadie puede regalarse a sí mismo
            expect(par.participante_origen_id).not.toBe(par.participante_destino_id);
            origenes.add(par.participante_origen_id);
            destinos.add(par.participante_destino_id);
          }

          // Regla: Todos regalan exactamente una vez y ningún destinatario se repite
          expect(origenes.size).toBe(cantidad);
          expect(destinos.size).toBe(cantidad);

          for (const id of ids) {
            expect(origenes.has(id)).toBe(true);
            expect(destinos.has(id)).toBe(true);
          }
        }
      }
    );
  });

  describe('2. Flujo Completo en Base de Datos MySQL y Seguridad de Endpoints', () => {
    it('debe registrar un administrador y crear un sorteo con código único', async () => {
      const regRes = await request(app).post('/api/auth/register').send({
        nombre: 'Organizador de Prueba',
        email: testEmail,
        password: 'PasswordSeguro123!',
      });

      expect(regRes.status).toBe(201);
      expect(regRes.body.token).toBeDefined();
      adminToken = regRes.body.token;

      const sorteoRes = await request(app)
        .post('/api/sorteos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Sorteo Navideño de Prueba',
          descripcion: 'Intercambio de prueba automatizada',
          fecha_evento: '2026-12-24',
          presupuesto: 60,
        });

      expect(sorteoRes.status).toBe(201);
      expect(sorteoRes.body.sorteo.codigo_unico).toMatch(/^AMIGO/);
      sorteoId = sorteoRes.body.sorteo.id;
      codigoSorteo = sorteoRes.body.sorteo.codigo_unico;
    });

    it('debe rechazar códigos de sorteo inválidos o inexistentes', async () => {
      const resInexistente = await request(app).get('/api/public/sorteos/codigo/AMIGO000');
      expect(resInexistente.status).toBe(404);
      expect(resInexistente.body.error).toContain('no existe');

      const resFormatoInvalido = await request(app).get('/api/public/sorteos/codigo/AB');
      expect(resFormatoInvalido.status).toBe(400);
    });

    it('debe registrar participantes válidos y rechazar registros con teléfonos duplicados en el mismo sorteo', async () => {
      const participantesData = [
        { nombre: 'Carlos Huamán', telefono: '+51987111111', pin: '123456' },
        { nombre: 'Lucía Paredes', telefono: '+51987222222', pin: '234567' },
        { nombre: 'Jorge Quispe', telefono: '+51987333333', pin: '345678' },
        { nombre: 'Elena Vargas', telefono: '+51987444444', pin: '456789' },
      ];

      for (const p of participantesData) {
        const res = await request(app)
          .post(`/api/public/sorteos/${codigoSorteo}/participantes`)
          .send({
            nombre: p.nombre,
            telefono: p.telefono,
            pin: p.pin,
            confirmacion_pin: p.pin,
            consentimiento: true,
          });
        expect(res.status).toBe(201);
        expect(res.body.mensaje).toBe('¡Te registraste correctamente! 🎉');
      }

      // Intentar duplicar el teléfono de Carlos en el mismo sorteo
      const dupRes = await request(app)
        .post(`/api/public/sorteos/${codigoSorteo}/participantes`)
        .send({
          nombre: 'Carlos Duplicado',
          telefono: '987111111', // Normaliza a +51987111111
          pin: '999999',
          confirmacion_pin: '999999',
          consentimiento: true,
        });

      expect(dupRes.status).toBe(409);
      expect(dupRes.body.error).toContain('ya se encuentra registrado');
    });

    it('debe exigir cerrar inscripciones antes de ejecutar el sorteo y no permitir ejecutar el sorteo dos veces', async () => {
      // Intento con inscripciones aún abiertas -> debe fallar con 400
      const intentoAbierto = await request(app)
        .post(`/api/sorteos/${sorteoId}/ejecutar`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(intentoAbierto.status).toBe(400);

      // Cerrar inscripciones
      const cerrarRes = await request(app)
        .patch(`/api/sorteos/${sorteoId}/cerrar-inscripciones`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(cerrarRes.status).toBe(200);
      expect(cerrarRes.body.estado).toBe('INSCRIPCIONES_CERRADAS');

      // Ejecutar sorteo por primera vez -> éxito (200)
      const ejecucion1 = await request(app)
        .post(`/api/sorteos/${sorteoId}/ejecutar`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(ejecucion1.status).toBe(200);
      expect(ejecucion1.body.estado).toBe('SORTEO_REALIZADO');
      expect(ejecucion1.body.total_asignaciones).toBe(4);

      // Intentar ejecutar el sorteo por segunda vez -> debe ser rechazado con 409
      const ejecucion2 = await request(app)
        .post(`/api/sorteos/${sorteoId}/ejecutar`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(ejecucion2.status).toBe(409);

      // Verificar en MySQL que nadie se asignó a sí mismo y que todos tienen exactamente 1 asignación única
      const asignacionesBd = await prisma.asignacion.findMany({
        where: { sorteo_id: sorteoId },
      });
      expect(asignacionesBd).toHaveLength(4);

      const origenes = new Set(asignacionesBd.map((a) => a.participante_origen_id));
      const destinos = new Set(asignacionesBd.map((a) => a.participante_destino_id));
      expect(origenes.size).toBe(4);
      expect(destinos.size).toBe(4);

      for (const a of asignacionesBd) {
        expect(a.participante_origen_id).not.toBe(a.participante_destino_id);
      }
    });

    it('debe permitir que cada participante consulte únicamente su propio resultado y rechazar intentos de ver resultados ajenos', async () => {
      // 1. Intento de consultar con PIN equivocado (suplantación solo con teléfono) -> 401
      const intentoPinFalso = await request(app).post('/api/public/resultado/consultar').send({
        codigo: codigoSorteo,
        telefono: '+51987111111',
        pin: '000000',
      });
      expect(intentoPinFalso.status).toBe(401);

      // 2. Consulta legítima de Carlos con su teléfono y PIN correcto
      const consultaCarlos = await request(app).post('/api/public/resultado/consultar').send({
        codigo: codigoSorteo,
        telefono: '+51987111111',
        pin: '123456',
      });
      expect(consultaCarlos.status).toBe(200);
      expect(consultaCarlos.body.participante.nombre).toBe('Carlos Huamán');
      expect(consultaCarlos.body.amigo_secreto.nombre).toBeDefined();
      expect(consultaCarlos.body.amigo_secreto.nombre).not.toBe('Carlos Huamán');

      const tokenCarlos = consultaCarlos.body.token;
      expect(tokenCarlos).toBeDefined();

      // 3. Intentar usar el token de Carlos manipulando el query param ?participanteId=999999 -> 403
      const intentoSuplantacionUrl = await request(app)
        .get('/api/public/resultado/mi-asignacion?participanteId=999999')
        .set('Authorization', `Bearer ${tokenCarlos}`);
      expect(intentoSuplantacionUrl.status).toBe(403);

      // 4. Verificar que el endpoint público del sorteo y el panel del administrador NO expongan asignaciones secretas
      const publicInfo = await request(app).get(`/api/public/sorteos/codigo/${codigoSorteo}`);
      expect(publicInfo.status).toBe(200);
      expect(publicInfo.body.sorteo.asignaciones).toBeUndefined();
      expect(publicInfo.body.sorteo.participantes).toBeUndefined();

      const adminInfo = await request(app)
        .get(`/api/sorteos/${sorteoId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminInfo.status).toBe(200);
      expect(adminInfo.body.sorteo.asignaciones).toBeUndefined();
    });
  });
});
