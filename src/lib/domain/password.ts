export const MIN_PASSWORD_LENGTH = 8;

/** Mensaje de error para el cambio de contraseña, o `null` si es válido. */
export function validateNewPassword(current: string, next: string, confirm: string): string | null {
  if (!current) return "Escribe tu contraseña actual";
  if (next.length < MIN_PASSWORD_LENGTH) return `La nueva contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`;
  if (!/[a-zA-Z]/.test(next) || !/\d/.test(next)) return "La nueva contraseña debe mezclar letras y números";
  if (next === current) return "La nueva contraseña debe ser distinta de la actual";
  if (next !== confirm) return "La confirmación no coincide con la nueva contraseña";
  return null;
}
