import crypto from 'crypto';

export interface ParAsignacion {
  participante_origen_id: number;
  participante_destino_id: number;
}

/**
 * Genera una permutación aleatoria sin puntos fijos (derangement)
 * utilizando aleatoriedad criptográficamente segura (crypto.randomInt).
 *
 * Garantiza que:
 * 1. Cada participante regala exactamente a 1 persona.
 * 2. Nadie se regala a sí mismo (origen !== destino).
 * 3. Cada persona recibe exactamente 1 regalo.
 * 4. Ningún destinatario se repite.
 * 5. Funciona con 2, 3, 5, 10, 20 o más participantes.
 */
export function generarAsignacionesSinPuntosFijos(participanteIds: number[]): ParAsignacion[] {
  const n = participanteIds.length;
  if (n < 2) {
    throw new Error('Se requieren al menos 2 participantes para realizar el sorteo.');
  }

  // Verificar que los IDs de entrada sean únicos
  const idsUnicos = new Set(participanteIds);
  if (idsUnicos.size !== n) {
    throw new Error('La lista de participantes contiene identificadores duplicados.');
  }

  // Caso N = 2: única permutación sin puntos fijos posible
  if (n === 2) {
    return [
      { participante_origen_id: participanteIds[0], participante_destino_id: participanteIds[1] },
      { participante_origen_id: participanteIds[1], participante_destino_id: participanteIds[0] },
    ];
  }

  // Muestreo por rechazo con Fisher-Yates criptográfico para obtener una permutación sin puntos fijos uniforme
  const maxIntentos = 100;
  for (let intento = 0; intento < maxIntentos; intento++) {
    const destinos = [...participanteIds];

    for (let i = n - 1; i > 0; i--) {
      const j = crypto.randomInt(0, i + 1);
      const temp = destinos[i];
      destinos[i] = destinos[j];
      destinos[j] = temp;
    }

    let tienePuntoFijo = false;
    for (let i = 0; i < n; i++) {
      if (destinos[i] === participanteIds[i]) {
        tienePuntoFijo = true;
        break;
      }
    }

    if (!tienePuntoFijo) {
      return participanteIds.map((origenId, idx) => ({
        participante_origen_id: origenId,
        participante_destino_id: destinos[idx],
      }));
    }
  }

  // Fallback garantizado en 1 pasada: Algoritmo de Sattolo (ciclo aleatorio sin puntos fijos)
  const destinos = [...participanteIds];
  for (let i = n - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i); // 0 <= j < i garantiza ningún punto fijo
    const temp = destinos[i];
    destinos[i] = destinos[j];
    destinos[j] = temp;
  }

  return participanteIds.map((origenId, idx) => ({
    participante_origen_id: origenId,
    participante_destino_id: destinos[idx],
  }));
}

