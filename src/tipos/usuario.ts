export type RolUsuario = 'vecino' | 'comercio';

export type Usuario = {
  id: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
  comercioId: string | null;
  favoritos: string[];
  rubrosDeInteres: string[];
  avisosActivos: boolean;
  biometriaActiva: boolean;
};

export type DatosInicioSesion = {
  email: string;
  contrasena: string;
};

export type DatosRegistro = DatosInicioSesion & {
  nombre: string;
  rol: RolUsuario;
};

export function esRolUsuario(valor: unknown): valor is RolUsuario {
  return valor === 'vecino' || valor === 'comercio';
}

// Los datos recuperados del dispositivo también deben validarse en tiempo de ejecución.
export function esUsuario(valor: unknown): valor is Usuario {
  if (typeof valor !== 'object' || valor === null) return false;

  return (
    'id' in valor && typeof valor.id === 'string' && valor.id.length > 0 &&
    'nombre' in valor && typeof valor.nombre === 'string' && valor.nombre.trim().length >= 2 &&
    'email' in valor && typeof valor.email === 'string' && /^\S+@\S+\.\S+$/.test(valor.email) &&
    'rol' in valor && esRolUsuario(valor.rol) &&
    'comercioId' in valor && (valor.comercioId === null || typeof valor.comercioId === 'string' && valor.comercioId.length > 0) &&
    (valor.rol !== 'vecino' || valor.comercioId === null) &&
    'favoritos' in valor && esListaIds(valor.favoritos) &&
    'rubrosDeInteres' in valor && esListaIds(valor.rubrosDeInteres) &&
    'avisosActivos' in valor && typeof valor.avisosActivos === 'boolean' &&
    'biometriaActiva' in valor && typeof valor.biometriaActiva === 'boolean'
  );
}

function esListaIds(valor: unknown): valor is string[] {
  return Array.isArray(valor) && valor.every((id) => typeof id === 'string' && id.length > 0) && new Set(valor).size === valor.length;
}

export type SesionGuardada = { version: 2; token: string; usuarioId: string; venceEn: number };
export type CambiosCuenta = Partial<Pick<Usuario, 'nombre' | 'favoritos' | 'rubrosDeInteres' | 'avisosActivos' | 'biometriaActiva'>>;
