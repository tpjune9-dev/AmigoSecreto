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
  telefono: string;
  consentimiento: boolean;
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

export interface RespuestaNotificacionWhatsApp {
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

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/$/, '');

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

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
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(datos),
  });
}

export async function loginAdmin(datos: {
  email: string;
  password: string;
}): Promise<{ mensaje: string; token: string; administrador: Administrador }> {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(datos),
  });
}

export async function obtenerPerfilAdmin(
  token: string
): Promise<{ administrador: Administrador }> {
  return request('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
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
  return request('/sorteos', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(datos),
  });
}

export async function listarMisSorteos(
  token: string
): Promise<{ sorteos: SorteoResumen[] }> {
  return request('/sorteos', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function obtenerDetalleSorteo(
  token: string,
  sorteoId: number
): Promise<{ sorteo: SorteoResumen }> {
  return request(`/sorteos/${sorteoId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function cerrarInscripcionesSorteo(
  token: string,
  sorteoId: number
): Promise<{ mensaje: string; estado: EstadoSorteo }> {
  return request(`/sorteos/${sorteoId}/cerrar-inscripciones`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function reabrirInscripcionesSorteo(
  token: string,
  sorteoId: number
): Promise<{ mensaje: string; estado: EstadoSorteo }> {
  return request(`/sorteos/${sorteoId}/reabrir-inscripciones`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function retirarParticipanteSorteo(
  token: string,
  sorteoId: number,
  participanteId: number
): Promise<{ mensaje: string }> {
  return request(`/sorteos/${sorteoId}/participantes/${participanteId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function ejecutarSorteo(
  token: string,
  sorteoId: number
): Promise<{ mensaje: string; estado: EstadoSorteo; total_asignaciones: number }> {
  return request(`/sorteos/${sorteoId}/ejecutar`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function reiniciarSorteoAdmin(
  token: string,
  sorteoId: number
): Promise<{ mensaje: string; estado: EstadoSorteo }> {
  return request(`/sorteos/${sorteoId}/reiniciar`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ confirmacion: 'REINICIAR' }),
  });
}

export async function prepararNotificacionesWhatsApp(
  token: string,
  sorteoId: number,
  baseUrl: string
): Promise<RespuestaNotificacionWhatsApp> {
  return request(`/sorteos/${sorteoId}/notificar-whatsapp`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ baseUrl }),
  });
}

// --- Endpoints Públicos (Participantes y Resultados) ---

export async function validarCodigoSorteo(
  codigo: string
): Promise<{ sorteo: SorteoResumen }> {
  return request(`/public/sorteos/codigo/${encodeURIComponent(codigo.trim().toUpperCase())}`);
}

export async function registrarParticipante(
  codigo: string,
  datos: {
    nombre: string;
    telefono: string;
    pin: string;
    confirmacion_pin: string;
    consentimiento: boolean;
  }
): Promise<{
  mensaje: string;
  detalle: string;
  participante: { id: number; nombre: string; created_at: string };
}> {
  return request(`/public/sorteos/${encodeURIComponent(codigo.trim().toUpperCase())}/participantes`, {
    method: 'POST',
    body: JSON.stringify(datos),
  });
}

export async function consultarResultadoPrivado(datos: {
  codigo: string;
  telefono: string;
  pin: string;
}): Promise<ResultadoPrivado> {
  return request('/public/resultado/consultar', {
    method: 'POST',
    body: JSON.stringify(datos),
  });
}

export async function recuperarMiAsignacionConToken(
  participantToken: string
): Promise<ResultadoPrivado> {
  return request('/public/resultado/mi-asignacion', {
    headers: { Authorization: `Bearer ${participantToken}` },
  });
}

// --- Utilidades de Enlaces y WhatsApp (Modalidad wa.me) ---

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
  const mensaje = `🎄 ¡Hola! Te invito a participar en nuestro sorteo de *Amigo Secreto*: "${nombreSorteo}" 🎁\n\n🔑 Código del sorteo: *${codigo}*\n👉 Regístrate aquí desde tu celular: ${enlaceInvitacion}`;
  return `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
}

export function generarUrlWhatsAppParticipanteDirecto(
  telefono: string,
  nombreParticipante: string,
  nombreSorteo: string,
  codigo: string,
  enlaceResultado: string
): string {
  const digitos = telefono.replace(/\D/g, '');
  const mensaje = `🎁 ¡Hola, ${nombreParticipante}! Ya se realizó el sorteo de Amigo Secreto "${nombreSorteo}" (Código: *${codigo}*). Ingresa a tu enlace privado con tu PIN personal para descubrir a quién te toca regalar: ${enlaceResultado} ¡Guarda el secreto! 🤫`;
  return `https://wa.me/${digitos}?text=${encodeURIComponent(mensaje)}`;
}

