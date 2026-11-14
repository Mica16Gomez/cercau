export interface RespuestaComercio {
  comentario: string;
  fechaCreacion: string;
}

export interface Resena {
  id: string;
  comercioId: string;
  usuarioId: string;
  nombreUsuario: string;
  calificacion: number;
  comentario?: string;
  fotos?: string[];
  fechaCreacion: string;
  respuestaComercio?: RespuestaComercio;
  /** No enviada a Docker: respuesta guardada únicamente para el video de demostración. */
  respuestaDemoLocal?: boolean;
  /** No enviado a Docker: reporte visible solo para la demostración individual. */
  reporteDemoLocal?: boolean;
  reportada?: boolean;
  motivoReporte?: string;
  fechaReporte?: string;
  pendienteSincronizacion?: boolean;
}

export interface DatosNuevaResena {
  comercioId: string;
  usuarioId: string;
  nombreUsuario: string;
  calificacion: number;
  comentario: string;
  fotos: string[];
}

export interface DatosEditarResena {
  id: string;
  usuarioId: string;
  calificacion: number;
  comentario: string;
  fotos: string[];
}
