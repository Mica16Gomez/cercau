import { CryptoDigestAlgorithm, digestStringAsync } from 'expo-crypto';
import { Platform } from 'react-native';

import { eliminarSesion, generarIdentificador, guardarSesion, leerSeguro, escribirSeguro, recuperarSesion } from './almacenamiento-sesion';
import { guardarUsuario, obtenerUsuario } from './cuenta';
import { almacenamientoLocal } from './almacenamiento-local';
import { ErrorAutenticacion } from './errores-autenticacion';
import { validarContrasena, validarEmail, validarNombre } from './validaciones-autenticacion';

import { esRolUsuario, type DatosInicioSesion, type DatosRegistro, type Usuario } from '@/tipos/usuario';

type CredencialLocal = { usuarioId: string; sal: string; resumen: string };

// Cuentas ficticias de desarrollo. No son credenciales de un servidor real.
const cuentasDemo = [
  {
    id: 'demo-vecino', nombre: 'Vecino de prueba', email: 'vecino@cercau.test', rol: 'vecino' as const, comercioId: null,
  },
  {
    id: 'demo-comercio', nombre: 'Comercio de prueba', email: 'comercio@cercau.test', rol: 'comercio' as const, comercioId: 'panaderia-la-esquina',
  },
];

const esperar = () => new Promise<void>((resolve) => setTimeout(resolve, 700));

const resumen = (texto: string) => digestStringAsync(CryptoDigestAlgorithm.SHA256, texto);
const claveCredencial = async (email: string) => `cercau.credencial.v1.${await resumen(email)}`;
const crearPerfil = (datos: Pick<Usuario, 'id' | 'nombre' | 'email' | 'rol' | 'comercioId'>): Usuario => ({
  ...datos, favoritos: [], rubrosDeInteres: [], avisosActivos: false, biometriaActiva: false,
});

async function obtenerCredencial(email: string): Promise<CredencialLocal | null> {
  let contenido: string | null;
  try {
    const clave = await claveCredencial(email);
    contenido = Platform.OS === 'web' ? await almacenamientoLocal.getItem(clave) : await leerSeguro(clave);
  } catch { throw new ErrorAutenticacion('ALMACENAMIENTO', 'No pudimos leer esta cuenta. Intentá nuevamente.'); }
  if (!contenido) return null;
  try {
    const valor: unknown = JSON.parse(contenido);
    if (typeof valor === 'object' && valor !== null && 'usuarioId' in valor && typeof valor.usuarioId === 'string' &&
      'sal' in valor && typeof valor.sal === 'string' && 'resumen' in valor && typeof valor.resumen === 'string') return valor as CredencialLocal;
  } catch { /* El error se transforma en un mensaje del servicio. */ }
  throw new ErrorAutenticacion('ALMACENAMIENTO', 'No pudimos leer esta cuenta. Reintentá el inicio de sesión.');
}

function validarCredenciales({ email, contrasena }: DatosInicioSesion): string {
  const emailNormalizado = email.trim().toLowerCase();
  const error = validarEmail(emailNormalizado) ?? validarContrasena(contrasena);
  if (error) throw new ErrorAutenticacion('DATOS_INVALIDOS', error);
  return emailNormalizado;
}

export async function iniciarSesion(datos: DatosInicioSesion): Promise<Usuario> {
  await esperar();
  const email = validarCredenciales(datos);
  const demo = cuentasDemo.find((item) => item.email === email);
  const credencial = demo ? null : await obtenerCredencial(email);
  const valida = demo ? datos.contrasena === 'Cercau123' : credencial && await resumen(`${credencial.sal}:${datos.contrasena}`) === credencial.resumen;
  if (!valida) {
    throw new ErrorAutenticacion('CREDENCIALES_INVALIDAS', 'El email o la contraseña son incorrectos.');
  }
  const usuario = demo
    ? await obtenerUsuario(demo.id) ?? await guardarUsuario(crearPerfil(demo))
    : await obtenerUsuario(credencial!.usuarioId);
  if (!usuario || usuario.email !== email) throw new ErrorAutenticacion('SESION_INVALIDA', 'No encontramos los datos de esta cuenta. Intentá nuevamente.');
  await guardarSesion(usuario.id);
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
  if (cuentasDemo.some((item) => item.email === email) || await obtenerCredencial(email)) {
    throw new ErrorAutenticacion('EMAIL_REGISTRADO', 'Ya existe una cuenta con ese email. Iniciá sesión.');
  }
  const usuario = crearPerfil({ id: `local-${await generarIdentificador()}`, nombre, email, rol: datos.rol, comercioId: null });
  const sal = await generarIdentificador();
  // Verificador local para la simulación; la contraseña solo existe durante esta llamada.
  // En nativo va a SecureStore. Un backend real deberá validar las credenciales en servidor.
  const credencial: CredencialLocal = { usuarioId: usuario.id, sal, resumen: await resumen(`${sal}:${datos.contrasena}`) };
  await guardarUsuario(usuario);
  try {
    const clave = await claveCredencial(email);
    if (Platform.OS === 'web') await almacenamientoLocal.setItem(clave, JSON.stringify(credencial));
    else await escribirSeguro(clave, JSON.stringify(credencial));
  } catch { throw new ErrorAutenticacion('ALMACENAMIENTO', 'No pudimos guardar tu cuenta. Reintentá el registro.'); }
  try { await guardarSesion(usuario.id); }
  catch { throw new ErrorAutenticacion('ALMACENAMIENTO', 'Tu cuenta se creó, pero no pudimos abrir la sesión. Usá Iniciar sesión para continuar.'); }
  return usuario;
}

export async function restaurarSesion(): Promise<Usuario | null> {
  const sesion = await recuperarSesion();
  if (!sesion) return null;
  const usuario = await obtenerUsuario(sesion.usuarioId);
  if (usuario) return usuario;
  await eliminarSesion();
  throw new ErrorAutenticacion('SESION_INVALIDA', 'No encontramos tu perfil guardado. Volvé a iniciar sesión.');
}

export async function cerrarSesion(): Promise<void> {
  await esperar();
  await eliminarSesion();
}
