import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

import { ErrorAutenticacion } from './errores-autenticacion';

export type DisponibilidadBiometria = { disponible: boolean; nombre: string; mensaje: string };

export async function consultarBiometria(): Promise<DisponibilidadBiometria> {
  if (Platform.OS === 'web') return { disponible: false, nombre: 'Biometría', mensaje: 'En navegador, ingresá con correo y contraseña.' };
  try {
    const [hardware, configurada, tipos, nivel] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(), LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.supportedAuthenticationTypesAsync(), LocalAuthentication.getEnrolledLevelAsync(),
    ]);
    const facial = tipos.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
    const huella = tipos.includes(LocalAuthentication.AuthenticationType.FINGERPRINT);
    const nombre = Platform.OS === 'ios' && facial ? 'Face ID' : huella ? 'Huella digital' : facial ? 'Reconocimiento facial' : 'Biometría';
    if (!hardware || tipos.length === 0) return { disponible: false, nombre, mensaje: 'Este dispositivo no tiene biometría disponible. Usá correo y contraseña.' };
    if (!configurada) return { disponible: false, nombre, mensaje: 'Configurá una huella o un rostro en los ajustes del dispositivo. Podés ingresar con correo y contraseña.' };
    if (Platform.OS === 'ios' && facial && Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
      return { disponible: false, nombre, mensaje: 'Face ID necesita una development build en iPhone. En Expo Go usá correo y contraseña.' };
    }
    if (Platform.OS === 'android' && nivel !== LocalAuthentication.SecurityLevel.BIOMETRIC_STRONG) {
      return { disponible: false, nombre, mensaje: 'Configurá una huella o biometría de alta seguridad. También podés usar correo y contraseña.' };
    }
    return { disponible: true, nombre, mensaje: `Verificá tu identidad con ${nombre}. También podés usar correo y contraseña.` };
  } catch {
    return { disponible: false, nombre: 'Biometría', mensaje: 'No pudimos consultar la biometría. Reintentá o usá correo y contraseña.' };
  }
}

let solicitando = false;

// Reutilizable por el acceso y por la futura validación previa al QR; no abre ningún escáner.
export async function solicitarValidacionBiometrica(motivo = 'Verificá tu identidad para ingresar a Cercau'): Promise<void> {
  if (solicitando) throw new ErrorAutenticacion('OPERACION_EN_CURSO', 'Ya hay una verificación en curso.');
  solicitando = true;
  try {
    const estado = await consultarBiometria();
    if (!estado.disponible) throw new ErrorAutenticacion('BIOMETRIA', estado.mensaje);
    const resultado = await LocalAuthentication.authenticateAsync({
      promptMessage: motivo, cancelLabel: 'Usar correo y contraseña', fallbackLabel: 'Usar correo y contraseña',
      disableDeviceFallback: true, biometricsSecurityLevel: 'strong',
    });
    if (resultado.success) return;
    const mensajes: Record<string, string> = {
      user_cancel: 'Cancelaste la verificación. Podés reintentar o ingresar con correo y contraseña.',
      app_cancel: 'La verificación se interrumpió. Reintentá o usá correo y contraseña.',
      system_cancel: 'La verificación se interrumpió. Reintentá o usá correo y contraseña.',
      user_fallback: 'Ingresá con tu correo y contraseña.',
      authentication_failed: 'No pudimos reconocerte. Reintentá o usá correo y contraseña.',
      lockout: 'La biometría está bloqueada. Desbloqueá el dispositivo o ingresá con correo y contraseña.',
      not_enrolled: 'No hay huellas ni rostro configurados. Usá correo y contraseña.',
      not_available: 'La biometría no está disponible. Usá correo y contraseña.',
      timeout: 'Se terminó el tiempo de verificación. Reintentá o usá correo y contraseña.',
    };
    throw new ErrorAutenticacion('BIOMETRIA', mensajes[resultado.error] ?? 'No se pudo completar la verificación. Usá correo y contraseña.');
  } catch (error) {
    if (error instanceof ErrorAutenticacion) throw error;
    throw new ErrorAutenticacion('BIOMETRIA', 'No pudimos abrir la verificación. Usá correo y contraseña.');
  } finally { solicitando = false; }
}
