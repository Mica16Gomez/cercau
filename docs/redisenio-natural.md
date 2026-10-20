# Rediseño natural contemporáneo

Revisión del 19 de octubre de 2026, en la rama `mica`.

## Alcance acordado

El cambio adapta la referencia visual a las funciones reales de Cercau. Después de inspeccionar el repositorio, se confirmó conservar las funciones y avisos actuales y rediseñar solamente su presentación.

- Buscar mantiene los tres comercios ficticios, categorías, búsqueda sin distinguir tildes ni mayúsculas, limpieza y favoritos en memoria.
- Login, selección de rol y registro mantienen campos, validaciones, foco ante errores, contraseña visible, estados de carga, ambos roles y confirmación de registro.
- La sesión conserva el servicio simulado, recuperación, persistencia y cierre con confirmación.
- Promociones y Mapa siguen en estado **Próximamente**. Promociones muestra las ofertas ficticias que ya existen en `businesses.ts`; el esquema del mapa es estático y decorativo.
- Editar perfil, Favoritos y Mis reseñas conservan sus avisos informativos. Seguridad y Face ID siguen deshabilitados. No se agregaron opciones de pago, notificaciones, ingreso con Apple ni recuperación de contraseña.
- No existían pantallas de edición de perfil ni detalle de comercio; no se crearon rutas para ellas, de acuerdo con la confirmación de alcance.

## Rutas conservadas

| Archivo en `src/app` | Dirección | Función |
| --- | --- | --- |
| `(tabs)/index.tsx` | `/` | Buscar, categorías y favoritos locales. |
| `(tabs)/explore.tsx` | `/explore` | Presentación de Promociones, próxima etapa. |
| `(tabs)/mapa.tsx` | `/mapa` | Presentación de Mapa, próxima etapa. |
| `(tabs)/mi-cuenta.tsx` | `/mi-cuenta` | Cuenta pública, sesión, avisos y cierre. |
| `iniciar-sesion.tsx` | `/iniciar-sesion` | Formulario de acceso. |
| `seleccionar-rol.tsx` | `/seleccionar-rol` | Primer paso de registro. |
| `registrarse.tsx` | `/registrarse` | Datos, rol y confirmación de registro. |

Los archivos `_layout.tsx` no cambiaron. Se conservaron los destinos internos y el ajuste de áreas seguras existente de las pestañas nativas.

## Tema y componentes

Los colores están centralizados en `src/constants/theme.ts`, con variantes claras y oscuras.

| Color base | Valor |
| --- | --- |
| Verde principal | `#285B47` |
| Texto oscuro | `#263A32` |
| Acción naranja | `#E47B3C` |
| Crema | `#F8F4EA` |
| Salvia | `#DDE8DF` |
| Blanco | `#FFFFFF` |
| Texto secundario | `#68766F` |
| Bordes | `#D9DED7` |
| Error | `#B6523A` |

Para lectura accesible, el texto secundario pequeño sobre crema usa `textSecondaryStrong` (`#606E67`, contraste 4,87:1). Sobre blanco se conserva el gris base (4,76:1). Los enlaces y pestañas activas usan un naranja más oscuro (`#A44818`, 5,43:1 sobre crema). El fondo del botón conserva el naranja pedido con texto oscuro (4,76:1). Los mensajes de error usan un fondo casi blanco (`#FFF7F3`, 4,66:1). No se usa texto blanco pequeño sobre el naranja porque su contraste es insuficiente.

Se agregaron `Radii`, `Typography` y `Spacing.page`. Se mantiene la tipografía configurada: la portada de Buscar usa la variante serif que ya estaba disponible en `Fonts`; no se agregó ninguna fuente.

Componentes nuevos en `components/interfaz.tsx`:

- `ScreenHeader`: logo y encabezado compacto.
- `SectionHeader`: títulos de sección.
- `SearchField`: buscador con limpiar y cerrar teclado.
- `CategoryChip`: categoría y estado seleccionado.
- `PromotionBadge`: etiqueta de promoción o próxima etapa.
- `EstadoInterfaz`: presentación común de carga, vacío, error, sin conexión y permiso denegado.

El componente de estados prepara su apariencia; no simula conectividad ni solicita permisos. Se utiliza para recuperar la sesión y mostrar búsquedas vacías. Los errores existentes siguen usando `MensajeError`.

Se reutilizaron `LogoCercau`, `CampoCuenta`, `BotonCuenta` (primario, secundario y salida), `BusinessCard`, `SelectorRol`, `AvatarCuenta` y `DistintivoRol`. `ProfileHeader` reúne el perfil en una cabecera verde; `SettingsRow` organiza las opciones conservando sus eventos. No se duplicaron componentes solo para cambiar sus nombres al inglés.

## Composición de las pantallas

- **Buscar:** portada salvia con un único dibujo barrial, búsqueda blanca, chips verdes, comercios con fotografías en una lista horizontal y estados claros. El título es “Destacados cerca de vos”.
- **Login:** logo equilibrado, lema y formulario blanco. Se mantiene la información de Face ID como próxima etapa, sin fingir un ingreso alternativo.
- **Registro:** progreso de dos pasos, campos agrupados y confirmación existente. No repite la ilustración de Buscar.
- **Promociones:** una oferta principal con foto y otra en formato de fila; ambas son ejemplos del directorio, sin acciones de canje ni vigencias inventadas.
- **Mapa:** vista esquemática amplia, pines decorativos y aviso de próxima etapa. No tiene ubicación real, selección de comercios, permisos ni navegación nueva.
- **Mi cuenta:** logo compacto, avatar, saludo, correo y rol; opciones agrupadas como filas en Mi actividad y Ajustes. Cerrar sesión conserva su confirmación.

## Archivos modificados y agregados

| Archivo | Cambio |
| --- | --- |
| `src/constants/theme.ts` | Paleta, variantes de contraste, radios, tamaños y espacio lateral. |
| `src/components/interfaz.tsx` (nuevo) | Encabezados, buscador, chips, etiquetas y estados. |
| `src/components/encabezado-buscar.tsx` | Portada salvia y sección de destacados. |
| `src/components/business-card.tsx` | Fotos locales, información y favorito superpuesto. |
| `src/data/business-images.ts` (nuevo) | Relación entre los comercios existentes y las fotos. |
| `assets/images/comercios/panaderia.jpg`, `cafe.jpg`, `farmacia.jpg` (nuevos) | Recursos visuales locales. |
| `src/app/(tabs)/index.tsx` | Integra los controles y las tarjetas conservando estados y filtros. |
| `src/components/coming-soon-screen.tsx` | Presentaciones diferentes de Promociones y Mapa. |
| `src/components/app-tabs.tsx`, `app-tabs.web.tsx` | Pestaña activa naranja y barra clara. |
| `src/components/autenticacion/controles.tsx` | Botones, errores, contraste y estado de carga. |
| `src/components/autenticacion/pantalla-autenticacion.tsx` | Marca, lema, progreso y estructura de formularios. |
| `src/components/autenticacion/encabezado-barrial.tsx` | Encabezado de formulario sin dibujo. |
| `src/app/iniciar-sesion.tsx` | Título y presentación de login. |
| `src/app/seleccionar-rol.tsx` | Indicador del primer paso. |
| `src/app/registrarse.tsx` | Título e indicador del segundo paso. |
| `src/components/autenticacion/encabezado-cuenta.tsx` | Cabecera compacta y `ProfileHeader`. |
| `src/components/autenticacion/accesos-cuenta.tsx` | Filas, secciones y `SettingsRow`, con los mismos avisos. |
| `src/components/autenticacion/face-id-preparado.tsx` | Información secundaria sin tarjeta adicional. |
| `src/components/autenticacion/identidad-cuenta.tsx` | Contraste del pie sobre crema. |
| `src/app/(tabs)/mi-cuenta.tsx` | Integra cabecera y filas sin cambiar la sesión. |
| `docs/identidad-visual.md` | Enlace a esta revisión conservando la documentación anterior. |
| `docs/redisenio-natural.md` (nuevo) | Alcance, decisiones, inventario y comprobación. |

No se modificaron dependencias, servicios, validaciones, contexto, tipos, datos del directorio, pruebas ni layouts. No se hizo commit ni push. Los scripts y capturas anteriores de `.expo/redisenio-completo` se conservaron; la nueva verificación queda en `.expo/redisenio-natural`, ignorada por Git.

## Comprobación

Comandos ejecutados desde la carpeta `cercau`:

```powershell
npm.cmd run lint -- --no-cache
.\node_modules\.bin\tsc.cmd --noEmit
node --test tests/autenticacion.test.cjs
node .expo/redisenio-natural/validar-ui.cjs
node .expo/redisenio-natural/validar-ui.cjs responsive
node .expo/redisenio-natural/validar-ui.cjs tema
node .expo/redisenio-natural/contraste.cjs
.\node_modules\.bin\expo.cmd export --platform ios --output-dir .expo/redisenio-natural/ios --max-workers 2
```

El recorrido funcional revisa búsqueda, filtros combinados, favoritos, errores, contraseña visible, ambos roles, registro, persistencia tras recarga, redirección con sesión abierta, avisos y cierre cancelado y confirmado. El recorrido de tamaños revisa seis pantallas a 320 y 768 px, con ambos temas, carga de fotografías y controles de al menos 44 px. Las capturas del recorrido funcional son de 390 px y también incluyen cuenta y login a 320 px.

La exportación nativa necesita que el entorno permita ejecutar Hermes. Ante el error de permisos, se reintentó fuera del entorno restringido, con `TEMP` y `TMP` apuntando a `.expo/redisenio-natural/tmp` para esa ejecución.

Resultados: ESLint sin errores ni advertencias; TypeScript sin errores; 12 de 12 pruebas de autenticación aprobadas; recorrido funcional sin excepciones; revisión de seis pantallas a 320 y 768 px aprobada en ambos temas; cambio de tema, recarga en oscuro y regreso a claro aprobados. La exportación de iOS terminó correctamente e incluyó las tres fotografías. `git diff --check` aprobó y la comparación de los archivos protegidos confirmó que se conservaron rutas, lógica y dependencias.

## Comprobar en el celular

1. Abrí Cercau desde el QR del servidor Expo que ya está en marcha. Si lo iniciás en otra ocasión, ejecutá `npx.cmd expo start` desde `cercau`.
2. En Buscar, escribí `CAFE`, combiná con Panaderías, borrá la búsqueda y limpiá filtros. Marcá un favorito, cambiá de categoría y volvé. Deslizá las tarjetas para ver los tres comercios.
3. Revisá Promociones y Mapa: tienen presentaciones distintas y conservan el aviso de próxima etapa.
4. En Mi cuenta, ingresá con `vecino@cercau.test` o `comercio@cercau.test`, contraseña `Cercau123`. Revisá contraseña visible, avisos, opciones deshabilitadas y cierre de sesión, cancelándolo primero.
5. Probá el registro con ambos roles y la confirmación de contraseña. Cambiar de rol debe conservar los demás campos escritos.
6. Revisá teclado abierto, último campo y botón al hacer scroll, pantalla pequeña, texto aumentado, VoiceOver o TalkBack, tema oscuro y áreas seguras. Cerrá y reabrí para comprobar SecureStore en el dispositivo.

La revisión web no comprueba teclado nativo, biometría, lectores de pantalla ni SecureStore real. La exportación de iOS comprueba compilación y recursos; no sustituye una prueba en un iPhone. No se realizó una ejecución nativa en Android.

## Fotografías y documentación técnica

Las fotos son ilustrativas y no representan a los comercios ficticios. Se guardaron en el proyecto para que no dependan de la red al abrir la app:

- Panadería: [Sergio Arze, Unsplash](https://unsplash.com/photos/bread-cWXibBbXx44).
- Café: [Nathan Dumlao, Unsplash](https://unsplash.com/photos/cappuccino-coffee-in-mug-tA90pRfL2gM).
- Farmacia: [David Trinks, Unsplash](https://unsplash.com/photos/a-pharmacy-shelf-filled-with-lots-of-medicine-bottles-mLaIFEtUZFs).

Para conservar las APIs de la versión instalada se consultaron [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/), [Expo Image](https://docs.expo.dev/versions/v57.0.0/sdk/image/), [Native Tabs](https://docs.expo.dev/versions/v57.0.0/sdk/router/native-tabs/) y [StyleSheet de React Native 0.86](https://reactnative.dev/docs/0.86/stylesheet).
