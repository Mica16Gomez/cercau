import { router } from 'expo-router';
import { useState } from 'react';

import { AccesoAlternativo, BotonCuenta } from '@/components/autenticacion/controles';
import { PantallaAutenticacion } from '@/components/autenticacion/pantalla-autenticacion';
import { SelectorRol } from '@/components/autenticacion/selector-rol';
import { useAutenticacion } from '@/contextos/autenticacion';
import type { RolUsuario } from '@/tipos/usuario';

export default function SeleccionarRolScreen() {
  const { cargando } = useAutenticacion();
  const [rol, setRol] = useState<RolUsuario | null>(null);
  return (
    <PantallaAutenticacion titulo="¿Cómo querés usar Cercau?" destacado="CREÁ TU CUENTA · PASO 1 DE 2" descripcion="Hay un lugar para vos en el barrio. Elegí tu tipo de cuenta.">
      <SelectorRol valor={rol} onChange={setRol} deshabilitado={cargando} />
      <BotonCuenta titulo="Continuar" deshabilitado={cargando || !rol}
        icono={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }}
        onPress={() => { if (rol) router.push({ pathname: '/registrarse', params: { rol } }); }} />
      <AccesoAlternativo texto="¿Ya sos parte de Cercau?" titulo="Iniciar sesión" deshabilitado={cargando} onPress={() => router.replace('/iniciar-sesion')} />
    </PantallaAutenticacion>
  );
}
