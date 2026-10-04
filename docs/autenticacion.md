# Base, autenticación y cuenta — etapa 1

## Rutas y navegación

```text
src/app/
├── _layout.tsx               # Tema, proveedor de sesión y Stack raíz
├── (tabs)/
│   ├── _layout.tsx           # AppTabs original: las cuatro pestañas son públicas
│   ├── index.tsx             # Buscar, conservado sin cambios
│   ├── explore.tsx           # Promociones, conservado sin cambios
│   ├── mapa.tsx              # Mapa, conservado sin cambios
│   └── mi-cuenta.tsx         # Bienvenida o perfil según la sesión
├── iniciar-sesion.tsx
├── seleccionar-rol.tsx
└── registrarse.tsx
```

El grupo `(tabs)` organiza archivos sin cambiar las direcciones `/`, `/explore`, `/mapa` y `/mi-cuenta`. Su layout reutiliza `app-tabs.tsx` en celular y `app-tabs.web.tsx` en navegador. El Stack raíz abre la autenticación sobre los tabs; estos siguen disponibles sin sesión. Los imports de las pantallas ya usan el alias `@/`, por lo que el movimiento no necesita cambiar sus referencias.

En web, `TabList` es hijo directo de `Tabs`, como requiere Expo Router. `TabList asChild` conserva `SafeAreaView` y los estilos de la barra; `StyleSheet.flatten` entrega el objeto de estilos que necesita ese componente. Los nombres, iconos y destinos de las cuatro pestañas se mantienen.

El registro permite elegir el rol antes del formulario y modificarlo dentro del formulario sin perder lo escrito. Al finalizar muestra una confirmación y el botón **Ir a Mi cuenta**. Las pantallas de autenticación redirigen una sesión existente a Mi cuenta cuando reciben el foco; una pantalla que quedó detrás no interrumpe el mensaje de éxito del registro.

## Pantallas y componentes visuales

- **Iniciar sesión:** marca y bienvenida, correo, contraseña con control de visibilidad, validación debajo de cada campo, error de credenciales y botón con indicador de carga.
- **Seleccionar rol:** tarjetas seleccionables para Vecino y Comercio, explicación de ambos y botón Continuar.
- **Registrarse:** nombre completo, correo, contraseña y confirmación con visibilidad independiente, selección de rol dentro del formulario, estados de carga, error y éxito.
- **Mi cuenta sin sesión:** bienvenida, beneficios concretos del perfil y accesos a inicio y registro.
- **Mi cuenta con sesión:** iniciales, nombre, correo, distintivo y explicación según el rol, tarjeta de datos, opciones deshabilitadas de Editar perfil y Configuración con la etiqueta Próximamente. Cerrar sesión requiere confirmar en un diálogo.

Los componentes de `src/components/autenticacion/` comparten campos, botones, enlaces, tarjetas, identidad de Cercau, selector de rol y diálogo de cierre. Reutilizan los colores de `src/constants/theme.ts`, con 20 px de margen horizontal y separaciones de 28 px entre secciones, como Buscar. Los formularios tienen ancho máximo para web, áreas seguras y desplazamiento con ajuste por teclado. Los campos incluyen etiquetas, ayudas, errores y foco visible; botones y roles informan su estado accesible.

En web, `src/hooks/use-color-scheme.web.ts` usa `useSyncExternalStore` para escuchar los cambios de `Appearance`. Esto mantiene fondos y textos sincronizados al cambiar entre claro y oscuro sin recargar. El HTML inicial conserva el tema claro para coincidir con la primera renderización del navegador.

## Responsabilidades

- `src/tipos/usuario.ts`: define el usuario, sus dos roles y los datos de los formularios.
- `src/servicios/autenticacion.ts`: simula iniciar sesión, registrarse y cerrar sesión con una demora de 700 ms. Valida los datos y genera errores controlados.
- `src/servicios/validaciones-autenticacion.ts`: comparte las reglas entre formularios y servicio; permite mostrar todos los errores de campos en un mismo intento.
- `src/servicios/almacenamiento-sesion.ts`: guarda, recupera y elimina la sesión. Usa SecureStore en Android/iOS y localStorage en web.
- `src/contextos/autenticacion.tsx`: comparte el usuario y el estado de carga entre las pantallas. Bloquea operaciones simultáneas y conserva el estado anterior si una operación falla.
- `src/components/autenticacion/`: controles visuales compartidos, mensajes de error e indicador de recuperación.
- Las pantallas llaman al proveedor. Los datos de las cuentas de prueba están en el servicio.

El proveedor expone `usuario`, `cargando`, `iniciarSesion`, `registrarse` y `cerrarSesion`. También expone `recuperandoSesion` y `errorRecuperacion` para distinguir la carga inicial de una operación del formulario.

## Alcance de la simulación

No hay backend, tokens reales ni verificación de identidad. Usar datos de prueba.

La sesión contiene un perfil con `id`, `nombre`, `email` y `rol`; nunca contiene la contraseña. Se recupera al volver a abrir la aplicación y se elimina al cerrar sesión. Una sesión corrupta se descarta y muestra un mensaje.

Las nuevas cuentas y sus contraseñas se mantienen **solo en memoria**. Es posible registrarse, cerrar sesión y volver a ingresar durante la misma ejecución. Al reiniciar o recargar JavaScript, esas cuentas se pierden, aunque el perfil de la sesión abierta se restaura. Si luego se cierra esa sesión, se debe registrar otra vez la cuenta o usar una cuenta de prueba. La persistencia del registro de usuarios corresponde al futuro backend.

Las siguientes cuentas existen en cada ejecución:

| Rol | Email | Contraseña de prueba |
| --- | --- | --- |
| Vecino | `vecino@cercau.test` | `Cercau123` |
| Comercio | `comercio@cercau.test` | `Cercau123` |

En web, localStorage permite probar la persistencia del perfil simulado. SecureStore es el almacenamiento usado en los celulares. No se configura biometría ni se solicitan permisos de Face ID.

## Validaciones automáticas

Desde `cercau`, en PowerShell:

```powershell
node --test .\tests\autenticacion.test.cjs
.\node_modules\.bin\tsc.cmd --noEmit
npx.cmd expo lint
```

Las 12 pruebas ejecutan el código real del servicio y las validaciones con almacenamiento simulado. Cubren registro, roles, validaciones por campo, confirmación de contraseña, credenciales incorrectas, duplicados, recuperación tras reiniciar el servicio, cierre de sesión, datos corruptos y fallos de almacenamiento. No reemplazan una prueba de SecureStore en un dispositivo.

Expo genera los tipos de rutas al iniciar Metro. Si después de agregar rutas TypeScript todavía muestra rutas antiguas, ejecutar `npx.cmd expo start` y volver a comprobar los tipos.

## Comprobación manual en el celular

1. Ejecutar `npx.cmd expo start` desde `cercau`. Abrir el proyecto con Expo Go compatible con SDK 57, escaneando el QR; la computadora y el celular deben compartir red.
2. Sin sesión, recorrer Buscar, Promociones y Mapa. Deben seguir accesibles y mantener su apariencia.
3. En Mi cuenta, tocar Crear una cuenta, elegir Vecino, tocar Continuar y completar el formulario con datos de prueba. Cambiar a Comercio dentro del formulario y comprobar que se conserva lo escrito.
4. Crear la cuenta, comprobar el mensaje de éxito y tocar Ir a Mi cuenta. Debe mostrar iniciales, nombre, email y el rol elegido.
5. Cerrar completamente la app y volver a abrir el proyecto. Mi cuenta debe recuperar el mismo perfil.
6. Tocar Cerrar sesión y cancelar con Seguir en mi cuenta: el perfil debe permanecer. Luego cerrar confirmando, volver a abrir la aplicación y comprobar que Mi cuenta ofrece Iniciar sesión y Crear una cuenta.
7. Iniciar sesión con cada cuenta de prueba de la tabla. Probar una contraseña incorrecta y comprobar que aparece un mensaje.
8. Probar un email inválido, un nombre vacío, una contraseña corta, dos contraseñas distintas y un email ya registrado durante la misma ejecución.
9. Probar la flecha Volver, el botón Atrás de Android y los enlaces entre formularios. Tras ingresar, Atrás no debe mostrar un formulario utilizable con una sesión abierta.
10. Mostrar y ocultar ambas contraseñas, comprobar que conservan lo escrito y revisar los formularios con el teclado abierto. Probar Siguiente para pasar de campo y el envío desde el teclado.
11. Comprobar que Editar perfil y Configuración indican Próximamente y no navegan ni producen errores.
12. Revisar tema oscuro, tamaño de texto aumentado y VoiceOver/TalkBack. Confirmar que se leen las etiquetas y los estados de botones y roles.

El indicador de recuperación se muestra en Mi cuenta y en las pantallas de autenticación. Buscar, Promociones y Mapa permanecen disponibles durante esa recuperación.

## Verificación completada el 4 de octubre de 2026

- Rama comprobada: `mica`. Cambios conservados sin hacer commit.
- Buscar, Promociones y Mapa se compararon con los archivos originales de Git: su contenido es idéntico. No hay rutas duplicadas.
- TypeScript, lint y las 12 pruebas: aprobados.
- Exportación de Android, iOS y web: aprobada. Resultado local en `dist/validacion-cuenta-20261004`. Después del ajuste del tema web se volvió a exportar esa plataforma en `dist/validacion-cuenta-web-20261004`.
- Recorrido automatizado en navegador: inicio de sesión, errores por campo y de credenciales, mostrar/ocultar contraseña, selección y cambio de rol, registro con confirmación de éxito, perfil, cancelación y confirmación del cierre, restauración de sesión tras recargar y acceso público a las otras pestañas. También se comprobó que una sesión abierta redirige desde el login hacia Mi cuenta.
- Capturas revisadas a 390 px y login a 320 px, sin desbordamiento horizontal. También se verificó el cambio entre claro y oscuro sin recargar, y la recarga en oscuro. Están en `.expo/revision-ui`, fuera de Git.
- El informe del navegador separa los errores de la extensión React Developer Tools de Edge. El recorrido terminó sin excepciones de la aplicación.

La reanudación corrigió errores de comillas y esperas del script local de revisión. La revisión visual detectó y corrigió una actualización incompleta del tema web: algunos fondos quedaban claros al cambiar a oscuro. Se ajustó el hook compartido, conservando las pantallas, los componentes y la paleta existentes.

**Pendiente en dispositivo físico:** comprobar el almacenamiento nativo de SecureStore al cerrar y reabrir la app, el teclado, las áreas seguras y VoiceOver/TalkBack. Las pruebas de almacenamiento usan un sustituto de SecureStore; la recarga comprobada en navegador usa localStorage. No equivalen a una prueba del almacenamiento nativo en un celular.

## Documentación consultada

- [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/).
- [Autenticación con Expo Router](https://docs.expo.dev/router/advanced/authentication/).
- [Organización de stacks y tabs](https://docs.expo.dev/router/basics/common-navigation-patterns/).
- [Ajustes por teclado](https://reactnative.dev/docs/keyboardavoidingview).
- [Accesibilidad de React Native](https://reactnative.dev/docs/accessibility).
- [Sincronización de estado externo en React](https://react.dev/reference/react/useSyncExternalStore).
- [Cambios de apariencia](https://reactnative.dev/docs/appearance).
