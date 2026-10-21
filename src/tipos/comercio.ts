import type { ImageSource } from 'expo-image';

export type CategoriaBusqueda = 'Todos' | 'Comida' | 'Servicios' | 'Salud';
export type Comercio = {
  id: string;
  name: string;
  category: string;
  filterCategory?: Exclude<CategoriaBusqueda, 'Todos'>;
  initials: string;
  distance: string;
  rating: string;
  isOpen: boolean;
  imagen?: ImageSource;
};
export type Rubro = { id: string; nombre: string };
