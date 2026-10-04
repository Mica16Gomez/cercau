import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Keyboard, TextInput } from 'react-native';

import { AccesoAlternativo, BotonCuenta, CampoCuenta, MensajeError, TarjetaCuenta } from '@/components/autenticacion/controles';
import { PantallaAutenticacion } from '@/components/autenticacion/pantalla-autenticacion';
import { useAutenticacion } from '@/contextos/autenticacion';
import { obtenerMensajeError } from '@/servicios/errores-autenticacion';
import { validarInicioSesion } from '@/servicios/validaciones-autenticacion';

export default function IniciarSesionScreen() {
  const { iniciarSesion, cargando } = useAutenticacion();
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [tocados, setTocados] = useState({ email: false, contrasena: false });
  const [enviando, setEnviando] = useState(false);
  const emailRef = useRef<TextInput>(null);
  const contrasenaRef = useRef<TextInput>(null);
  const errores = validarInicioSesion({ email, contrasena });

  async function ingresar() {
    if (cargando || enviando) return;
    setError(null);
    setTocados({ email: true, contrasena: true });
    if (Object.keys(errores).length > 0) {
      (errores.email ? emailRef : contrasenaRef).current?.focus();
      return;
    }
    Keyboard.dismiss();
    setEnviando(true);
    try {
      await iniciarSesion({ email, contrasena });
      setContrasena('');
      router.dismissTo('/mi-cuenta');
    } catch (error: unknown) {
      setError(obtenerMensajeError(error));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <PantallaAutenticacion titulo="Qué bueno verte" destacado="BIENVENIDO A CERCAU" descripcion="Iniciá sesión y conectá con lo mejor de tu barrio." permitirSesion={enviando}>
      <TarjetaCuenta>
        <CampoCuenta
          ref={emailRef} etiqueta="Correo electrónico" placeholder="nombre@correo.com" value={email}
          onChangeText={(valor) => { setEmail(valor); setError(null); }}
          icono={{ ios: 'envelope', android: 'mail_outline', web: 'mail_outline' }}
          error={tocados.email ? errores.email : undefined} onBlur={() => setTocados((actual) => ({ ...actual, email: true }))}
          keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
          autoComplete="email" textContentType="emailAddress" maxLength={254} editable={!cargando}
          returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => contrasenaRef.current?.focus()}
        />
        <CampoCuenta
          ref={contrasenaRef} etiqueta="Contraseña" placeholder="Ingresá tu contraseña" value={contrasena}
          onChangeText={(valor) => { setContrasena(valor); setError(null); }}
          icono={{ ios: 'lock', android: 'lock_outline', web: 'lock_outline' }}
          error={tocados.contrasena ? errores.contrasena : undefined} onBlur={() => setTocados((actual) => ({ ...actual, contrasena: true }))}
          esContrasena autoCapitalize="none" autoCorrect={false} autoComplete="current-password"
          textContentType="password" maxLength={128} editable={!cargando} returnKeyType="go"
          onSubmitEditing={ingresar}
        />
        <MensajeError mensaje={error} />
        <BotonCuenta titulo={cargando ? 'Ingresando…' : 'Iniciar sesión'} cargando={cargando} onPress={ingresar} />
      </TarjetaCuenta>
      <AccesoAlternativo texto="¿Todavía no tenés cuenta?" titulo="Crear una cuenta" deshabilitado={cargando} onPress={() => router.replace('/seleccionar-rol')} />
    </PantallaAutenticacion>
  );
}
