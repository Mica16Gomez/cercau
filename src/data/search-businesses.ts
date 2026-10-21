import type { ImageSource } from 'expo-image';
import type { CategoriaBusqueda, Comercio } from '@/tipos/comercio';

// Datos exclusivos de Buscar: las vistas de Promociones y Mapa conservan sus ejemplos.
export const categories = ['Todos', 'Comida', 'Servicios', 'Salud'] as const;
export type Category = CategoriaBusqueda;
export type Business = Comercio;

export const businesses: Business[] = [
  {
    id: 'cafe-la-esquina',
    name: 'Café La Esquina',
    category: 'Cafetería',
    filterCategory: 'Comida',
    initials: 'CE',
    distance: '300 m',
    rating: '4,8',
    isOpen: true,
  },
  {
    id: 'panaderia-el-sol',
    name: 'Panadería El Sol',
    category: 'Panadería',
    filterCategory: 'Comida',
    initials: 'ES',
    distance: '450 m',
    rating: '4,6',
    isOpen: true,
  },
  {
    id: 'floreria-verde',
    name: 'Florería Verde',
    category: 'Florería',
    filterCategory: 'Servicios',
    initials: 'FV',
    distance: '600 m',
    rating: '4,9',
    isOpen: true,
  },
];

// Fotografías locales: las tarjetas no dependen de una conexión a Internet.
export const businessImages: Record<string, ImageSource> = {
  'cafe-la-esquina': require('../../assets/images/comercios/cafe.jpg'),
  'panaderia-el-sol': require('../../assets/images/comercios/panaderia.jpg'),
  // Foto de Duong Ngan: https://unsplash.com/photos/S_wgyxHOOjI
  'floreria-verde': require('../../assets/images/comercios/flores.jpg'),
};

function normalizeText(text: string) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

export function filterBusinesses(query: string, category: Category) {
  const search = normalizeText(query);

  return businesses.filter((business) => {
    const matchesCategory = category === 'Todos' || business.filterCategory === category;
    const matchesSearch = normalizeText(`${business.name} ${business.category} ${business.filterCategory}`).includes(search);
    return matchesCategory && matchesSearch;
  });
}
