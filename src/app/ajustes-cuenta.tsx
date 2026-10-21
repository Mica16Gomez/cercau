import { useCallback } from 'react';

import { SettingsRow } from '@/components/autenticacion/accesos-cuenta';
import { EnlaceCuenta, MensajeError, TarjetaCuenta } from '@/components/autenticacion/controles';
import { PantallaCuenta } from '@/components/autenticacion/pantalla-cuenta';
import { EstadoInterfaz, SectionHeader } from '@/components/interfaz';
import { ThemedText } from '@/components/themed-text';
import { useAutenticacion } from '@/contextos/autenticacion';
import { useAccionCuenta } from '@/hooks/use-accion-cuenta';
import { useBiometria } from '@/hooks/use-biometria';
import { useConsulta } from '@/hooks/use-consulta';
import { obtenerRubros } from '@/servicios/comercios';

export default function AjustesCuentaScreen() {
  const { usuario, cargando, alternarRubro, cambiarAvisos } = useAutenticacion();
  const rubros = useConsulta(useCallback(() => obtenerRubros(), []));
  const biometria = useBiometria();
  const accion = useAccionCuenta();
  return <PantallaCuenta titulo="Seguridad y preferencias" descripcion="Administrá el acceso y los intereses de tu cuenta.">
    <TarjetaCuenta>
      <SectionHeader titulo="Seguridad" />
      <ThemedText selectable>Correo: {usuario?.email}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">Ingresás con correo y contraseña. Podés activar el ingreso biométrico desde Mi cuenta después de verificar tu identidad.</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">{biometria.cargando ? 'Consultando biometría…' : biometria.datos?.mensaje}</ThemedText>
      <EnlaceCuenta titulo="Volver a consultar biometría" onPress={biometria.reintentar} deshabilitado={biometria.cargando || cargando} />
    </TarjetaCuenta>
    <TarjetaCuenta>
      <SectionHeader titulo="Rubros de interés" />
      {!usuario?.rubrosDeInteres.length && <ThemedText type="small" themeColor="textSecondary">No elegiste rubros todavía. Podés seleccionar más de uno.</ThemedText>}
      {rubros.cargando ? <EstadoInterfaz tipo="cargando" titulo="Cargando rubros…" /> : rubros.error ?
        <EstadoInterfaz tipo="error" titulo="No pudimos cargar los rubros" descripcion={rubros.error} accion="Reintentar" onPress={rubros.reintentar} /> :
        !rubros.datos?.length ? <EstadoInterfaz titulo="No hay rubros disponibles" accion="Reintentar" onPress={rubros.reintentar} /> :
        rubros.datos.map((rubro) => <SettingsRow key={rubro.id} titulo={rubro.nombre} descripcion="Rubro de interés"
          icono={{ ios: 'tag', android: 'sell', web: 'sell' }} interruptor valor={usuario?.rubrosDeInteres.includes(rubro.id)} deshabilitado={cargando}
          onChange={() => void accion.ejecutar(() => alternarRubro(rubro.id), 'Rubros de interés guardados.')} />)}
    </TarjetaCuenta>
    <TarjetaCuenta>
      <SectionHeader titulo="Avisos" />
      <SettingsRow titulo="Avisos activos" descripcion="Preferencia para recibir avisos de tus intereses"
        icono={{ ios: 'bell', android: 'notifications', web: 'notifications' }} interruptor valor={usuario?.avisosActivos} deshabilitado={cargando}
        onChange={(valor) => void accion.ejecutar(() => cambiarAvisos(valor), valor ? 'Avisos activados.' : 'Avisos desactivados.')} />
      <ThemedText type="small" themeColor="textSecondary">Esta preferencia queda guardada en tu cuenta.</ThemedText>
    </TarjetaCuenta>
    <MensajeError mensaje={accion.error} />
    {accion.error && <EnlaceCuenta titulo="Reintentar guardado" onPress={accion.reintentar} deshabilitado={cargando} />}
    {accion.exito && <ThemedText accessibilityRole="alert" accessibilityLiveRegion="polite" themeColor="primary">{accion.exito}</ThemedText>}
  </PantallaCuenta>;
}
