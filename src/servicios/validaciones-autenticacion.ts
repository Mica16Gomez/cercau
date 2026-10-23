import type { DatosInicioSesion } from '@/tipos/usuario';

export type CampoFormulario = 'nombre' | 'email' | 'contrasena' | 'confirmacion';
export type ErroresFormulario = Partial<Record<CampoFormulario, string>>;

export function validarNombre(nombre: string): string | undefined {
  if (!nombre.trim()) return 'Ingresá tu nombre completo.';
  if (nombre.trim().length < 2 || nombre.trim().length > 80) return 'Usá entre 2 y 80 caracteres para tu nombre.';
}

export function validarEmail(email: string): string | undefined {
  if (!email.trim()) return 'Ingresá tu correo electrónico.';
  if (email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return 'Ingresá un correo válido, por ejemplo nombre@correo.com.';
  }
}

export function validarContrasena(contrasena: string, registro = true): string | undefined {
  if (!contrasena.trim()) return 'Ingresá una contraseña.';
  if ((registro && contrasena.length < 8) || contrasena.length > 100) return registro
    ? 'La contraseña debe tener entre 8 y 100 caracteres.' : 'La contraseña puede tener hasta 100 caracteres.';
}

export function validarInicioSesion(datos: DatosInicioSesion): ErroresFormulario {
  const errores: ErroresFormulario = {};
  const email = validarEmail(datos.email);
  const contrasena = validarContrasena(datos.contrasena, false);
  if (email) errores.email = email;
  if (contrasena) errores.contrasena = contrasena;
  return errores;
}

export function validarRegistro(datos: DatosInicioSesion & { nombre: string; confirmacion: string }): ErroresFormulario {
  const errores = validarInicioSesion(datos);
  const nombre = validarNombre(datos.nombre);
  const contrasena = validarContrasena(datos.contrasena);
  if (nombre) errores.nombre = nombre;
  if (contrasena) errores.contrasena = contrasena;
  if (!datos.confirmacion) errores.confirmacion = 'Repetí tu contraseña.';
  else if (datos.confirmacion !== datos.contrasena) errores.confirmacion = 'Las contraseñas no coinciden.';
  return errores;
}
