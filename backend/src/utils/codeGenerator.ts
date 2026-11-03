import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

/**
 * Genera un código único de sorteo con formato AMIGO + 3 o 4 caracteres alfanuméricos/numéricos,
 * por ejemplo: AMIGO482, verificando en MySQL que no exista previamente.
 */
export async function generarCodigoUnicoSorteo(prisma: PrismaClient): Promise<string> {
  const maxIntentos = 25;

  for (let i = 0; i < maxIntentos; i++) {
    // Primeros intentos: AMIGO + 3 dígitos (100 - 999), ej: AMIGO482
    const numero = i < 15
      ? crypto.randomInt(100, 1000).toString()
      : crypto.randomInt(1000, 10000).toString();
    const codigo = `AMIGO${numero}`;

    const existente = await prisma.sorteo.findUnique({
      where: { codigo_unico: codigo },
      select: { id: true },
    });

    if (!existente) {
      return codigo;
    }
  }

  // Fallback con sufijo hexadecimal criptográfico si hubiera alta colisión
  const sufijo = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `AMIGO${sufijo}`;
}

