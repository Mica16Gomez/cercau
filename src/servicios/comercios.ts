import { businesses as comerciosBase, categories as rubrosBase } from '@/data/businesses';
import { businessImages as imagenesBase } from '@/data/business-images';
import { businesses, businessImages, categories, filterBusinesses } from '@/data/search-businesses';
import type { CategoriaBusqueda, Comercio, Rubro } from '@/tipos/comercio';

// Este es el límite con los datos ficticios. Las pantallas solo llaman al servicio.
export async function obtenerCategorias(): Promise<readonly CategoriaBusqueda[]> { return categories; }

export async function buscarComercios(texto: string, categoria: CategoriaBusqueda): Promise<Comercio[]> {
  return filterBusinesses(texto, categoria).map((comercio) => ({ ...comercio, imagen: businessImages[comercio.id] }));
}

export async function obtenerComerciosPorIds(ids: readonly string[]): Promise<Comercio[]> {
  const catalogo: Comercio[] = [
    ...businesses.map((comercio) => ({ ...comercio, imagen: businessImages[comercio.id] })),
    ...comerciosBase.map((comercio) => ({ ...comercio, imagen: imagenesBase[comercio.id] })),
  ];
  return [...new Set(ids)].flatMap((id) => {
    const comercio = catalogo.find((item) => item.id === id);
    return comercio ? [comercio] : [];
  });
}

export async function obtenerRubros(): Promise<Rubro[]> {
  return [...new Set([...categories.filter((rubro) => rubro !== 'Todos'), ...rubrosBase.filter((rubro) => rubro !== 'Todas')])]
    .map((nombre) => ({ id: nombre, nombre }));
}
