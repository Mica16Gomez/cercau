# Cercau

Aplicación móvil de directorio barrial desarrollada con Expo SDK 58, React Native, TypeScript y Expo Router.

## Inicio rápido

1. Instalar dependencias

   ```bash
   npm.cmd install
   ```

2. Iniciar la app

   ```bash
   npx.cmd expo start
   ```

Después de iniciar, podés abrir la app en:

- [Build de desarrollo](https://docs.expo.dev/develop/development-builds/introduction/)
- [Emulador Android](https://docs.expo.dev/workflow/android-studio-emulator/)
- [Simulador iOS](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go) compatible con el SDK del proyecto

Las rutas de Expo Router están en `src/app/`; los componentes reutilizables están en `src/components/`.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## La aplicación y sus módulos

Aplicación móvil de directorio de comercios con Expo SDK 58, React Native, TypeScript y Expo Router. La app conserva la identidad visual y las cuatro pestañas públicas.

El módulo permite registrar una cuenta de **vecino** e iniciar sesión con cuentas reales de la API del profesor. Las cuentas de comercio las crea el Centro Comercial. Editar el nombre, administrar favoritos, elegir rubros y activar/desactivar avisos usan la API real. Los formularios validan cada campo, confirman la contraseña, permiten mostrarla u ocultarla y bloquean envíos simultáneos. El ingreso abre Mi cuenta mediante `replace`. El registro inicia sesión automáticamente y conserva su confirmación visual original en `/cuenta-creada`, también mediante `replace`; desde allí se abre Mi cuenta.

El contexto de autenticación es la fuente única del usuario. Expo Router protege `/editar-perfil`, `/favoritos`, `/ajustes-cuenta`, `/mis-resenas` y la confirmación `/cuenta-creada`. Las rutas de registro e ingreso están disponibles sin sesión. Buscar, el mapa, el detalle de comercio, Promociones y la bienvenida de Mi cuenta son públicos; tocar un corazón sin cuenta abre el login.

### Persistencia y autenticación con la API

Axios centraliza las peticiones a `EXPO_PUBLIC_API_URL`, con un límite de espera de 12 segundos. Ingreso y registro usan `POST /auth/ingreso` y `POST /auth/registro`. En Android/iOS, el token emitido por la API se guarda **exclusivamente con `expo-secure-store`** y se envía como `Authorization: Bearer <token>`. Al iniciar la aplicación se consulta `GET /yo`; la API decide si la sesión sigue siendo válida. Un 401 protegido elimina la sesión y actualiza el contexto. El cierre de sesión elimina el acceso guardado, sin necesitar conexión.

El nombre, los favoritos, los rubros de interés y `avisosActivos` se guardan en la API y se recuperan desde `/yo`. Sólo la elección biométrica depende del dispositivo. Se conserva la caché por `usuario.id` en `expo-sqlite/kv-store`, pero no reemplaza los datos del servidor ni permite ingresar sin validar el token. La contraseña sólo se envía en el formulario: no se guarda ni se calcula un verificador local. Los valores ficticios anteriores no se suben ni se relacionan por nombre con registros reales.

**Web:** SecureStore no está disponible. El token vive solo en memoria, por lo que recargar exige un nuevo login. Los datos locales de cuenta se guardan en localStorage; el token y las contraseñas nunca se escriben allí.

### Biometría y alternativa

Después de iniciar sesión con correo y contraseña, el interruptor de Mi cuenta permite activar el reingreso biométrico. Comprueba hardware, huella/rostro configurados y tipo de autenticación; pide una verificación antes de activarse. Al reabrir o volver desde segundo plano, una cuenta con esta opción activa permanece bloqueada hasta tocar **Ingreso rápido** en el login y completar la verificación. No se abren solicitudes en bucle. Cancelación, fallo, bloqueo o falta de hardware mantienen disponible el formulario de correo y contraseña.

Face ID requiere una **development build** en iPhone: no funciona en Expo Go. En Android, configurar primero una huella y el bloqueo de pantalla en Ajustes del dispositivo; abrir Cercau, iniciar sesión, activar **Huella digital**, volver a abrir la app y tocar **Ingreso rápido**. Se exige biometría de alta seguridad. Una sesión cerrada o vencida requiere correo y contraseña.

### Ejecución

#### API con Docker

En una terminal, desde `cercau`:

```powershell
Set-Location '..\apis docentes\api-proyectos-mobile\api-directorio-comercios'
docker compose up
```

Esperá el mensaje `Escuchando en el puerto 3000` y comprobá `http://localhost:3000/salud`. Dejá esta terminal abierta mientras uses la app. Para detener la API, presioná `Ctrl+C` o ejecutá `docker compose down` desde la carpeta de la API.

#### Aplicación

En otra terminal, desde `cercau`:

```powershell
npm.cmd install
npx.cmd expo start --clear
```

Si `.env.local` todavía no existe, crealo copiando `.env.example`; si ya existe, editá solo la configuración necesaria y no lo reemplaces. Usá `EXPO_PUBLIC_DIRECTORIO_MOCKS=false` para consultar la API o `true` para mostrar comercios ficticios sin levantarla.

La dirección de la API depende del entorno:

- Web o navegador de la misma computadora: `http://localhost:3000`.
- Emulador Android: `http://10.0.2.2:3000`.
- Teléfono físico: `http://IP-DE-LA-COMPUTADORA:3000`; ambos dispositivos deben estar en la misma Wi-Fi y el firewall debe permitir la conexión.

Metro toma estas variables al iniciar; si las cambiás, detené y reiniciá Expo. Abrí el QR con Expo Go o presioná `a` para usar un emulador Android configurado.

El directorio busca por nombre y descripción; también contempla `productos` cuando está disponible en los datos, como en el modo demostración. La API actual no define ese campo, por lo que buscar productos reales requiere que el contrato del backend lo incorpore. La app filtra por rubro y por abierto ahora; los horarios se calculan en la zona horaria de Argentina y respetan los distintos tramos del día. **Ordenar por distancia** solicita ubicación únicamente al tocar el botón. Si se rechaza el permiso, la búsqueda manual, las fichas y el mapa siguen disponibles.

En Android/iOS, el directorio y sus horarios se guardan en SQLite. Sin conexión se muestra la última copia disponible con su fecha; si todavía no existe una copia, se informa que se están usando datos de demostración. En web, la caché dura mientras la pestaña está abierta. El mapa móvil usa `react-native-maps`; la versión web presenta OpenStreetMap y una lista de comercios.

La ficha incluye horarios, datos de contacto, fotos disponibles y acciones para llamar, abrir WhatsApp o Instagram y consultar cómo llegar. El detalle también puede abrir la ubicación del comercio en el mapa de Cercau.

### Integraciones con otros módulos

- **Reseñas:** Mi cuenta muestra lectura con carga, vacío, error y reintento. `conectarConsultaResenas` permite conectar el servicio del compañero. No se crean opiniones ficticias ni se implementa su creación, edición o eliminación.
- **Notificaciones:** pueden consumir `usuario.rubrosDeInteres` y `usuario.avisosActivos`. Este módulo no pide permisos ni envía avisos.
- **QR:** `useAutenticacion().validarAccionComercio()` comprueba sesión, rol y asociación, y solicita una validación biométrica. No hay escáner implementado.
- **Promociones personales:** no existen servicios/rutas de esas funciones en este checkout. No se agregan accesos a destinos inexistentes ni datos inventados. La pestaña Promociones conserva su implementación original.

### Documentación

Ver [cuenta y favoritos con la API](docs/cuenta-api.md) para el contrato y el recorrido de ese módulo. [Autenticación con la API](docs/autenticacion-api.md) documenta la etapa inicial. Los documentos `docs/cierre-modulo-cuenta.md` y `docs/autenticacion.md` corresponden a etapas anteriores.
