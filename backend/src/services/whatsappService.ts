import dotenv from 'dotenv';

dotenv.config();

export interface DatosMensajeParticipante {
  nombre: string;
  telefono: string;
  codigoSorteo: string;
  nombreSorteo: string;
  enlaceResultado: string;
  consentimiento: boolean;
}

export interface ResultadoEnvioWhatsApp {
  modalidad: 'WA_ME_MANUAL' | 'CLOUD_API_OFICIAL';
  configurado: boolean;
  enviados: number;
  fallidos: number;
  enlacesManuales: Array<{
    nombre: string;
    telefono: string;
    waMeUrl: string;
  }>;
  mensajeEstado: string;
}

/**
 * Construye un enlace wa.me oficial para que el usuario o administrador confirme manualmente el envío en WhatsApp.
 * No envía ningún mensaje sin intervención humana.
 */
export function construirEnlaceWaMe(telefonoConPrefijo: string, textoMensaje: string): string {
  const digitos = telefonoConPrefijo.replace(/\D/g, '');
  const textoCodificado = encodeURIComponent(textoMensaje);
  return `https://wa.me/${digitos}?text=${textoCodificado}`;
}

/**
 * Construye el mensaje personalizado para notificar que el sorteo ya se realizó (sin revelar el amigo secreto en el mensaje,
 * invitando a ingresar con su PIN personal).
 */
export function construirTextoNotificacionSorteo(
  nombreParticipante: string,
  nombreSorteo: string,
  codigoSorteo: string,
  enlaceResultado: string
): string {
  return `🎁 ¡Hola, ${nombreParticipante}! Ya se realizó el sorteo de Amigo Secreto "${nombreSorteo}" (Código: ${codigoSorteo}). Ingresa a tu enlace privado con tu PIN para descubrir a quién te toca regalar: ${enlaceResultado} ¡Guarda el secreto! 🤫`;
}

/**
 * Integración con la API Oficial de WhatsApp Business Cloud (Meta).
 * Se ejecuta exclusivamente desde el backend con autorización del administrador y verificando el consentimiento de cada participante.
 * Si las credenciales de WhatsApp Business API no están configuradas en el servidor, NO simula envíos automáticos;
 * informa claramente el estado y devuelve los enlaces wa.me manuales verificados.
 */
export async function procesarNotificacionesWhatsApp(
  participantes: DatosMensajeParticipante[]
): Promise<ResultadoEnvioWhatsApp> {
  const apiHabilitada = process.env.WHATSAPP_API_ENABLED === 'true';
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const apiVersion = process.env.WHATSAPP_API_VERSION?.trim() || 'v20.0';

  const enlacesManuales = participantes
    .filter((p) => p.consentimiento)
    .map((p) => {
      const texto = construirTextoNotificacionSorteo(
        p.nombre,
        p.nombreSorteo,
        p.codigoSorteo,
        p.enlaceResultado
      );
      return {
        nombre: p.nombre,
        telefono: p.telefono,
        waMeUrl: construirEnlaceWaMe(p.telefono, texto),
      };
    });

  // Si no están configuradas las credenciales reales de WhatsApp Business Cloud API
  if (!apiHabilitada || !phoneNumberId || !accessToken) {
    return {
      modalidad: 'WA_ME_MANUAL',
      configurado: false,
      enviados: 0,
      fallidos: 0,
      enlacesManuales,
      mensajeEstado:
        'La API oficial de WhatsApp Business Cloud no tiene credenciales activas en el servidor (.env). No se realizaron envíos automáticos. Puedes utilizar los enlaces directos wa.me para enviar cada notificación confirmándola manualmente en WhatsApp.',
    };
  }

  // Envío real mediante WhatsApp Business Cloud API (Graph API de Meta)
  let enviados = 0;
  let fallidos = 0;
  const endpoint = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

  for (const p of participantes) {
    if (!p.consentimiento) continue;

    const texto = construirTextoNotificacionSorteo(
      p.nombre,
      p.nombreSorteo,
      p.codigoSorteo,
      p.enlaceResultado
    );
    const numeroDestino = p.telefono.replace(/\D/g, '');

    try {
      const respuesta = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: numeroDestino,
          type: 'text',
          text: {
            preview_url: true,
            body: texto,
          },
        }),
      });

      if (respuesta.ok) {
        enviados++;
      } else {
        fallidos++;
      }
    } catch {
      fallidos++;
    }
  }

  return {
    modalidad: 'CLOUD_API_OFICIAL',
    configurado: true,
    enviados,
    fallidos,
    enlacesManuales,
    mensajeEstado: `Envío mediante WhatsApp Business Cloud API completado: ${enviados} enviados, ${fallidos} fallidos.`,
  };
}

