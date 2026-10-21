import Storage from 'expo-sqlite/kv-store';

// Solo datos de cuenta: jamás se escriben tokens ni contraseñas en este almacén.
export const almacenamientoLocal = Storage;
