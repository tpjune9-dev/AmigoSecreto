import bcrypt from 'bcryptjs';
import {
  Administrador,
  EstadoSorteo,
  ParticipanteAdmin,
  ResultadoPrivado,
  SorteoResumen,
} from './api';

const CLOUD_KV_BASE = 'https://keyvalue.immanuel.co/api/KeyVal';
const CLOUD_APP_KEY = 'ne2qcuhv';
const CHUNK_SIZE = 1100;

interface CloudAdminRecord {
  id: number;
  nombre: string;
  email: string;
  password_hash: string;
  created_at: string;
  codigos: string[];
}

interface CloudParticipanteRecord {
  id: number;
  sorteo_id: number;
  nombre: string;
  pin_hash: string;
  created_at: string;
}

interface CloudAsignacionRecord {
  id: number;
  sorteo_id: number;
  participante_origen_id: number;
  participante_destino_id: number;
  created_at: string;
}

interface CloudSorteoBundle {
  id: number;
  administrador_id: number;
  nombre: string;
  codigo_unico: string;
  descripcion: string | null;
  fecha_evento: string;
  presupuesto: number | null;
  estado: EstadoSorteo;
  created_at: string;
  participantes: CloudParticipanteRecord[];
  asignaciones: CloudAsignacionRecord[];
}

interface TokenPayload {
  role: 'ADMIN' | 'PARTICIPANT';
  adminId?: number;
  email?: string;
  nombre?: string;
  participanteId?: number;
  sorteoId?: number;
  codigoSorteo?: string;
}

// --- Codificación UTF-8 <-> Base64URL segura ---

function toBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(b64url: string): string {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
  const binary = atob(b64 + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

function sanitizeKey(raw: string): string {
  return toBase64Url(raw.trim().toLowerCase()).slice(0, 48);
}

// --- Operaciones de lectura/escritura en la nube 24/7 con soporte de fragmentación ---

async function rawGetKey(key: string): Promise<string> {
  const res = await fetch(`${CLOUD_KV_BASE}/GetValue/${CLOUD_APP_KEY}/${encodeURIComponent(key)}`, {
    method: 'GET',
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error('Error de red al consultar almacenamiento en la nube.');
  }
  const text = await res.text();
  try {
    const parsed = JSON.parse(text);
    return typeof parsed === 'string' ? parsed : '';
  } catch {
    return text.replace(/^"|"$/g, '');
  }
}

async function rawSetKey(key: string, val: string): Promise<void> {
  const url = `${CLOUD_KV_BASE}/UpdateValue/${CLOUD_APP_KEY}/${encodeURIComponent(
    key
  )}?value=${encodeURIComponent(val)}`;
  const res = await fetch(url, {
    method: 'POST',
  });
  if (!res.ok) {
    throw new Error('Error de red al guardar en almacenamiento en la nube.');
  }
}

export async function cloudGet<T>(key: string): Promise<T | null> {
  const raw = await rawGetKey(key);
  if (!raw || raw === 'EMPTY') return null;

  let fullB64 = raw;
  if (raw.startsWith('CHUNKS_')) {
    const count = Number(raw.slice(7));
    if (isNaN(count) || count <= 0) return null;
    const chunkPromises: Promise<string>[] = [];
    for (let i = 0; i < count; i++) {
      chunkPromises.push(rawGetKey(`${key}_c${i}`));
    }
    const chunks = await Promise.all(chunkPromises);
    fullB64 = chunks.join('');
  }

  try {
    const jsonStr = fromBase64Url(fullB64);
    return JSON.parse(jsonStr) as T;
  } catch {
    return null;
  }
}

export async function cloudSet<T>(key: string, value: T | null): Promise<void> {
  if (value === null) {
    await rawSetKey(key, 'EMPTY');
    return;
  }

  const jsonStr = JSON.stringify(value);
  const b64 = toBase64Url(jsonStr);

  if (b64.length <= CHUNK_SIZE) {
    await rawSetKey(key, b64);
    return;
  }

  const chunks: string[] = [];
  for (let i = 0; i < b64.length; i += CHUNK_SIZE) {
    chunks.push(b64.slice(i, i + CHUNK_SIZE));
  }

  await Promise.all(chunks.map((chunk, idx) => rawSetKey(`${key}_c${idx}`, chunk)));
  await rawSetKey(key, `CHUNKS_${chunks.length}`);
}

// --- Tokens compatibles con JWT y Cloud ---

function createCloudToken(payload: TokenPayload): string {
  const header = toBase64Url(JSON.stringify({ alg: 'CLOUD', typ: 'JWT' }));
  const body = toBase64Url(JSON.stringify({ ...payload, exp: Date.now() + 7 * 86400_000 }));
  return `${header}.${body}.cloudsig`;
}

function parseToken(token: string): TokenPayload {
  const parts = token.split('.');
  const bodyPart = parts.length >= 2 ? parts[1] : parts[0];
  try {
    return JSON.parse(fromBase64Url(bodyPart)) as TokenPayload;
  } catch {
    throw new Error('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
  }
}

// --- Aleatoriedad criptográfica en navegador ---

function cryptoRandomInt(min: number, max: number): number {
  const range = max - min;
  const array = new Uint32Array(1);
  window.crypto.getRandomValues(array);
  return min + (array[0] % range);
}

function generarDerangementCriptografico(ids: number[]): Array<{
  participante_origen_id: number;
  participante_destino_id: number;
}> {
  const n = ids.length;
  if (n < 2) {
    throw new Error('Se requieren al menos 2 participantes para realizar el sorteo.');
  }
  if (n === 2) {
    return [
      { participante_origen_id: ids[0], participante_destino_id: ids[1] },
      { participante_origen_id: ids[1], participante_destino_id: ids[0] },
    ];
  }

  for (let intento = 0; intento < 100; intento++) {
    const destinos = [...ids];
    for (let i = n - 1; i > 0; i--) {
      const j = cryptoRandomInt(0, i + 1);
      const tmp = destinos[i];
      destinos[i] = destinos[j];
      destinos[j] = tmp;
    }
    if (destinos.every((destId, idx) => destId !== ids[idx])) {
      return ids.map((origenId, idx) => ({
        participante_origen_id: origenId,
        participante_destino_id: destinos[idx],
      }));
    }
  }

  // Fallback Sattolo (1 ciclo sin puntos fijos)
  const destinos = [...ids];
  for (let i = n - 1; i > 0; i--) {
    const j = cryptoRandomInt(0, i);
    const tmp = destinos[i];
    destinos[i] = destinos[j];
    destinos[j] = tmp;
  }
  return ids.map((origenId, idx) => ({
    participante_origen_id: origenId,
    participante_destino_id: destinos[idx],
  }));
}

function resumenDeBundle(b: CloudSorteoBundle, incluirParticipantes = false): SorteoResumen {
  return {
    id: b.id,
    nombre: b.nombre,
    codigo_unico: b.codigo_unico,
    descripcion: b.descripcion,
    fecha_evento: b.fecha_evento,
    presupuesto: b.presupuesto,
    estado: b.estado,
    created_at: b.created_at,
    total_participantes: b.participantes.length,
    ...(incluirParticipantes
      ? {
          participantes: b.participantes.map(
            (p): ParticipanteAdmin => ({
              id: p.id,
              nombre: p.nombre,
              created_at: p.created_at,
            })
          ),
        }
      : {}),
  };
}

// --- Funciones públicas del motor Cloud 24/7 ---

export async function cloudRegistrarAdmin(datos: {
  nombre: string;
  email: string;
  password: string;
}): Promise<{ mensaje: string; token: string; administrador: Administrador }> {
  const emailLimpio = datos.email.trim().toLowerCase();
  const nombreLimpio = datos.nombre.trim();

  if (nombreLimpio.length < 2) {
    throw new Error('El nombre debe tener al menos 2 caracteres.');
  }
  if (datos.password.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres.');
  }

  const adminKey = `adm_${sanitizeKey(emailLimpio)}`;
  const existente = await cloudGet<CloudAdminRecord>(adminKey);
  if (existente) {
    throw new Error('Ya existe una cuenta de administrador registrada con este correo electrónico.');
  }

  const password_hash = await bcrypt.hash(datos.password, 10);
  const nuevoAdmin: CloudAdminRecord = {
    id: Date.now(),
    nombre: nombreLimpio,
    email: emailLimpio,
    password_hash,
    created_at: new Date().toISOString(),
    codigos: [],
  };

  await cloudSet(adminKey, nuevoAdmin);
  await cloudSet(`admid_${nuevoAdmin.id}`, emailLimpio);

  const token = createCloudToken({
    role: 'ADMIN',
    adminId: nuevoAdmin.id,
    email: nuevoAdmin.email,
    nombre: nuevoAdmin.nombre,
  });

  return {
    mensaje: 'Cuenta de administrador creada exitosamente.',
    token,
    administrador: {
      id: nuevoAdmin.id,
      nombre: nuevoAdmin.nombre,
      email: nuevoAdmin.email,
      created_at: nuevoAdmin.created_at,
    },
  };
}

export async function cloudLoginAdmin(datos: {
  email: string;
  password: string;
}): Promise<{ mensaje: string; token: string; administrador: Administrador }> {
  const emailLimpio = datos.email.trim().toLowerCase();
  const adminKey = `adm_${sanitizeKey(emailLimpio)}`;
  const admin = await cloudGet<CloudAdminRecord>(adminKey);

  if (!admin) {
    throw new Error('Correo electrónico o contraseña incorrectos.');
  }

  const valido = await bcrypt.compare(datos.password, admin.password_hash);
  if (!valido) {
    throw new Error('Correo electrónico o contraseña incorrectos.');
  }

  const token = createCloudToken({
    role: 'ADMIN',
    adminId: admin.id,
    email: admin.email,
    nombre: admin.nombre,
  });

  return {
    mensaje: 'Inicio de sesión exitoso.',
    token,
    administrador: {
      id: admin.id,
      nombre: admin.nombre,
      email: admin.email,
      created_at: admin.created_at,
    },
  };
}

export async function cloudObtenerPerfilAdmin(
  token: string
): Promise<{ administrador: Administrador }> {
  const payload = parseToken(token);
  if (payload.role !== 'ADMIN' || !payload.email) {
    throw new Error('No autorizado.');
  }

  const adminKey = `adm_${sanitizeKey(payload.email)}`;
  const admin = await cloudGet<CloudAdminRecord>(adminKey);
  if (!admin) {
    throw new Error('Administrador no encontrado.');
  }

  return {
    administrador: {
      id: admin.id,
      nombre: admin.nombre,
      email: admin.email,
      created_at: admin.created_at,
    },
  };
}

export async function cloudCrearSorteo(
  token: string,
  datos: {
    nombre: string;
    descripcion?: string;
    fecha_evento: string;
    presupuesto?: number | null;
  }
): Promise<{ mensaje: string; sorteo: SorteoResumen }> {
  const payload = parseToken(token);
  if (payload.role !== 'ADMIN' || !payload.email || !payload.adminId) {
    throw new Error('Debes iniciar sesión como administrador.');
  }

  const adminKey = `adm_${sanitizeKey(payload.email)}`;
  const admin = await cloudGet<CloudAdminRecord>(adminKey);
  if (!admin) {
    throw new Error('Sesión de administrador no válida.');
  }

  let codigoUnico = '';
  for (let i = 0; i < 20; i++) {
    const num = i < 12 ? cryptoRandomInt(100, 1000) : cryptoRandomInt(1000, 10000);
    const candidato = `AMIGO${num}`;
    const existe = await cloudGet<CloudSorteoBundle>(`srt_${candidato}`);
    if (!existe) {
      codigoUnico = candidato;
      break;
    }
  }
  if (!codigoUnico) {
    codigoUnico = `AMIGO${cryptoRandomInt(10000, 99999)}`;
  }

  const sorteoId = Date.now();
  const nuevoBundle: CloudSorteoBundle = {
    id: sorteoId,
    administrador_id: admin.id,
    nombre: datos.nombre.trim(),
    codigo_unico: codigoUnico,
    descripcion: datos.descripcion?.trim() || null,
    fecha_evento: new Date(datos.fecha_evento).toISOString(),
    presupuesto:
      datos.presupuesto !== undefined && datos.presupuesto !== null
        ? Number(datos.presupuesto)
        : null,
    estado: 'INSCRIPCIONES_ABIERTAS',
    created_at: new Date().toISOString(),
    participantes: [],
    asignaciones: [],
  };

  await cloudSet(`srt_${codigoUnico}`, nuevoBundle);
  await cloudSet(`sid_${sorteoId}`, codigoUnico);

  const codigosActualizados = [codigoUnico, ...(admin.codigos || []).filter((c) => c !== codigoUnico)];
  await cloudSet(adminKey, { ...admin, codigos: codigosActualizados });

  return {
    mensaje: '¡Sorteo creado exitosamente!',
    sorteo: resumenDeBundle(nuevoBundle),
  };
}

export async function cloudListarMisSorteos(
  token: string
): Promise<{ sorteos: SorteoResumen[] }> {
  const payload = parseToken(token);
  if (payload.role !== 'ADMIN' || !payload.email) {
    throw new Error('No autorizado.');
  }

  const adminKey = `adm_${sanitizeKey(payload.email)}`;
  const admin = await cloudGet<CloudAdminRecord>(adminKey);
  if (!admin || !admin.codigos || admin.codigos.length === 0) {
    return { sorteos: [] };
  }

  const bundles = await Promise.all(
    admin.codigos.map((cod) => cloudGet<CloudSorteoBundle>(`srt_${cod}`))
  );

  const sorteos = bundles
    .filter((b): b is CloudSorteoBundle => b !== null)
    .map((b) => resumenDeBundle(b));

  return { sorteos };
}

async function obtenerBundlePorId(
  token: string,
  sorteoId: number
): Promise<{ bundle: CloudSorteoBundle; admin: CloudAdminRecord; adminKey: string }> {
  const payload = parseToken(token);
  if (payload.role !== 'ADMIN' || !payload.email) {
    throw new Error('No autorizado.');
  }

  const adminKey = `adm_${sanitizeKey(payload.email)}`;
  const [admin, codigoDirecto] = await Promise.all([
    cloudGet<CloudAdminRecord>(adminKey),
    cloudGet<string>(`sid_${sorteoId}`),
  ]);

  if (!admin) {
    throw new Error('Administrador no encontrado.');
  }

  let codigo = codigoDirecto;
  if (!codigo && admin.codigos) {
    for (const c of admin.codigos) {
      const b = await cloudGet<CloudSorteoBundle>(`srt_${c}`);
      if (b && b.id === sorteoId) {
        codigo = c;
        break;
      }
    }
  }

  if (!codigo) {
    throw new Error('Sorteo no encontrado.');
  }

  const bundle = await cloudGet<CloudSorteoBundle>(`srt_${codigo}`);
  if (!bundle) {
    throw new Error('Sorteo no encontrado.');
  }

  return { bundle, admin, adminKey };
}

export async function cloudObtenerDetalleSorteo(
  token: string,
  sorteoId: number
): Promise<{ sorteo: SorteoResumen }> {
  const { bundle } = await obtenerBundlePorId(token, sorteoId);
  return { sorteo: resumenDeBundle(bundle, true) };
}

export async function cloudCerrarInscripcionesSorteo(
  token: string,
  sorteoId: number
): Promise<{ mensaje: string; estado: EstadoSorteo }> {
  const { bundle } = await obtenerBundlePorId(token, sorteoId);
  if (bundle.estado === 'SORTEO_REALIZADO') {
    throw new Error('El sorteo ya fue realizado.');
  }
  bundle.estado = 'INSCRIPCIONES_CERRADAS';
  await cloudSet(`srt_${bundle.codigo_unico}`, bundle);
  return {
    mensaje: 'Las inscripciones se han cerrado correctamente.',
    estado: bundle.estado,
  };
}

export async function cloudReabrirInscripcionesSorteo(
  token: string,
  sorteoId: number
): Promise<{ mensaje: string; estado: EstadoSorteo }> {
  const { bundle } = await obtenerBundlePorId(token, sorteoId);
  if (bundle.estado === 'SORTEO_REALIZADO') {
    throw new Error('No se pueden reabrir inscripciones porque el sorteo ya fue realizado.');
  }
  bundle.estado = 'INSCRIPCIONES_ABIERTAS';
  await cloudSet(`srt_${bundle.codigo_unico}`, bundle);
  return {
    mensaje: 'Las inscripciones están nuevamente abiertas.',
    estado: bundle.estado,
  };
}

export async function cloudRetirarParticipanteSorteo(
  token: string,
  sorteoId: number,
  participanteId: number
): Promise<{ mensaje: string }> {
  const { bundle } = await obtenerBundlePorId(token, sorteoId);
  if (bundle.estado === 'SORTEO_REALIZADO') {
    throw new Error('No se pueden retirar participantes después de haberse realizado el sorteo.');
  }
  const part = bundle.participantes.find((p) => p.id === participanteId);
  if (!part) {
    throw new Error('Participante no encontrado en este sorteo.');
  }
  bundle.participantes = bundle.participantes.filter((p) => p.id !== participanteId);
  await cloudSet(`srt_${bundle.codigo_unico}`, bundle);
  return {
    mensaje: `El participante "${part.nombre}" fue retirado del sorteo.`,
  };
}

export async function cloudEjecutarSorteo(
  token: string,
  sorteoId: number
): Promise<{ mensaje: string; estado: EstadoSorteo; total_asignaciones: number }> {
  const { bundle } = await obtenerBundlePorId(token, sorteoId);

  if (bundle.estado === 'SORTEO_REALIZADO' || bundle.asignaciones.length > 0) {
    throw new Error('Este sorteo ya fue realizado anteriormente y no puede ejecutarse más de una vez.');
  }
  if (bundle.estado !== 'INSCRIPCIONES_CERRADAS') {
    throw new Error('Debes cerrar las inscripciones antes de realizar el sorteo.');
  }
  if (bundle.participantes.length < 2) {
    throw new Error('Se requieren al menos 2 participantes registrados para realizar el sorteo.');
  }

  const ids = bundle.participantes.map((p) => p.id);
  const pares = generarDerangementCriptografico(ids);
  const ahora = new Date().toISOString();

  bundle.asignaciones = pares.map((par, index) => ({
    id: Date.now() + index,
    sorteo_id: bundle.id,
    participante_origen_id: par.participante_origen_id,
    participante_destino_id: par.participante_destino_id,
    created_at: ahora,
  }));
  bundle.estado = 'SORTEO_REALIZADO';

  await cloudSet(`srt_${bundle.codigo_unico}`, bundle);

  return {
    mensaje:
      '🎉 ¡El sorteo se ha realizado con éxito! Las asignaciones secretas ya están listas para cada participante.',
    estado: 'SORTEO_REALIZADO',
    total_asignaciones: bundle.asignaciones.length,
  };
}

export async function cloudReiniciarSorteoAdmin(
  token: string,
  sorteoId: number
): Promise<{ mensaje: string; estado: EstadoSorteo }> {
  const { bundle } = await obtenerBundlePorId(token, sorteoId);
  bundle.asignaciones = [];
  bundle.estado = 'INSCRIPCIONES_ABIERTAS';
  await cloudSet(`srt_${bundle.codigo_unico}`, bundle);
  return {
    mensaje:
      'El sorteo ha sido reiniciado. Se eliminaron las asignaciones anteriores y las inscripciones están abiertas nuevamente.',
    estado: 'INSCRIPCIONES_ABIERTAS',
  };
}

export async function cloudEliminarSorteoAdmin(
  token: string,
  sorteoId: number
): Promise<{ mensaje: string }> {
  const { bundle, admin, adminKey } = await obtenerBundlePorId(token, sorteoId);
  const codigo = bundle.codigo_unico;
  const nombreSorteo = bundle.nombre;

  await Promise.all([
    cloudSet(`srt_${codigo}`, null),
    cloudSet(`sid_${sorteoId}`, null),
    cloudSet(adminKey, {
      ...admin,
      codigos: (admin.codigos || []).filter((c) => c !== codigo),
    }),
  ]);

  return {
    mensaje: `El sorteo "${nombreSorteo}" fue eliminado.`,
  };
}

// --- Funciones públicas para Participantes ---

export async function cloudValidarCodigoSorteo(
  codigo: string
): Promise<{ sorteo: SorteoResumen }> {
  const limpio = codigo.trim().toUpperCase();
  if (limpio.length < 3 || limpio.length > 20) {
    throw new Error('El formato del código de sorteo no es válido.');
  }

  const bundle = await cloudGet<CloudSorteoBundle>(`srt_${limpio}`);
  if (!bundle) {
    throw new Error('El código del sorteo no existe. Verifica que esté bien escrito.');
  }

  return { sorteo: resumenDeBundle(bundle, false) };
}

export async function cloudRegistrarParticipante(
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
  const codigoLimpio = codigo.trim().toUpperCase();
  const nombreLimpio = datos.nombre.replace(/\s+/g, ' ').trim();

  if (nombreLimpio.length < 2) {
    throw new Error('Ingresa un nombre de usuario de al menos 2 caracteres.');
  }
  if (!/^\d{6}$/.test(datos.pin)) {
    throw new Error('El PIN personal debe tener exactamente 6 dígitos numéricos.');
  }
  if (datos.pin !== datos.confirmacion_pin) {
    throw new Error('El PIN y la confirmación del PIN no coinciden.');
  }

  const bundle = await cloudGet<CloudSorteoBundle>(`srt_${codigoLimpio}`);
  if (!bundle) {
    throw new Error('El código del sorteo no existe.');
  }

  if (bundle.estado !== 'INSCRIPCIONES_ABIERTAS') {
    throw new Error(
      bundle.estado === 'SORTEO_REALIZADO'
        ? 'Este sorteo ya fue realizado y no acepta nuevos participantes.'
        : 'Las inscripciones para este sorteo se encuentran cerradas.'
    );
  }

  const yaExiste = bundle.participantes.some(
    (p) => p.nombre.toLowerCase() === nombreLimpio.toLowerCase()
  );
  if (yaExiste) {
    throw new Error(
      'Este nombre de usuario ya está registrado en este sorteo. Por favor elige otro.'
    );
  }

  const pin_hash = await bcrypt.hash(datos.pin, 10);
  const nuevoParticipante: CloudParticipanteRecord = {
    id: Date.now() + cryptoRandomInt(1, 1000),
    sorteo_id: bundle.id,
    nombre: nombreLimpio,
    pin_hash,
    created_at: new Date().toISOString(),
  };

  // Re-leer justo antes de guardar para minimizar colisiones concurrentes
  const bundleFresco = (await cloudGet<CloudSorteoBundle>(`srt_${codigoLimpio}`)) || bundle;
  if (
    bundleFresco.participantes.some(
      (p) => p.nombre.toLowerCase() === nombreLimpio.toLowerCase()
    )
  ) {
    throw new Error(
      'Este nombre de usuario ya está registrado en este sorteo. Por favor elige otro.'
    );
  }

  bundleFresco.participantes.push(nuevoParticipante);
  await cloudSet(`srt_${codigoLimpio}`, bundleFresco);

  return {
    mensaje: '¡Te registraste correctamente! 🎉',
    detalle:
      'Podrás consultar tu asignación con el código del sorteo, tu nombre de usuario y tu PIN cuando el administrador realice el sorteo.',
    participante: {
      id: nuevoParticipante.id,
      nombre: nuevoParticipante.nombre,
      created_at: nuevoParticipante.created_at,
    },
  };
}

export async function cloudConsultarResultadoPrivado(datos: {
  codigo: string;
  nombre: string;
  pin: string;
}): Promise<ResultadoPrivado> {
  const codigoLimpio = datos.codigo.trim().toUpperCase();
  const nombreLimpio = datos.nombre.replace(/\s+/g, ' ').trim();

  const bundle = await cloudGet<CloudSorteoBundle>(`srt_${codigoLimpio}`);
  if (!bundle) {
    throw new Error('El código del sorteo ingresado no existe.');
  }

  const participante = bundle.participantes.find(
    (p) => p.nombre.toLowerCase() === nombreLimpio.toLowerCase()
  );
  if (!participante) {
    throw new Error(
      'Credenciales incorrectas. Verifica el código del sorteo, tu nombre de usuario y tu PIN personal.'
    );
  }

  const pinValido = await bcrypt.compare(datos.pin, participante.pin_hash);
  if (!pinValido) {
    throw new Error(
      'Credenciales incorrectas. Verifica el código del sorteo, tu nombre de usuario y tu PIN personal.'
    );
  }

  if (bundle.estado !== 'SORTEO_REALIZADO') {
    throw new Error(
      'Tus credenciales son válidas, pero el administrador aún no ha realizado el sorteo. ¡Vuelve a consultar cuando el sorteo haya finalizado!'
    );
  }

  const asignacion = bundle.asignaciones.find(
    (a) => a.participante_origen_id === participante.id
  );
  const destino = bundle.participantes.find(
    (p) => p.id === asignacion?.participante_destino_id
  );

  if (!asignacion || !destino) {
    throw new Error('No se encontró una asignación para tu registro en este sorteo.');
  }

  const token = createCloudToken({
    role: 'PARTICIPANT',
    participanteId: participante.id,
    sorteoId: bundle.id,
    codigoSorteo: bundle.codigo_unico,
  });

  return {
    token,
    sorteo: {
      nombre: bundle.nombre,
      codigo_unico: bundle.codigo_unico,
      descripcion: bundle.descripcion,
      fecha_evento: bundle.fecha_evento,
      presupuesto: bundle.presupuesto,
    },
    participante: {
      nombre: participante.nombre,
    },
    amigo_secreto: {
      nombre: destino.nombre,
    },
  };
}

export async function cloudRecuperarMiAsignacionConToken(
  participantToken: string
): Promise<ResultadoPrivado> {
  const payload = parseToken(participantToken);
  if (payload.role !== 'PARTICIPANT' || !payload.codigoSorteo || !payload.participanteId) {
    throw new Error('Sesión de participante inválida.');
  }

  const bundle = await cloudGet<CloudSorteoBundle>(`srt_${payload.codigoSorteo}`);
  if (!bundle || bundle.estado !== 'SORTEO_REALIZADO') {
    throw new Error('El sorteo no está disponible o aún no se ha realizado.');
  }

  const participante = bundle.participantes.find((p) => p.id === payload.participanteId);
  const asignacion = bundle.asignaciones.find(
    (a) => a.participante_origen_id === payload.participanteId
  );
  const destino = bundle.participantes.find(
    (p) => p.id === asignacion?.participante_destino_id
  );

  if (!participante || !destino) {
    throw new Error('Asignación no encontrada.');
  }

  return {
    sorteo: {
      nombre: bundle.nombre,
      codigo_unico: bundle.codigo_unico,
      descripcion: bundle.descripcion,
      fecha_evento: bundle.fecha_evento,
      presupuesto: bundle.presupuesto,
    },
    participante: {
      nombre: participante.nombre,
    },
    amigo_secreto: {
      nombre: destino.nombre,
    },
  };
}

