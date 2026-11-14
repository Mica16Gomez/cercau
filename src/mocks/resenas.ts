import { Resena } from '../tipos/resena';

export const RESENAS_MOCK: Resena[] = [
  {
    id: 'res-1',
    comercioId: '1',
    usuarioId: 'usr-10',
    nombreUsuario: 'Martín Gómez',
    calificacion: 5,
    comentario: '¡Excelente atención y los productos son de primera calidad!',
    fechaCreacion: '2026-03-24T10:00:00Z',
    fotos: [],
  },
  {
    id: 'res-2',
    comercioId: '1',
    usuarioId: 'usr-11',
    nombreUsuario: 'Sofía Álvarez',
    calificacion: 4,
    comentario: 'Muy rico todo, aunque había bastante fila para pagar.',
    fechaCreacion: '2026-03-22T10:00:00Z',
    fotos: [],
    respuestaComercio: {
      comentario: '¡Gracias Sofía! Ya sumamos otra caja para agilizar el servicio.',
      fechaCreacion: '2026-03-23T10:00:00Z',
    },
  },
  {
    id: 'res-3',
    comercioId: '1',
    usuarioId: 'usr-12',
    nombreUsuario: 'Carlos Benítez',
    calificacion: 3,
    comentario: 'Precios accesibles, pero faltaba variedad de productos.',
    fechaCreacion: '2026-03-15T10:00:00Z',
    fotos: [],
  },
  {
    id: 'res-001',
    comercioId: 'cafe-la-esquina',
    usuarioId: 'usr-001',
    nombreUsuario: 'Juan Pérez',
    calificacion: 4,
    comentario: 'Muy rico café y excelente atención, aunque había mucha gente.',
    fechaCreacion: '2026-10-25T10:00:00Z',
    fotos: [],
    respuestaComercio: {
      comentario:
        '¡Hola Juan! Gracias por tu visita. Estamos ampliando el local para que estén más cómodos.',
      fechaCreacion: '2026-10-26T12:00:00Z',
    },
  },
  {
    id: 'res-002',
    comercioId: 'panaderia-la-esquina',
    usuarioId: 'usr-002',
    nombreUsuario: 'Lucía Fernández',
    calificacion: 5,
    comentario: 'Las medialunas recién horneadas son las mejores del barrio.',
    fechaCreacion: '2026-10-27T09:30:00Z',
    fotos: [],
  },
];