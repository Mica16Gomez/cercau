type CodigoError =
  | 'DATOS_INVALIDOS'
  | 'CREDENCIALES_INVALIDAS'
  | 'EMAIL_REGISTRADO'
  | 'ALMACENAMIENTO'
  | 'SESION_INVALIDA'
  | 'OPERACION_EN_CURSO';

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
