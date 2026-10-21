import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Keyboard, StyleSheet, TextInput, View } from 'react-native';

import { AccesoAlternativo, BotonCuenta, CampoCuenta, MensajeError, TarjetaCuenta } from '@/components/autenticacion/controles';
import { PantallaAutenticacion } from '@/components/autenticacion/pantalla-autenticacion';
import { SelectorRol } from '@/components/autenticacion/selector-rol';
import { ThemedText } from '@/components/themed-text';
import { useAutenticacion } from '@/contextos/autenticacion';
import { ErrorAutenticacion, obtenerMensajeError } from '@/servicios/errores-autenticacion';
import { validarRegistro, type CampoFormulario } from '@/servicios/validaciones-autenticacion';
import { esRolUsuario, type RolUsuario } from '@/tipos/usuario';

export default function RegistrarseScreen() {
  const parametros = useLocalSearchParams<{ rol?: string | string[] }>();
  const { registrarse, cargando } = useAutenticacion();
  const [rol, setRol] = useState<RolUsuario | null>(() => esRolUsuario(parametros.rol) ? parametros.rol : null);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [emailRegistrado, setEmailRegistrado] = useState<string | undefined>();
  const [tocados, setTocados] = useState<Partial<Record<CampoFormulario, boolean>>>({});
  const [intento, setIntento] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const nombreRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const contrasenaRef = useRef<TextInput>(null);
  const confirmacionRef = useRef<TextInput>(null);
  const errores = validarRegistro({ nombre, email, contrasena, confirmacion, rol });

  function errorCampo(campo: CampoFormulario) { return intento || tocados[campo] ? errores[campo] : undefined; }
  function marcar(campo: CampoFormulario) { setTocados((actual) => ({ ...actual, [campo]: true })); }

  async function crearCuenta() {
    if (cargando || enviando) return;
    setError(null);
    setEmailRegistrado(undefined);
    setIntento(true);
    if (Object.keys(errores).length > 0 || !esRolUsuario(rol)) {
      const primerCampo = errores.nombre ? nombreRef : errores.email ? emailRef : errores.contrasena ? contrasenaRef : errores.confirmacion ? confirmacionRef : null;
      primerCampo?.current?.focus();
      return;
    }
    Keyboard.dismiss();
    setEnviando(true);
    try {
      await registrarse({ nombre, email, contrasena, rol });
      setContrasena('');
      setConfirmacion('');
      router.replace('/cuenta-creada');
    } catch (error: unknown) {
      if (error instanceof ErrorAutenticacion && error.codigo === 'EMAIL_REGISTRADO') {
        setEmailRegistrado(error.message);
        emailRef.current?.focus();
      } else setError(obtenerMensajeError(error));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <PantallaAutenticacion titulo="Creá tu cuenta" destacado="TUS DATOS · PASO 2 DE 2" descripcion="Unos pocos datos para ser parte del barrio." permitirSesion={enviando} paso={2}>
      <TarjetaCuenta>
        <CampoCuenta
          ref={nombreRef} etiqueta="Nombre completo" placeholder="Tu nombre y apellido" value={nombre} onChangeText={setNombre}
          autoCapitalize="words" autoComplete="name" textContentType="name" maxLength={80} editable={!cargando}
          icono={{ ios: 'person', android: 'person_outline', web: 'person_outline' }}
          error={errorCampo('nombre')} onBlur={() => marcar('nombre')}
          returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => emailRef.current?.focus()}
        />
        <CampoCuenta
          ref={emailRef} etiqueta="Correo electrónico" placeholder="nombre@correo.com" value={email}
          onChangeText={(valor) => { setEmail(valor); setEmailRegistrado(undefined); }}
          keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
          autoComplete="email" textContentType="emailAddress" maxLength={254} editable={!cargando}
          icono={{ ios: 'envelope', android: 'mail_outline', web: 'mail_outline' }}
          error={emailRegistrado ?? errorCampo('email')} onBlur={() => marcar('email')}
          returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => contrasenaRef.current?.focus()}
        />
        <CampoCuenta
          ref={contrasenaRef} etiqueta="Contraseña" placeholder="Creá una contraseña" value={contrasena} onChangeText={setContrasena}
          esContrasena autoCapitalize="none" autoCorrect={false} autoComplete="new-password"
          textContentType="newPassword" maxLength={128} editable={!cargando}
          icono={{ ios: 'lock', android: 'lock_outline', web: 'lock_outline' }}
          ayuda="Usá al menos 8 caracteres." error={errorCampo('contrasena')} onBlur={() => marcar('contrasena')}
          returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => confirmacionRef.current?.focus()}
        />
        <CampoCuenta
          ref={confirmacionRef} etiqueta="Confirmar contraseña" placeholder="Volvé a escribir tu contraseña" value={confirmacion} onChangeText={setConfirmacion}
          esContrasena autoCapitalize="none" autoCorrect={false} autoComplete="new-password"
          textContentType="newPassword" maxLength={128} editable={!cargando} returnKeyType="go"
          icono={{ ios: 'lock', android: 'lock_outline', web: 'lock_outline' }}
          error={errorCampo('confirmacion')} onBlur={() => marcar('confirmacion')}
          onSubmitEditing={crearCuenta}
        />
        <View style={estilos.rol}>
          <ThemedText type="smallBold">Tu tipo de cuenta</ThemedText>
          <SelectorRol valor={rol} onChange={setRol} compacto deshabilitado={cargando} error={errorCampo('rol')} />
          <ThemedText type="small" themeColor="textSecondary">
            {rol === 'comercio' ? 'Un perfil para representar a tu comercio en la comunidad.' : rol === 'vecino' ? 'Un perfil para descubrir y acompañar a los comercios de tu barrio.' : 'Elegí cómo querés ser parte de Cercau.'}
          </ThemedText>
        </View>
        <MensajeError mensaje={error} />
        <BotonCuenta titulo={cargando ? 'Creando cuenta…' : 'Crear cuenta'} cargando={cargando} onPress={crearCuenta} />
      </TarjetaCuenta>
      <AccesoAlternativo texto="¿Ya tenés una cuenta?" titulo="Iniciar sesión" deshabilitado={cargando} onPress={() => router.replace('/iniciar-sesion')} />
    </PantallaAutenticacion>
  );
}

const estilos = StyleSheet.create({
  rol: { gap: 12 },
});
