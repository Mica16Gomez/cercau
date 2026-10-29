# Cierre funcional del módulo de cuenta — 20 de octubre de 2026

> Documento histórico. La autenticación local fue reemplazada por la API del profesor. Ver [Autenticación con la API](autenticacion-api.md) para el estado vigente.

## Alcance y estado anterior

Ya existían el contexto de autenticación, los formularios con validaciones, la selección de rol, el almacenamiento de un perfil con SecureStore, el control para ver/ocultar contraseñas, la confirmación de logout, los componentes visuales y 12 pruebas con Node.

Faltaban token, credenciales locales recuperables después de reiniciar, favoritos por usuario, preferencias, edición de nombre, protección declarativa de rutas y biometría real. Los corazones pertenecían a Buscar y se perdían al recargar. Editar, Favoritos y Mis reseñas mostraban avisos; Seguridad y Face ID estaban deshabilitados. Google era un botón informativo.

Se completan los servicios y los accesos de este módulo conservando paleta, tipografías, ilustraciones, logo, tarjetas y barra inferior. La eliminación de Google incluye su botón, separador, estilos, handler y SVG. No se modifican las funciones de Promociones, Mapa, QR, reseñas, fotos o video. Los registros ficticios del catálogo mantienen los mismos valores.

## Modelo y arquitectura

`Usuario` centraliza `id`, `nombre`, `email`, `rol`, `comercioId`, `favoritos`, `rubrosDeInteres`, `avisosActivos` y `biometriaActiva`. Un vecino siempre tiene `comercioId: null`. El perfil no permite cambiar el rol, correo ni asociación. Un comercio nuevo queda sin asociación hasta que el módulo responsable la gestione; el comercio demo conserva su id real del catálogo ficticio.

Las pantallas del módulo usan servicios asíncronos. `comercios.ts` adapta los catálogos existentes y sus fotos locales. Solo se almacenan los ids de favoritos: la lista resuelve las tarjetas con ese servicio. No existe ruta de detalle de comercio en este checkout, por lo que no se agrega un botón que prometa abrirla.

El contexto es la fuente única de sesión, perfil, favoritos y preferencias. Su referencia de operación impide dos envíos incluso antes del siguiente render. Los cambios de cuenta actualizan la interfaz en el momento; un fallo revierte al usuario anterior y permite reintentar. Las consultas descartan respuestas que llegan después de cambiar de usuario o pantalla. Los mensajes de error se convierten en textos comprensibles en la capa de servicios.

## Almacenamiento

| Dato | Android/iOS | Navegador |
| --- | --- | --- |
| Token, id de sesión y vencimiento | SecureStore: `cercau.sesion.v2` | Solo memoria; recargar pide login |
| Nombre, correo, rol, comercioId | SQLite/kv-store: `cercau.usuario.v1.<id>` | localStorage, con la misma separación por id |
| Ids de favoritos, rubros, avisos y elección biométrica | Mismo registro de usuario en SQLite | Mismo registro de usuario en localStorage |
| Verificador de una cuenta registrada | SecureStore: `cercau.credencial.v1.<resumen-del-email>` | localStorage; solo para la autenticación simulada |
| Contraseña escrita | No se persiste | No se persiste |

El verificador es un resumen SHA-256 de una sal aleatoria y la contraseña, guardado fuera de la sesión. Permite reconocer cuentas locales después del logout/reinicio sin persistir el texto de la contraseña. **Es un mecanismo para esta simulación local, no un sistema de contraseñas de producción.** El backend futuro deberá validar credenciales con un mecanismo adecuado en servidor y emitir sus propios tokens.

El token usa 32 bytes criptográficamente aleatorios, vence a los 30 días y se reemplaza en cada registro/login. Nunca se guarda en SQLite, kv-store ni localStorage, ni se expone en el contexto o consola. En nativo se usa `WHEN_UNLOCKED_THIS_DEVICE_ONLY`. No hay API remota ni secretos de servidor en este módulo.

Logout elimina la sesión segura antes de limpiar al usuario del contexto. Si falla el borrado, se informa el fallo y se conserva la sesión visible para reintentar. Favoritos, preferencias, perfil y verificador no se borran. Una sesión corrupta o vencida se descarta; un perfil local corrupto se informa y se conserva para evitar pérdida de datos. Las sesiones antiguas sin token requieren un nuevo ingreso. Las cuentas creadas en la etapa anterior no tenían credenciales persistentes; si no eran demo, requieren registrarse en el nuevo servicio local.

## Rutas y acciones privadas

El Stack raíz mantiene `(tabs)` público. `Stack.Protected` permite login, selección de rol y registro cuando no hay usuario y permite Editar perfil, Favoritos, Seguridad/preferencias, Mis reseñas y la confirmación Cuenta creada cuando hay sesión. La recuperación inicial muestra carga antes de montar la navegación, sin mostrar fugazmente un perfil equivocado.

Un enlace privado sin sesión vuelve al grupo público. Un corazón sin sesión abre el login. Login usa `replace('/mi-cuenta')`; el registro inicia sesión y usa `replace('/cuenta-creada')` para conservar su confirmación visual original en una ruta privada. Su botón Ir a Mi cuenta también usa `replace`. Al cambiar el guard se eliminan las entradas de autenticación del historial. Logout elimina las entradas privadas y deja la bienvenida pública de Mi cuenta. Los servicios también comprueban que el usuario de una escritura coincida con la sesión persistida.

Las acciones privadas futuras deben comprobar `useAutenticacion().usuario`; no basta con mostrar u ocultar el botón. `actualizarCuenta` y `obtenerMisResenas` ya validan la sesión para sus operaciones. Los módulos de promociones personales y creación de reseñas todavía no existen aquí y deberán incorporar su propia protección al integrarse.

## Biometría

1. Registrar o iniciar sesión primero con correo y contraseña.
2. El dispositivo se consulta sin abrir diálogos: hardware, configuración, tipos soportados y nivel de seguridad.
3. Activar el interruptor de Mi cuenta solicita validación nativa. Solo el éxito guarda la preferencia.
4. Al reabrir o pasar la app a segundo plano, el perfil de una sesión con biometría activa queda bloqueado. No se publica ese usuario en el contexto hasta validarlo.
5. En Mi cuenta, abrir Iniciar sesión y tocar la tarjeta Ingreso rápido. Ese toque solicita la verificación; no se dispara automáticamente al renderizar.
6. Cancelación, fallo, tiempo agotado, bloqueo, falta de configuración o de hardware muestran mensajes claros. El formulario de correo y contraseña sigue disponible.
7. Logout o vencimiento impiden recuperar el acceso con biometría: hace falta ingresar nuevamente con credenciales.

`solicitarValidacionBiometrica` centraliza la solicitud nativa y bloquea solicitudes simultáneas. `validarAccionComercio` del contexto exige un usuario activo, sesión coincidente, rol comercio y `comercioId`; luego solicita biometría para que el módulo QR pueda usarla antes de una acción sensible. No abre cámara ni escanea códigos.

El permiso Face ID se declara con el mismo mensaje en los plugins de `expo-local-authentication` y SecureStore en `app.json`, sin modificar los demás datos de la aplicación. La inspección de configuración detectó que el valor anterior `faceIDPermission: false` de SecureStore eliminaba ese permiso; por eso se alinean ambos. No se usa `requireAuthentication` sobre las claves: el diálogo lo solicita LocalAuthentication.

En iPhone, Face ID **no funciona en Expo Go** y necesita una development build con ese permiso. En Android se admite huella/biometría de alta seguridad; una cara de baja seguridad no habilita el acceso. La falta de biometría no impide usar Cercau con correo y contraseña. Las pruebas automatizadas simulan las respuestas nativas; no prueban el sensor físico.

## Mi cuenta e integraciones

| Acceso | Resultado |
| --- | --- |
| Editar perfil | Valida y guarda el nombre; muestra éxito/error y conserva correo/rol/comercio |
| Favoritos | Lista real por usuario; quitar, vacío, carga, error y reintento |
| Mis reseñas | Consulta de lectura, lista o vacío real; carga/error/reintento |
| Seguridad | Abre seguridad y preferencias; consulta biométrica y reintento |
| Biometría | Enciende/apaga la preferencia con comprobaciones reales del dispositivo |
| Rubros | Selección múltiple del servicio del catálogo, sin duplicados, persistente |
| Avisos activos | Interruptor persistente por usuario, disponible en el contexto |
| Cerrar sesión | Confirmación, cancelación, borrado seguro y regreso público |

- Reseñas: `conectarConsultaResenas(consulta)` es el punto de integración de lectura del compañero. Sin un proveedor conectado devuelve una lista vacía; no genera opiniones. La creación, edición y eliminación pertenecen a ese módulo.
- Notificaciones: consumir `usuario.rubrosDeInteres` y `usuario.avisosActivos`. No se piden permisos ni se envían notificaciones desde cuenta.
- Gestión comercial: asociar cuentas comercio con el catálogo mediante el servicio que corresponda. El perfil no ofrece una reasignación libre.
- QR: consumir `validarAccionComercio`; no está implementado el escáner.
- Promociones personales: no hay registros ni servicio en este checkout. No se agrega una sección de datos inventados. La pestaña pública conserva su implementación.
- Háptica: `expo-haptics` no estaba instalado y no se agregó, respetando la condición del pedido.

## Archivos de esta entrega

Se conservan los cambios previos del usuario en `package.json` y `package-lock.json`. A ellos se agregan únicamente las tres dependencias autorizadas y su resolución compatible con Expo 57.

**Editados:**

- `README.md`, `app.json`, `package.json`, `package-lock.json`.
- `src/tipos/usuario.ts`.
- `src/servicios/autenticacion.ts`, `almacenamiento-sesion.ts`, `errores-autenticacion.ts`.
- `src/contextos/autenticacion.tsx`.
- `src/app/_layout.tsx`, `iniciar-sesion.tsx`, `registrarse.tsx`.
- `src/app/(tabs)/index.tsx`, `mi-cuenta.tsx`.
- `src/components/business-card.tsx`.
- `src/components/autenticacion/accesos-cuenta.tsx`, `cuenta-invitado.tsx`, `encabezado-cuenta.tsx`, `face-id-preparado.tsx`, `pantalla-autenticacion.tsx`.
- `src/data/search-businesses.ts`: centraliza los tipos; no cambia los valores del catálogo.
- `tests/autenticacion.test.cjs`.

**Agregados:**

- `src/tipos/comercio.ts`, `actividad.ts`.
- `src/servicios/almacenamiento-local.ts`, `almacenamiento-local.web.ts`, `cuenta.ts`, `comercios.ts`, `biometria.ts`, `actividad.ts`.
- `src/hooks/use-consulta.ts`, `use-favoritos.ts`, `use-biometria.ts`, `use-accion-cuenta.ts`.
- `src/components/autenticacion/pantalla-cuenta.tsx`.
- `src/app/editar-perfil.tsx`, `favoritos.tsx`, `ajustes-cuenta.tsx`, `mis-resenas.tsx`, `cuenta-creada.tsx`.
- `docs/cierre-modulo-cuenta.md`.

**Eliminado por el pedido de retirar Google:** `assets/images/referencia/google-g.svg`.

Las capturas, scripts y resultados de revisión en `.expo/revision-funcional-20261020` son archivos locales ignorados por Git. No se hace commit ni push, no se ejecuta `npm audit fix` y no se cambia el SDK.

## Pasos manuales en Android/iPhone

1. Abrir PowerShell en `C:\Users\mica_\Desktop\DesarrolloMovil\cercau`. Ejecutar `npx.cmd expo start` si no hay Metro activo. Abrir el proyecto mediante el QR en Expo Go compatible o en una development build. Compartir la misma red con la computadora.
2. **Navegación pública:** sin sesión, abrir Buscar, Promociones y Mapa. En Buscar, escribir `CAFE`: debe aparecer Café La Esquina. Tocar su corazón: debe abrir Iniciar sesión, sin guardar un favorito anónimo.
3. **Registro y validaciones:** ir a Mi cuenta → Crear una cuenta. Elegir Vecino → Continuar. Intentar enviar vacío; completar nombre, correo válido y una contraseña de al menos 8 caracteres. Probar confirmación diferente y corregirla. Crear cuenta: debe iniciar sesión automáticamente y mostrar la confirmación original con el nombre y rol elegido. Tocar Ir a Mi cuenta. Atrás no debe recuperar un registro utilizable.
4. **Comercio:** registrar otra cuenta eligiendo Comercio. El perfil debe mostrar ese rol y que aún no tiene asociación. No debe permitir cambiar el rol desde Editar perfil. La cuenta demo `comercio@cercau.test` / `Cercau123` sí debe mostrar Panadería La Esquina.
5. **Persistencia nativa:** con una cuenta abierta y biometría apagada, cerrar completamente Cercau y volver a abrir. Esperar el indicador de recuperación; debe aparecer el mismo perfil. En web, recargar debe pedir login y conservar los datos al volver a ingresar.
6. **Login:** cerrar sesión e ingresar con la cuenta registrada o con `vecino@cercau.test` / `Cercau123`. Probar contraseña incorrecta; mostrar y ocultar el texto; corregir e ingresar. Atrás no debe volver a un formulario activo. Tocar varias veces durante el envío debe producir un solo ingreso.
7. **Favoritos:** desde Buscar, guardar Café La Esquina. Ir a Mi cuenta → Favoritos y comprobar tarjeta, imagen y datos. Volver a Buscar: el corazón sigue marcado. Quitar desde Favoritos y comprobar vacío; volver a Buscar y verificar corazón apagado. Guardar dos comercios y reiniciar: deben mantenerse.
8. **Dos usuarios:** guardar un favorito y un rubro con el usuario A, cerrar sesión y entrar con B. No deben aparecer los de A. Guardar otros con B, cerrar y volver con A: debe recuperar los suyos. Repetir después de cerrar y abrir la app.
9. **Perfil:** Mi cuenta → Editar perfil. Intentar guardar vacío y comprobar el error. Guardar un nombre válido; volver: saludo e inicial se actualizan. Reiniciar e ingresar: el nombre se conserva; correo, rol y comercio no cambian.
10. **Rubros:** Mi cuenta → Seguridad → Rubros de interés. Encender dos y apagar uno. Volver y reabrir: se conserva exactamente la selección. Reiniciar y comprobar lo mismo. No debe haber duplicados ni aparecer la selección en otra cuenta.
11. **Avisos:** en esa pantalla, cambiar Avisos activos, volver, reabrir y reiniciar. Debe conservar el valor de esa cuenta. No debe enviar notificaciones de prueba.
12. **Actividad:** Mi cuenta → Mis reseñas. Sin proveedor conectado, debe mostrar el estado vacío y permitir Actualizar. No debe mostrar mensajes de una etapa futura ni registros ficticios.
13. **Logout:** tocar Cerrar sesión, cancelar con Seguir en mi cuenta y comprobar el perfil. Repetir confirmando: aparece la bienvenida pública. Atrás no recupera datos privados. Reiniciar: continúa sin sesión. Entrar otra vez: favoritos y preferencias siguen guardados.
14. **Rutas protegidas:** sin sesión abrir un enlace a `/favoritos`, `/editar-perfil`, `/ajustes-cuenta` o `/mis-resenas`: debe quedar en contenido público sin revelar datos. Con sesión, los accesos de Mi cuenta sí abren sus pantallas. Login/registro no deben permanecer disponibles para una cuenta abierta.
15. **Huella Android:** configurar bloqueo y huella en Ajustes del teléfono. Ingresar primero con correo; activar Huella digital en Mi cuenta y completar el diálogo. Enviar la app a segundo plano y volver, o cerrarla y reabrirla. Abrir Iniciar sesión y tocar Ingreso rápido. Probar éxito, cancelar y una huella incorrecta. Cancelar no debe bloquear el formulario de correo. Probar dispositivo sin huellas: debe explicar la alternativa.
16. **Face ID iPhone:** en Expo Go debe informar que requiere development build y permitir el formulario. Para probar el sensor usar una development build que incluya el permiso configurado; repetir activación, segundo plano, reingreso y cancelación. No es posible validar Face ID físico con la revisión web.
17. **Usabilidad:** revisar a 320 px, texto aumentado y tema oscuro. En los formularios, abrir el teclado y recorrer los campos con Siguiente; el botón debe poder alcanzarse desplazando. Revisar VoiceOver/TalkBack, áreas seguras, etiquetas de corazones e interruptores y que el contenido no quede tapado por la barra inferior.
18. **Sin conexión:** después de ingresar, activar modo avión. Abrir favoritos y preferencias, modificar y reiniciar. Los datos y fotos locales deben seguir disponibles; volver a desactivar modo avión al terminar.

## Validación técnica

Comandos desde `cercau`:

```powershell
npx.cmd tsc --noEmit
npm.cmd run lint
npx.cmd expo-doctor
node --test tests/autenticacion.test.cjs
git diff --check
```

La validación inicial pasó TypeScript, ESLint y las 12 pruebas anteriores. La ampliación de pruebas cubre 26 casos de servicios, almacenamiento separado, fallos, reingreso y resultados biométricos.

| Comprobación final | Resultado |
| --- | --- |
| `npx.cmd tsc --noEmit` | Aprobado, sin errores |
| `npm.cmd run lint` | Aprobado, sin errores ni advertencias |
| `npx.cmd expo-doctor --verbose` | **21/21 controles aprobados** |
| `node --test tests/autenticacion.test.cjs` | **26/26 pruebas aprobadas** |
| `git diff --check` | Aprobado |
| Configuración nativa inspeccionada | Face ID con mensaje en español; permisos biométricos Android declarados |
| Exportación final de Android, iOS y web | Aprobada con el código final, incluida la confirmación de registro |
| Recorrido automatizado en navegador | Registro, confirmación original, login, logout, rutas privadas, dos cuentas, favoritos, perfil, rubros, avisos, recarga y fallo de escritura con reintento: aprobados |
| Revisión de tamaños y tema | 320, 390, 430 y 768 px; modo oscuro y recarga en oscuro; sin desborde horizontal |
| Comparación de alcance con Git | Tema, logo, encabezados de Buscar, ilustraciones, barra inferior, Promociones, Mapa, estilos de Buscar/tarjetas/perfil y valores de los catálogos conservados |

El recorrido final terminó sin excepciones de la aplicación. Las excepciones de la extensión **React Developer Tools** se identificaron por su contexto `chrome-extension://` y quedaron registradas por separado en `.expo/revision-funcional-20261020/resultado.json`. Las capturas están en esa misma carpeta local.

La exportación se encuentra en `dist/validacion-cuenta-final-20261020`. Es una comprobación de empaquetado, no una instalación ni prueba del sensor en un teléfono. El primer intento encontró `hermesc.exe: permission denied` al usar temporales externos; el reintento autorizado con temporales dentro del proyecto aprobó las tres plataformas. Para reproducir esa alternativa en PowerShell:

```powershell
New-Item -ItemType Directory -Force -Path '.expo\temp-export' | Out-Null
$env:TEMP = Join-Path (Get-Location) '.expo\temp-export'
$env:TMP = $env:TEMP
npx.cmd expo export --platform all --output-dir dist/validacion-cuenta-final-20261020
```

Estos valores de TEMP/TMP solo afectan la sesión de PowerShell en la que se ejecutan. El servidor Metro previo del proyecto se conserva; `/status` del puerto 8081 respondió `packager-status:running`.

**Pendiente de dispositivo físico:** SecureStore/SQLite reales al cerrar el proceso, el sensor biométrico, teclado y áreas seguras nativas y VoiceOver/TalkBack. Las pruebas con sustitutos y el navegador no equivalen a esas comprobaciones.
