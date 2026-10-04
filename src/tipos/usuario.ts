export type RolUsuario = 'vecino' | 'comercio';

export type Usuario = {
  id: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
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
    'rol' in valor && esRolUsuario(valor.rol)
  );
}
