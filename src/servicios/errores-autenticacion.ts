type CodigoError =
  | 'DATOS_INVALIDOS'
  | 'CREDENCIALES_INVALIDAS'
  | 'EMAIL_REGISTRADO'
  | 'ALMACENAMIENTO'
  | 'SESION_INVALIDA'
  | 'BIOMETRIA'
  | 'SIN_SESION'
  | 'OPERACION_EN_CURSO'
  | 'API_NO_DISPONIBLE'
  | 'SIN_CONEXION'
  | 'ERROR_INESPERADO';

export class ErrorAutenticacion extends Error {
  constructor(public readonly codigo: CodigoError, mensaje: string) {
    super(mensaje);
    this.name = 'ErrorAutenticacion';
  }
}

export function obtenerMensajeError(error: unknown): string {
  return error instanceof ErrorAutenticacion
    ? error.message
    : 'No pudimos completar la operación. Intentá nuevamente.';
}
