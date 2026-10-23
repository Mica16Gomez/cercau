# Autenticación con la API del profesor

Etapa del 23/10/2026, rama `mica-api`. Se conserva Expo SDK 57, las rutas, las pestañas, los componentes y sus estilos. No se cambia la API.

## Configuración y contrato

- `.env.local` define `EXPO_PUBLIC_API_URL` y queda ignorado mediante la regla existente `.env*.local`. `.env.example` contiene una dirección de ejemplo. La URL de ejecución se lee solamente en `cliente-http.ts`.
- `POST /auth/ingreso`: `{ email, contrasena }`.
- `POST /auth/registro`: `{ nombre, email, contrasena }`, sin rol ni confirmación. Siempre crea un vecino. Las tarjetas de comercio siguen visibles, deshabilitadas y con una explicación; las cuentas comerciales existentes pueden ingresar.
- Ambos devuelven `{ datos: { token, usuario }, meta: null }`.
- `GET /yo` devuelve `{ datos: usuario, meta: null }` y requiere Bearer.
- Las contraseñas de registro tienen entre 8 y 100 caracteres. En ingreso se permite de 1 a 100, como establece su DTO. Se conservan las validaciones de correo, nombre y confirmación del formulario.

El contrato se comprobó en los DTO/controladores del repositorio de referencia y en el Swagger local. Los tipos propios de Cercau están en `src/tipos/api.ts`; no se importan archivos del repositorio de la API.

## Responsabilidades

| Archivos | Responsabilidad |
| --- | --- |
| `src/servicios/cliente-http.ts` | Instancia Axios, URL, timeout de 12 segundos, Bearer automático y errores en español. Los formularios públicos no envían una sesión anterior. |
| `src/servicios/autenticacion.ts` | Ingreso, registro, extracción de `datos` y restauración consultando `/yo`. No hay cuentas demo, hashes ni tokens locales. |
| `src/servicios/almacenamiento-sesion.ts` | Guarda `{ version: 3, token, usuarioId }` en SecureStore nativo. Descarta sesiones ficticias v1/v2. En web conserva el token solo en memoria. |
| `src/contextos/autenticacion.tsx` | Comparte usuario/carga, bloquea operaciones dobles, recibe la invalidación del token y mantiene el desbloqueo biométrico. |
| `src/tipos/usuario.ts`, `src/tipos/api.ts` | Separan el usuario de la API de la preferencia biométrica local y definen los cuerpos/respuestas. |
| `src/servicios/validaciones-autenticacion.ts` | Reglas compartidas del formulario y del servicio, con el máximo de 100 caracteres de la API. |
| `src/app/iniciar-sesion.tsx`, `registrarse.tsx`, `seleccionar-rol.tsx`, `src/components/autenticacion/selector-rol.tsx` | Ajustan el contrato y la disponibilidad de registro, conservando estilos y destinos. |
| `package.json`, `package-lock.json` | Incorporan Axios mediante `npx.cmd expo install axios`. |
| `tests/autenticacion.test.cjs` | Ejecuta servicios e interceptores reales con respuestas HTTP y almacenamiento nativo controlados. |
| `.env.local`, `.env.example` | Configuración local ignorada por Git y ejemplo compartible, respectivamente. |
| `README.md`, `docs/autenticacion-api.md` | Instrucciones vigentes de uso, decisiones y comprobación. |
| `docs/autenticacion.md`, `docs/cierre-modulo-cuenta.md` | Agregan un aviso de documento histórico y un enlace a esta etapa. |

La identidad (`id`, correo, rol y comercio asociado) procede del servidor. Nombre editado, favoritos, rubros, avisos y biometría siguen guardados localmente por el id real; no se sincronizan, ni se importan favoritos/rubros remotos en esta etapa. Los perfiles locales previos se conservan, pero no autentican al usuario.

## Sesión, errores y biometría

Al abrir la aplicación se recupera el token y se valida con `/yo`. No se acepta el perfil local como prueba de autenticación. Un 401 protegido elimina el token y limpia el usuario del contexto para que Expo Router quite las rutas privadas. Un 401 tardío de una sesión anterior no borra un token de un ingreso nuevo. Si SecureStore falla al borrar un token rechazado, el acceso igualmente se invalida en memoria y se informa el fallo.

Una falla de red o timeout no demuestra que el token sea inválido: se conserva para reintentar, pero no se restaura una cuenta sin respuesta de la API. Axios no distingue de forma fiable un teléfono sin conexión de un servidor inaccesible; el mensaje pide revisar ambos. Los errores 5xx y timeout indican indisponibilidad de la API; las credenciales incorrectas, correo duplicado y errores inesperados tienen mensajes propios. No se muestran respuestas internas ni se registran tokens o contraseñas.

Cerrar sesión elimina el token local sin llamar a la API: este contrato no ofrece logout ni revocación. No borra favoritos ni preferencias. En web, una recarga requiere volver a ingresar porque no hay SecureStore; nunca se persiste el token en localStorage.

La biometría es un desbloqueo local de una sesión real guardada. El servicio nativo `biometria.ts` se conserva. Se consulta `/yo` antes y después de la verificación del sistema y solo se desbloquea si la sesión sigue siendo válida y corresponde al mismo usuario. Cancelar conserva la alternativa de correo/contraseña. Face ID en iPhone requiere una development build; Expo Go permite comprobar los formularios y la conexión con la API.

## Comprobación manual en el teléfono

1. Con la API de Docker ejecutándose y el teléfono en la misma red, ejecutá `npx.cmd expo start` desde Cercau y abrí el QR. Hacé una recarga completa para tomar `.env.local`.
2. Entrá en Mi cuenta → Crear una cuenta. Comercio debe estar deshabilitado con la explicación del Centro Comercial. Creá un vecino con un correo nuevo; debe aparecer la confirmación y luego el perfil.
3. Cerrá sesión e ingresá con esa cuenta. Probá una contraseña incorrecta y un correo ya registrado. Los mensajes deben ser claros y los botones deben bloquearse durante el envío; tocar varias veces no debe duplicar la solicitud.
4. Sin biometría, cerrá completamente Cercau y volvé a abrirlo: debe mostrar carga, consultar `/yo` y restaurar la sesión en Android/iOS. En navegador, recargar exige volver a ingresar.
5. Activá la huella/Face ID en una compilación compatible, enviá la app a segundo plano y volvé. La cuenta debe quedar bloqueada hasta completar Ingreso rápido. Probá cancelar, reintentar y usar correo/contraseña. Repetí cerrando y abriendo la aplicación.
6. Para comprobar expiración, usá una sesión que la API rechace o un token vencido en un entorno de prueba. Al validar `/yo`, debe quitarse el acceso privado y pedirse un nuevo ingreso. La biometría no debe reactivar una sesión rechazada.
7. Desconectá el teléfono de la red y probá ingresar o restaurar. Debe aparecer un error comprensible, terminar la carga y permitir reintentar al volver la conexión. Para probar indisponibilidad, detené Docker manualmente y volvé a iniciarlo después; no hace falta borrar datos de la app.
8. Comprobá que Buscar, Promociones, Mapa, favoritos y preferencias locales mantienen su aspecto y funcionamiento. Cerrá sesión y verificá que no podés abrir una ruta privada por un enlace directo.

Las pruebas automáticas usan sustitutos de SecureStore, SQLite y del sensor; no equivalen a una comprobación física de almacenamiento, teclado, áreas seguras o biometría.

## Validación realizada

- `npx.cmd tsc --noEmit`: aprobado.
- `npm.cmd run lint -- --no-cache`: aprobado, sin errores ni advertencias.
- `node --test --test-reporter=spec tests/*.test.cjs`: 40/40 pruebas aprobadas, ninguna omitida. Se conservaron las comprobaciones de cuenta/favoritos/actividad/biometría y se adaptaron las de autenticación al contrato HTTP.
- `git diff --check`: aprobado. `.env.local` queda ignorado por la regla existente; no fue necesario cambiar `.gitignore`.
- `npx.cmd expo-doctor --verbose`: 20/21 controles aprobados. Recomienda parches de `expo` (~57.0.31), `expo-router` (~57.0.29) y `@expo/ui` (~57.0.26); se conservaron las versiones existentes (~57.0.30, ~57.0.28 y ~57.0.25). No se actualizó el SDK.
- Navegador contra Docker: registro 201, `/yo` 200 con token válido y 401 con token inválido, duplicado 409, credenciales incorrectas 401, desconexión y reintento, cierre cancelado/confirmado, bloqueo de doble registro, recarga web, rutas privadas y pestañas públicas. Login sin desbordamiento a 320/390 px.
- El recorrido terminó sin excepciones de Cercau. Las excepciones de la extensión React Developer Tools se identificaron por su contexto `chrome-extension://` y se registraron por separado. El script, las capturas y `resultado.json` están en `.expo/autenticacion-api/`, ignorados por Git.
- La verificación de registro creó tres vecinos de prueba en la API, con contraseñas aleatorias mantenidas solo en memoria. No se guardaron sus credenciales ni se modificaron archivos de la API.
- Metro quedó ejecutándose y se verificó el manifiesto desde la dirección LAN de la computadora, puerto 8081. No se hizo commit, push ni `npm audit fix`.

Quedan pendientes las comprobaciones físicas de SecureStore, restauración al cerrar/reabrir la app, huella/Face ID, teclado y áreas seguras. No se hicieron exportaciones nativas en esta etapa.

Documentación consultada: [SecureStore SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/securestore/), [variables de entorno Expo](https://docs.expo.dev/guides/environment-variables/) e [interceptores Axios](https://axios-http.com/docs/interceptors).
