// src/servicios/promociones.ts
const API_URL = process.env.EXPO_PUBLIC_API_URL;

export async function obtenerPromociones(estado = 'vigentes') {
  try {
    const respuesta = await fetch(`${API_URL}/promociones?estado=${estado}`);
    const resultado = await respuesta.json();
    
    
    return resultado.datos || [];
  } catch (error) {
    console.error("Error al obtener promociones:", error);
    throw error;
  }
}