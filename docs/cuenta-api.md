# Perfil, preferencias y favoritos con la API

Etapa del 26/10/2026, rama `mica-api`, Expo SDK 58. Se conserva el contexto de autenticación como fuente global de sesión. No se agregan dependencias ni se modifica el repositorio de la API.

## Contratos comprobados

Se leyeron controladores, DTO, tipos de `contract/`, semillas y decisiones de la API. También se consultó `/docs-json` del Docker en ejecución, usando la URL existente de `.env.local`.

| Endpoint | Cuerpo y respuesta |
| --- | --- |
| `GET /yo` | Bearer. `200 { datos: Usuario, meta: null }`. Incluye `id`, `nombre`, `email`, `rol`, `comercioId`, `favoritos: string[]`, `rubrosDeInteres: string[]`, `avisosActivos: boolean`. |
| `PATCH /yo` | Bearer. Sólo `{ nombre?, rubrosDeInteres?, avisosActivos? }`. Devuelve el usuario completo en el mismo sobre. Los campos omitidos se conservan; `[]` vacía intereses y `false` desactiva avisos. |
| `GET /rubros` | Público, lista paginada `{ datos: Rubro[], meta: { total, pagina, porPagina } }`. Rubro contiene `id`, `nombre`, `icono`, `color`, `orden`. Máximo 100 por página. |
| `PUT /yo/favoritos/:comercioId` | Bearer, sólo vecinos, sin cuerpo. Idempotente; `200 { datos: Usuario, meta: null }`. |
| `DELETE /yo/favoritos/:comercioId` | Bearer, sólo vecinos. Idempotente; `204` sin cuerpo, también si el favorito no existía. |
| `GET /comercios` | Público, paginado; hasta 1000 por página. Sólo activos. Filtros usados: `q` y `rubroId`. |
| `GET /comercios/:id` | Público. `200 { datos: Comercio, meta: null }`. También devuelve comercios dados de baja (`activo: false`). |

El DTO admite nombre de 1–80 caracteres y hasta 50 intereses; la interfaz conserva su validación anterior de nombre de 2–80 caracteres. Un rubro inexistente produce `422 RUBRO_NO_ENCONTRADO`, sin guardar ningún campo del PATCH. Un comercio inexistente produce `404 COMERCIO_NO_ENCONTRADO`; un rol no permitido, `403 SIN_PERMISO`.

## Responsabilidades y estado

- `autenticacion.ts` toma perfil, favoritos y preferencias remotos al ingresar o recuperar `/yo`. Del perfil local sólo conserva `biometriaActiva`.
- `cuenta.ts` arma el PATCH con los campos permitidos. Email, rol, token, biometría y favoritos no se envían por ese endpoint. Los favoritos tienen un servicio separado.
- El contexto comparte el cambio optimista, bloquea dobles operaciones y confirma el usuario devuelto por la API. Si falla, repone el estado anterior. Ante un 401 conserva el cierre de sesión y nunca repone el usuario anterior.
- DELETE no se interpreta como JSON: el 204 confirma la eliminación. Al reabrir, `/yo` recupera la lista real. Respuestas posteriores a un logout o cambio de token no autorizan al usuario anterior.
- Todas las peticiones pasan por el mismo Axios y sus interceptores. Los errores son españoles y no exponen respuestas internas ni credenciales.
- Preferencias conserva sus interruptores y estados de carga, vacío, error, éxito y reintento. No se piden permisos ni se envían notificaciones.
- Las listas recorren todas las páginas. Las consultas simultáneas de rubros o de una misma búsqueda comparten la petición en curso; no hay caché permanente de red.

## Buscar y Favoritos

Los tres identificadores ficticios anteriores no existen en la API. Con autorización del usuario se conservan los controles, estilos y navegación, mostrando los rubros reales en los chips y los comercios de `/comercios`. Cada tarjeta conserva el id recibido y resuelve el rubro por `rubroId`; no hay identificadores de semillas escritos en la aplicación ni relaciones por nombre.

La API devuelve nombre, dirección, rubro, puntaje, horarios y estado activo. La dirección ocupa el espacio de la distancia: no se inventan metros ni se agrega ubicación. Abierto/cerrado se calcula con los horarios en `America/Argentina/Buenos_Aires`, incluyendo horarios nocturnos e inactivos. La tarjeta conserva su ilustración; no se integran fotos ni video. Las relaciones inválidas muestran un error en lugar de datos ficticios.

Favoritos consulta el detalle de cada id de `/yo`, sin duplicados, incluso si el comercio está inactivo. Si un detalle no puede recuperarse, muestra error y reintento; no lo oculta silenciosamente. Promociones, Mapa y Reseñas conservan su implementación anterior.

## Qué queda local

- Token en SecureStore nativo; en web, sólo en memoria.
- Preferencia y verificación biométrica del dispositivo.
- Caché de cuenta existente para conservar la elección biométrica; sus valores de perfil, intereses, avisos o favoritos no tienen prioridad sobre la API.
- Los datos anteriores de los otros módulos y el punto de integración de Reseñas.

Los datos ficticios anteriores se conservan en sus archivos y no se importan al servidor. Esta etapa no ofrece funcionamiento sin conexión ni una cola de sincronización.

## Validaciones

- `npx.cmd tsc --noEmit`: aprobado.
- `npm.cmd run lint -- --no-cache`: aprobado, sin advertencias.
- `node --test --test-reporter=spec tests/autenticacion.test.cjs`: 60/60 aprobadas, ninguna omitida. Incluyen servicios e interceptores reales y acciones del contexto con almacenamiento y respuestas controlados.
- `npx.cmd expo-doctor@latest`: 20/20 controles aprobados.
- Servicios de Cercau contra Docker: ingreso, `/yo`, 9 rubros, 39 comercios, PATCH de perfil/preferencias, PUT, reconstrucción de favoritos, DELETE 204, rechazo 422 sin cambios parciales y cierre por 401. La cuenta demo de vecino recuperó al finalizar su nombre, intereses, avisos y favoritos originales. Credenciales y tokens sólo estuvieron en memoria.

Los sustitutos de SecureStore/SQLite no verifican el almacenamiento físico del iPhone ni el sensor biométrico. El recorrido físico siguiente queda pendiente.

## Recorrido exacto en iPhone

1. Dejá Docker ejecutándose y conectá computadora e iPhone a la misma Wi-Fi. Conservá `.env.local`, cuya URL debe ser accesible desde el teléfono.
2. Desde `C:\Users\mica_\Desktop\DesarrolloMovil\cercau`, ejecutá `npx.cmd expo start --go --clear`. Abrí el QR con la cámara del iPhone y Expo Go para SDK 58.
3. En Buscar, comprobá los nombres y rubros reales. Deslizá los chips y elegí un rubro; buscá por nombre. Las tarjetas muestran dirección e ilustración.
4. Entrá en Mi cuenta con una cuenta de **vecino**. En Editar perfil, modificá el nombre y tocá Guardar nombre. Debe aparecer el éxito y verse el nombre nuevo en Mi cuenta y Buscar.
5. Abrí Mi cuenta → Seguridad. En Rubros de interés activá dos rubros reales y desactivá uno. Cambiá Avisos activos. Esperá la confirmación de cada guardado.
6. En Buscar, tocá el corazón de un comercio. En Mi cuenta → Favoritos debe aparecer ese comercio. Quitalo y comprobá que el corazón de Buscar cambie. Agregalo nuevamente para probar persistencia.
7. Cerrá Cercau completamente y volvé a abrirlo. Sin biometría activa debe consultar `/yo` y recuperar nombre, intereses, avisos y favoritos. Si usás biometría en una compilación compatible, completá Ingreso rápido.
8. Cerrá sesión y entrá con otra cuenta: no debe heredar datos. Volvé a ingresar con la primera y comprobá los cambios guardados.
9. Para probar errores, desactivá Wi-Fi y datos móviles antes de tocar un corazón o una preferencia. Esperá el error (timeout máximo 12 segundos): debe revertirse el valor. Recuperá la conexión y usá Reintentar guardado.
10. Una cuenta sin favoritos debe mostrar el estado vacío. El 401 se cubre automáticamente; para forzarlo manualmente hace falta un token vencido/rechazado. No se agrega una herramienta para alterar tokens a la interfaz.

Face ID no funciona dentro de Expo Go en iPhone: requiere una development build. Se conserva la alternativa de correo y contraseña.
