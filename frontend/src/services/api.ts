import {
  cloudRegistrarAdmin,
  cloudLoginAdmin,
  cloudObtenerPerfilAdmin,
  cloudCrearSorteo,
  cloudListarMisSorteos,
  cloudObtenerDetalleSorteo,
  cloudCerrarInscripcionesSorteo,
  cloudReabrirInscripcionesSorteo,
  cloudRetirarParticipanteSorteo,
  cloudEjecutarSorteo,
  cloudReiniciarSorteoAdmin,
  cloudEliminarSorteoAdmin,
  cloudValidarCodigoSorteo,
  cloudRegistrarParticipante,
  cloudConsultarResultadoPrivado,
  cloudRecuperarMiAsignacionConToken,
} from './cloudDb';

export type EstadoSorteo =
  | 'INSCRIPCIONES_ABIERTAS'
  | 'INSCRIPCIONES_CERRADAS'
  | 'SORTEO_REALIZADO';

export interface Administrador {
  id: number;
  nombre: string;
  email: string;
  created_at: string;
}

export interface ParticipanteAdmin {
  id: number;
  nombre: string;
  created_at: string;
}

export interface SorteoResumen {
  id: number;
  nombre: string;
  codigo_unico: string;
  descripcion: string | null;
  fecha_evento: string;
  presupuesto: number | null;
  estado: EstadoSorteo;
  created_at?: string;
  total_participantes: number;
  participantes?: ParticipanteAdmin[];
}

export interface ResultadoPrivado {
  token?: string;
  sorteo: {
    nombre: string;
    codigo_unico: string;
    descripcion: string | null;
    fecha_evento: string;
    presupuesto: number | null;
  };
  participante: {
    nombre: string;
  };
  amigo_secreto: {
    nombre: string;
  };
}

const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const LOCAL_API_URL = 'http://localhost:4000/api';

/**
 * Ejecuta la petición en el backend local MySQL si estamos en localhost y el servidor está encendido;
 * si estamos en GitHub Pages o la laptop está apagada, utiliza automáticamente la Base de Datos en la Nube 24/7.
 */
async function withCloudFallback<T>(
  localCall: () => Promise<T>,
  cloudCall: () => Promise<T>
): Promise<T> {
  if (!isLocalhost) {
    return cloudCall();
  }

  try {
    return await localCall();
  } catch (err: any) {
    if (err && err.isNetworkError) {
      return cloudCall();
    }
    throw err;
  }
}

async function requestLocal<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${LOCAL_API_URL}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch {
    const netErr: any = new Error('Servidor local no disponible');
    netErr.isNetworkError = true;
    throw netErr;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Ocurrió un error al comunicarse con el servidor.');
  }

  return data as T;
}

// --- Endpoints de Autenticación de Administrador ---

export async function registrarAdmin(datos: {
  nombre: string;
  email: string;
  password: string;
}): Promise<{ mensaje: string; token: string; administrador: Administrador }> {
  return withCloudFallback(
    () =>
      requestLocal('/auth/register', {
        method: 'POST',
        body: JSON.stringify(datos),
      }),
    () => cloudRegistrarAdmin(datos)
  );
}

export async function loginAdmin(datos: {
  email: string;
  password: string;
}): Promise<{ mensaje: string; token: string; administrador: Administrador }> {
  return withCloudFallback(
    () =>
      requestLocal('/auth/login', {
        method: 'POST',
        body: JSON.stringify(datos),
      }),
    () => cloudLoginAdmin(datos)
  );
}

export async function obtenerPerfilAdmin(
  token: string
): Promise<{ administrador: Administrador }> {
  return withCloudFallback(
    () =>
      requestLocal('/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      }),
    () => cloudObtenerPerfilAdmin(token)
  );
}

// --- Endpoints de Administración de Sorteos ---

export async function crearSorteo(
  token: string,
  datos: {
    nombre: string;
    descripcion?: string;
    fecha_evento: string;
    presupuesto?: number | null;
  }
): Promise<{ mensaje: string; sorteo: SorteoResumen }> {
  return withCloudFallback(
    () =>
      requestLocal('/sorteos', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(datos),
      }),
    () => cloudCrearSorteo(token, datos)
  );
}

export async function listarMisSorteos(
  token: string
): Promise<{ sorteos: SorteoResumen[] }> {
  return withCloudFallback(
    () =>
      requestLocal('/sorteos', {
        headers: { Authorization: `Bearer ${token}` },
      }),
    () => cloudListarMisSorteos(token)
  );
}

export async function obtenerDetalleSorteo(
  token: string,
  sorteoId: number
): Promise<{ sorteo: SorteoResumen }> {
  return withCloudFallback(
    () =>
      requestLocal(`/sorteos/${sorteoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    () => cloudObtenerDetalleSorteo(token, sorteoId)
  );
}

export async function cerrarInscripcionesSorteo(
  token: string,
  sorteoId: number
): Promise<{ mensaje: string; estado: EstadoSorteo }> {
  return withCloudFallback(
    () =>
      requestLocal(`/sorteos/${sorteoId}/cerrar-inscripciones`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      }),
    () => cloudCerrarInscripcionesSorteo(token, sorteoId)
  );
}

export async function reabrirInscripcionesSorteo(
  token: string,
  sorteoId: number
): Promise<{ mensaje: string; estado: EstadoSorteo }> {
  return withCloudFallback(
    () =>
      requestLocal(`/sorteos/${sorteoId}/reabrir-inscripciones`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      }),
    () => cloudReabrirInscripcionesSorteo(token, sorteoId)
  );
}

export async function retirarParticipanteSorteo(
  token: string,
  sorteoId: number,
  participanteId: number
): Promise<{ mensaje: string }> {
  return withCloudFallback(
    () =>
      requestLocal(`/sorteos/${sorteoId}/participantes/${participanteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }),
    () => cloudRetirarParticipanteSorteo(token, sorteoId, participanteId)
  );
}

export async function ejecutarSorteo(
  token: string,
  sorteoId: number
): Promise<{ mensaje: string; estado: EstadoSorteo; total_asignaciones: number }> {
  return withCloudFallback(
    () =>
      requestLocal(`/sorteos/${sorteoId}/ejecutar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }),
    () => cloudEjecutarSorteo(token, sorteoId)
  );
}

export async function reiniciarSorteoAdmin(
  token: string,
  sorteoId: number
): Promise<{ mensaje: string; estado: EstadoSorteo }> {
  return withCloudFallback(
    () =>
      requestLocal(`/sorteos/${sorteoId}/reiniciar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ confirmacion: 'REINICIAR' }),
      }),
    () => cloudReiniciarSorteoAdmin(token, sorteoId)
  );
}

export async function eliminarSorteoAdmin(
  token: string,
  sorteoId: number
): Promise<{ mensaje: string }> {
  return withCloudFallback(
    () =>
      requestLocal(`/sorteos/${sorteoId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }),
    () => cloudEliminarSorteoAdmin(token, sorteoId)
  );
}

// --- Endpoints Públicos (Participantes y Resultados con Código + Nombre de Usuario + PIN) ---

export async function validarCodigoSorteo(
  codigo: string
): Promise<{ sorteo: SorteoResumen }> {
  return withCloudFallback(
    () => requestLocal(`/public/sorteos/codigo/${encodeURIComponent(codigo.trim().toUpperCase())}`),
    () => cloudValidarCodigoSorteo(codigo)
  );
}

export async function registrarParticipante(
  codigo: string,
  datos: {
    nombre: string;
    pin: string;
    confirmacion_pin: string;
  }
): Promise<{
  mensaje: string;
  detalle: string;
  participante: { id: number; nombre: string; created_at: string };
}> {
  return withCloudFallback(
    () =>
      requestLocal(`/public/sorteos/${encodeURIComponent(codigo.trim().toUpperCase())}/participantes`, {
        method: 'POST',
        body: JSON.stringify(datos),
      }),
    () => cloudRegistrarParticipante(codigo, datos)
  );
}

export async function consultarResultadoPrivado(datos: {
  codigo: string;
  nombre: string;
  pin: string;
}): Promise<ResultadoPrivado> {
  return withCloudFallback(
    () =>
      requestLocal('/public/resultado/consultar', {
        method: 'POST',
        body: JSON.stringify(datos),
      }),
    () => cloudConsultarResultadoPrivado(datos)
  );
}

export async function recuperarMiAsignacionConToken(
  participantToken: string
): Promise<ResultadoPrivado> {
  return withCloudFallback(
    () =>
      requestLocal('/public/resultado/mi-asignacion', {
        headers: { Authorization: `Bearer ${participantToken}` },
      }),
    () => cloudRecuperarMiAsignacionConToken(participantToken)
  );
}

// --- Utilidades de Enlaces para Compartir ---

export function obtenerBaseUrlFrontend(): string {
  const { origin, pathname } = window.location;
  return `${origin}${pathname.replace(/\/$/, '')}`;
}

export function construirEnlaceInvitacion(codigo: string): string {
  const base = obtenerBaseUrlFrontend();
  return `${base}/#/unirse?codigo=${encodeURIComponent(codigo.trim().toUpperCase())}`;
}

export function construirEnlaceResultado(codigo: string): string {
  const base = obtenerBaseUrlFrontend();
  return `${base}/#/resultado?codigo=${encodeURIComponent(codigo.trim().toUpperCase())}`;
}

export function generarUrlWhatsAppCompartirInvitacion(
  nombreSorteo: string,
  codigo: string,
  enlaceInvitacion: string
): string {
  const mensaje = `🎄 ¡Hola! Te invito a participar en nuestro sorteo de *Amigo Secreto*: "${nombreSorteo}" 🎁\n\n🔑 Código del sorteo: *${codigo}*\n👉 Regístrate aquí con tu nombre de usuario y tu PIN: ${enlaceInvitacion}`;
  return `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
}

export function generarUrlWhatsAppCompartirResultados(
  nombreSorteo: string,
  codigo: string,
  enlaceResultado: string
): string {
  const mensaje = `🎉 ¡Ya se realizó el sorteo de *Amigo Secreto*: "${nombreSorteo}"! 🎁\n\n🔑 Código del sorteo: *${codigo}*\n👉 Ingresa con tu nombre de usuario y tu PIN de 6 dígitos para descubrir a quién te toca regalar: ${enlaceResultado}\n🤫 ¡Guarda el secreto!`;
  return `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
}
