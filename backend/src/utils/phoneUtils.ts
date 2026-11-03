/**
 * Normaliza y valida números de teléfono de WhatsApp.
 * Por defecto aplica el prefijo +51 (Perú) si no se incluye código de país.
 */
export function normalizarTelefono(input: string): string {
  const limpio = input.replace(/[\s\-().]/g, '').trim();
  if (!limpio) return '';

  if (limpio.startsWith('+')) {
    return limpio;
  }

  // Si empieza con 51 y tiene 11 dígitos (ej. 51987654321)
  if (limpio.startsWith('51') && limpio.length === 11) {
    return `+${limpio}`;
  }

  // Si tiene 9 dígitos (número celular peruano estándar)
  if (/^\d{9}$/.test(limpio)) {
    return `+51${limpio}`;
  }

  return `+${limpio}`;
}

export function esTelefonoValido(telefonoNormalizado: string): boolean {
  // Validación para Perú (+51 seguido de 9 dígitos empezando con 9) o formato internacional E.164 (+ seguido de 10 a 15 dígitos)
  if (telefonoNormalizado.startsWith('+51')) {
    return /^\+519\d{8}$/.test(telefonoNormalizado);
  }
  return /^\+\d{10,15}$/.test(telefonoNormalizado);
}

