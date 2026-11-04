// src/servicios/promociones.ts
const API_URL = process.env.EXPO_PUBLIC_API_URL;

export async function obtenerPromociones(estado = 'vigentes') {
  try {
    const respuesta = await fetch(`${API_URL}/promociones?estado=${estado}`);
    const resultado = await respuesta.json();
    
    const datosCrudos = resultado.datos || [];

    // Limpiamos y saneamos las URLs de las imágenes para evitar elementos rotos
    return datosCrudos.map((promo: any) => ({
      ...promo,
      imagenUrl: (promo.imagenUrl && typeof promo.imagenUrl === 'string' && promo.imagenUrl.startsWith('http')) 
        ? promo.imagenUrl 
        : null 
    }));
  } catch (error) {
    console.error("Error al obtener promociones:", error);
    throw error;
  }
}