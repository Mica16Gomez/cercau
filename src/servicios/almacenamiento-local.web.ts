// La implementación web evita cargar SQLite/wasm para un almacenamiento por clave.
export const almacenamientoLocal = {
  async getItem(clave: string): Promise<string | null> { return window.localStorage.getItem(clave); },
  async setItem(clave: string, contenido: string): Promise<void> { window.localStorage.setItem(clave, contenido); },
  async removeItem(clave: string): Promise<void> { window.localStorage.removeItem(clave); },
};
