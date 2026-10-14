# Barrio contemporáneo — Cercau

Revisión del 13 de octubre de 2026. Mi Cuenta se conserva como referencia visual: encabezado barrial, perfil, saludo y grilla. Esta etapa completa Inicio/Buscar y unifica el logo y los colores de la app. No se agregaron dependencias, no se cambió la navegación y no se hizo commit ni push.

## Paleta y componentes compartidos

| Color | Valor | Uso |
| --- | --- | --- |
| Verde bosque | `#173F35` | Texto principal, encabezados verdes y chips seleccionados. |
| Verde principal | `#2F735B` | Botones primarios y detalles. |
| Crema | `#FFF8E8` | Fondo claro y texto sobre encabezados verdes. |
| Salvia | `#DCEADF` | Selecciones, tarjetas y vegetación. |
| Terracota | `#D96C4A` | Acentos del logo, techos y detalles. |
| Mostaza | `#E3A72F` | Estrellas y detalles de promociones e ilustraciones. |

El tema oscuro adapta las superficies y el texto para mantener la lectura. Los botones principales siguen verdes en ambos temas. Los botones secundarios usan la superficie clara del tema; los errores y acciones de salida usan un terracota más oscuro en claro y más claro en oscuro para que el texto se lea sobre su fondo.

`LogoCercau` reúne la palabra Cercau y tres acentos terracota. Su variante `claro` usa el texto del tema; `verde` usa crema. El componente reserva espacio para los acentos y permite reducir el tamaño de la palabra si el ancho disponible es pequeño. No contiene el cuadrado con la hoja.

El logo se usa directamente en Buscar, en el encabezado de Mi Cuenta y en `PantallaAutenticacion`. Esa pantalla compartida cubre login, selección de rol, registro y registro exitoso. Mi Cuenta usa el mismo encabezado con y sin sesión.

## Inicio/Buscar

- Encabezado con logo, saludo si hay sesión, título “Encontrá lo mejor de tu barrio”, subtítulo “Comercios, promos y lugares cerca tuyo.” e ilustración barrial.
- Buscador sobre una superficie clara, bordes redondeados y sombra suave. Conserva su etiqueta, placeholder, teclado y eventos.
- Categorías con chips, iconos y detalles suaves salvia, terracota y mostaza. La selección usa verde bosque y crema.
- Tarjetas con iniciales por rubro, nombre, categoría, distancia, calificación, estado y franja de promoción. El corazón conserva su acción y cambia visualmente al seleccionar.
- Se retiró el texto visible “Comercios ficticios · Distancias de ejemplo”. Los datos siguen siendo locales y no se agregó ubicación real.
- Se aumentó el espacio inferior del contenido. La barra conserva Buscar, Promociones, Mapa y Mi cuenta, con los colores nuevos y énfasis en la pestaña seleccionada.

La búsqueda continúa en `filterBusinesses`, las categorías siguen siendo las mismas y los favoritos continúan en memoria. El saludo solo lee el usuario existente del contexto.

## Login e ilustración

`BarrioIlustrado` conserva la escena aprobada de Mi Cuenta y agrega la variante `login`: tres construcciones con alturas diferentes, techos, ventanas, puertas, un árbol, dos arbustos, farol y vereda. Son vistas de React Native; no usa imágenes externas ni círculos flotantes.

Login solicita el encabezado compacto. Se redujeron altura del dibujo, tamaño del título, espacios y rellenos. Los textos, campos, validaciones, errores, carga y envío del formulario se conservan. Registro y selección de rol usan el mismo logo y la nueva escena con su presentación habitual.

Se conservaron `SafeAreaView` y los ajustes automáticos de `ScrollView` de las pestañas nativas. Los formularios mantienen su contenedor de teclado y sus áreas seguras. El botón Volver reserva su ancho para que el logo no lo invada.

## Archivos de esta etapa

| Archivo | Cambio |
| --- | --- |
| `src/components/logo-cercau.tsx` | Componente nuevo y único del logo. |
| `src/constants/theme.ts` | Paleta exacta, variantes oscuras y color de botones. |
| `src/app/(tabs)/index.tsx` | Presentación de Buscar y saludo de sesión. |
| `src/components/business-card.tsx` | Tarjetas compactas, iniciales, corazones y promociones. |
| `src/components/app-tabs.tsx`, `app-tabs.web.tsx` | Colores de la pestaña seleccionada, conservando destinos. |
| `src/components/autenticacion/identidad-cuenta.tsx` | Se retiró la implementación duplicada del logo; conserva los demás componentes. |
| `src/components/autenticacion/encabezado-cuenta.tsx` | Usa el logo compartido, conservando la composición aprobada. |
| `src/components/autenticacion/barrio-ilustrado.tsx` | Agrega la escena del login. |
| `src/components/autenticacion/encabezado-barrial.tsx` | Usa la escena nueva y admite una presentación compacta. |
| `src/components/autenticacion/pantalla-autenticacion.tsx` | Logo compartido y espacios compactos opcionales. |
| `src/app/iniciar-sesion.tsx` | Activa únicamente la presentación compacta. |
| `src/components/autenticacion/controles.tsx` | Colores de botones primarios y secundarios; salida con texto legible. |
| `src/components/autenticacion/accesos-cuenta.tsx` | Texto terracota de mayor contraste, manteniendo acciones y estados. |
| `docs/identidad-visual.md` | Guía de diseño y verificación. |

## Verificación

Comandos de comprobación:

```powershell
npm.cmd run lint -- --no-cache
.\node_modules\.bin\tsc.cmd --noEmit
node --test tests/autenticacion.test.cjs
.\node_modules\.bin\expo.cmd export --platform ios --output-dir .expo/validacion-redisenio-completo-ios --max-workers 2
```

Lint y TypeScript aprobaron sin advertencias ni errores; las 12 pruebas de autenticación aprobaron. El recorrido en navegador revisó búsqueda sin tildes y mayúsculas, combinación de categoría y texto, limpieza, favoritos al cambiar filtros, saludo con sesión, ambos roles, errores, registro, restauración de sesión, redirección con sesión abierta y cierre cancelado y confirmado. El interruptor Face ID sigue apagado y deshabilitado.

La exportación para iOS aprobó y generó el bundle en `.expo/validacion-redisenio-completo-ios`. También aprobó el cambio entre claro y oscuro, la recarga en oscuro y el regreso al tema claro.

Las capturas están en `.expo/redisenio-completo`, fuera de Git. Se revisaron Buscar y login a 390 y 320 px y en oscuro. El formulario de login comienza dentro de la pantalla pequeña y el logo permanece dentro de los márgenes laterales. El recorrido terminó sin excepciones de la aplicación.

Una comparación del código antes y después confirmó los estados, funciones y eventos de Buscar y login. Las huellas de los archivos comprobaron que no se modificaron registro, roles, Mi Cuenta, pantallas públicas restantes, servicios, SecureStore, contexto, datos, tipos, layouts, pruebas y dependencias.

## Prueba pendiente en iPhone

1. Abrir Buscar sin sesión. Escribir `cafe`, combinarlo con categorías, borrar el texto y limpiar los filtros. Marcar y desmarcar un favorito y cambiar de categoría.
2. Abrir login y revisar el logo completo, teclado, botón Volver y contraseña visible. Iniciar sesión con una cuenta de prueba.
3. Volver a Buscar y comprobar el saludo. Revisar el logo en Mi Cuenta y la grilla aprobada.
4. Recorrer selección de rol, registro y confirmación de registro para comparar todos los encabezados.
5. Revisar áreas seguras, texto aumentado, VoiceOver y tema oscuro. Confirmar que se puede llegar al último comercio por encima de la barra.
6. Cancelar y confirmar el cierre; cerrar y reabrir la app para comprobar SecureStore real. La revisión en navegador usa localStorage y no sustituye esa comprobación nativa.

## Documentación consultada

- [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/).
- [Pestañas nativas en SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/router/native-tabs/).
- [Texto en React Native 0.86](https://reactnative.dev/docs/0.86/text).
- [Sombras y estilos en React Native 0.86](https://reactnative.dev/docs/0.86/view-style-props).
- [ScrollView en React Native 0.86](https://reactnative.dev/docs/0.86/scrollview).
