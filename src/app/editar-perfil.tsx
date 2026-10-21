import { useState } from 'react';
import { Keyboard } from 'react-native';

import { BotonCuenta, CampoCuenta, EnlaceCuenta, MensajeError, TarjetaCuenta } from '@/components/autenticacion/controles';
import { PantallaCuenta } from '@/components/autenticacion/pantalla-cuenta';
import { ThemedText } from '@/components/themed-text';
import { useAutenticacion } from '@/contextos/autenticacion';
import { useAccionCuenta } from '@/hooks/use-accion-cuenta';
import { validarNombre } from '@/servicios/validaciones-autenticacion';

export default function EditarPerfilScreen() {
  const { usuario, cargando, editarNombre } = useAutenticacion();
  const [nombre, setNombre] = useState(usuario?.nombre ?? '');
  const [tocado, setTocado] = useState(false);
  const accion = useAccionCuenta();
  const errorNombre = validarNombre(nombre);
  function guardar() {
    if (cargando) return;
    setTocado(true);
    if (errorNombre) return;
    Keyboard.dismiss();
    void accion.ejecutar(() => editarNombre(nombre), 'Guardamos tu nombre. Ya está actualizado en Mi cuenta.');
  }
  return <PantallaCuenta titulo="Editar perfil" descripcion="Actualizá el nombre de tu cuenta.">
    <TarjetaCuenta>
      <CampoCuenta etiqueta="Nombre completo" value={nombre} onChangeText={(valor) => { setNombre(valor); accion.limpiar(); }}
        error={tocado ? errorNombre : undefined} onBlur={() => setTocado(true)} maxLength={80} editable={!cargando}
        autoCapitalize="words" autoComplete="name" textContentType="name" returnKeyType="done" onSubmitEditing={guardar} />
      <ThemedText selectable themeColor="textSecondary">Correo: {usuario?.email}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">El correo identifica tu cuenta. El rol y el comercio asociado se conservan.</ThemedText>
      <MensajeError mensaje={accion.error} />
      {accion.error && <EnlaceCuenta titulo="Reintentar" onPress={accion.reintentar} deshabilitado={cargando} />}
      {accion.exito && <ThemedText accessibilityRole="alert" accessibilityLiveRegion="polite" themeColor="primary">{accion.exito}</ThemedText>}
      <BotonCuenta titulo="Guardar nombre" cargando={cargando} onPress={guardar} />
    </TarjetaCuenta>
  </PantallaCuenta>;
}
