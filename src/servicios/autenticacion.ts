import { eliminarSesion, guardarSesion } from './almacenamiento-sesion';
import { ErrorAutenticacion } from './errores-autenticacion';
import { validarContrasena, validarEmail, validarNombre } from './validaciones-autenticacion';

import { esRolUsuario, type DatosInicioSesion, type DatosRegistro, type Usuario } from '@/tipos/usuario';

type CuentaSimulada = { usuario: Usuario; contrasena: string };

// Este servicio reemplaza temporalmente al backend. Las cuentas creadas viven en memoria.
// La sesión sí persiste; las contraseñas nunca se escriben en el dispositivo.
const cuentas: CuentaSimulada[] = [
  {
    usuario: { id: 'demo-vecino', nombre: 'Vecino de prueba', email: 'vecino@cercau.test', rol: 'vecino' },
    contrasena: 'Cercau123',
  },
  {
    usuario: { id: 'demo-comercio', nombre: 'Comercio de prueba', email: 'comercio@cercau.test', rol: 'comercio' },
    contrasena: 'Cercau123',
  },
];

const esperar = () => new Promise<void>((resolve) => setTimeout(resolve, 700));

function validarCredenciales({ email, contrasena }: DatosInicioSesion): string {
  const emailNormalizado = email.trim().toLowerCase();
  const error = validarEmail(emailNormalizado) ?? validarContrasena(contrasena);
  if (error) throw new ErrorAutenticacion('DATOS_INVALIDOS', error);
  return emailNormalizado;
}

export async function iniciarSesion(datos: DatosInicioSesion): Promise<Usuario> {
  await esperar();
  const email = validarCredenciales(datos);
  const cuenta = cuentas.find((item) => item.usuario.email === email && item.contrasena === datos.contrasena);
  if (!cuenta) {
    throw new ErrorAutenticacion('CREDENCIALES_INVALIDAS', 'El email o la contraseña son incorrectos.');
  }
  const usuario = { ...cuenta.usuario };
  await guardarSesion(usuario);
  return usuario;
}

export async function registrarse(datos: DatosRegistro): Promise<Usuario> {
  await esperar();
  const email = validarCredenciales(datos);
  const nombre = datos.nombre.trim();
  const errorNombre = validarNombre(nombre);
  if (errorNombre) throw new ErrorAutenticacion('DATOS_INVALIDOS', errorNombre);
  if (!esRolUsuario(datos.rol)) {
    throw new ErrorAutenticacion('DATOS_INVALIDOS', 'Seleccioná vecino o comercio para continuar.');
  }
  if (cuentas.some((item) => item.usuario.email === email)) {
    throw new ErrorAutenticacion('EMAIL_REGISTRADO', 'Ya existe una cuenta con ese email. Iniciá sesión.');
  }
  const usuario: Usuario = { id: `simulado-${Date.now()}-${cuentas.length}`, nombre, email, rol: datos.rol };
  // Si el almacenamiento falla, no creamos una cuenta que impida reintentar el registro.
  await guardarSesion(usuario);
  cuentas.push({ usuario, contrasena: datos.contrasena });
  return { ...usuario };
}

export async function cerrarSesion(): Promise<void> {
  await esperar();
  await eliminarSesion();
}
