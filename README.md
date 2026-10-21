# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## Cercau: Base, autenticación, cuenta, preferencias y favoritos

Aplicación móvil de directorio de comercios con Expo SDK 57, React Native, TypeScript y Expo Router. La implementación conserva la identidad visual existente y las cuatro pestañas públicas. La documentación anterior de la plantilla se conserva arriba; **no es necesario ejecutar `reset-project`** para trabajar en Cercau.

El módulo permite registrar una cuenta como **vecino** o **comercio**, iniciar sesión, editar el nombre, cerrar sesión con confirmación, administrar favoritos, elegir rubros de interés y activar/desactivar la preferencia de avisos. Los formularios validan cada campo, confirman la contraseña, permiten mostrarla u ocultarla y bloquean envíos simultáneos. El ingreso abre Mi cuenta mediante `replace`. El registro inicia sesión automáticamente y conserva su confirmación visual original en `/cuenta-creada`, también mediante `replace`; desde allí se abre Mi cuenta.

El contexto de autenticación es la fuente única del usuario. Expo Router protege `/editar-perfil`, `/favoritos`, `/ajustes-cuenta`, `/mis-resenas` y la confirmación `/cuenta-creada`. Las rutas de registro e ingreso están disponibles sin sesión. Buscar, Promociones, Mapa y la bienvenida de Mi cuenta siguen siendo públicas; tocar un corazón sin cuenta abre el login.

### Persistencia y autenticación simulada

No hay backend. Los servicios son asíncronos y el token es ficticio: no autoriza llamadas a un servidor. En Android/iOS se genera un token aleatorio de 256 bits, con vencimiento a los 30 días, y se guarda **exclusivamente con `expo-secure-store`**. Cada ingreso genera uno nuevo; el cierre de sesión lo elimina. La restauración muestra carga antes de resolver las rutas.

El perfil, los ids de favoritos, los rubros, los avisos y la elección biométrica se guardan por `usuario.id` con `expo-sqlite/kv-store`. Se consultan sin conexión y se conservan después del logout. La contraseña escrita nunca se persiste. Para volver a ingresar en una cuenta local después de reiniciar se conserva un verificador con sal aleatoria en SecureStore; es una simulación local y deberá sustituirse por validación en servidor para producción.

**Web:** SecureStore no está disponible. El token vive solo en memoria, por lo que recargar exige un nuevo login. Los datos de cuenta y el verificador de la simulación se guardan en localStorage; el token nunca se escribe allí. Esta diferencia es intencional. Las cuentas de la versión anterior, que solo guardaba el perfil sin token, deben autenticarse nuevamente.

### Biometría y alternativa

Después de iniciar sesión con correo y contraseña, el interruptor de Mi cuenta permite activar el reingreso biométrico. Comprueba hardware, huella/rostro configurados y tipo de autenticación; pide una verificación antes de activarse. Al reabrir o volver desde segundo plano, una cuenta con esta opción activa permanece bloqueada hasta tocar **Ingreso rápido** en el login y completar la verificación. No se abren solicitudes en bucle. Cancelación, fallo, bloqueo o falta de hardware mantienen disponible el formulario de correo y contraseña.

Face ID requiere una **development build** en iPhone: no funciona en Expo Go. En Android, configurar primero una huella y el bloqueo de pantalla en Ajustes del dispositivo; abrir Cercau, iniciar sesión, activar **Huella digital**, volver a abrir la app y tocar **Ingreso rápido**. Se exige biometría de alta seguridad. Una sesión cerrada o vencida requiere correo y contraseña.

### Ejecución y cuentas de prueba

En PowerShell, desde `C:\Users\mica_\Desktop\DesarrolloMovil\cercau`:

```powershell
npm.cmd install
npx.cmd expo start
```

El primer comando instala lo declarado en el proyecto, sin cambiar de SDK. El segundo inicia Metro; abrir el QR con una versión de Expo Go compatible o usar una development build. Para Android, también se puede presionar `a` con un emulador configurado; `w` abre la versión web.

| Cuenta | Correo | Contraseña de prueba |
| --- | --- | --- |
| Vecino | `vecino@cercau.test` | `Cercau123` |
| Comercio | `comercio@cercau.test` | `Cercau123` |

Son datos ficticios públicos de desarrollo. El comercio de prueba conserva la asociación con Panadería La Esquina. Un comercio recién registrado comienza sin asociación; el módulo de gestión comercial deberá establecerla. El perfil permite editar el nombre y conserva correo, rol e identificadores.

### Integraciones con otros módulos

- **Reseñas:** Mi cuenta muestra lectura con carga, vacío, error y reintento. `conectarConsultaResenas` permite conectar el servicio del compañero. No se crean opiniones ficticias ni se implementa su creación, edición o eliminación.
- **Notificaciones:** pueden consumir `usuario.rubrosDeInteres` y `usuario.avisosActivos`. Este módulo no pide permisos ni envía avisos.
- **QR:** `useAutenticacion().validarAccionComercio()` comprueba sesión, rol y asociación, y solicita una validación biométrica. No hay escáner implementado.
- **Promociones personales y detalle de comercio:** no existen servicios/rutas de esas funciones en este checkout. No se agregan accesos a destinos inexistentes ni datos inventados. Las pestañas de Promociones y Mapa conservan su implementación original.

### Validaciones

```powershell
npx.cmd tsc --noEmit
npm.cmd run lint
npx.cmd expo-doctor
node --test tests/autenticacion.test.cjs
git diff --check
```

TypeScript revisa los tipos; lint revisa las reglas del código; Expo Doctor comprueba configuración y dependencias; las pruebas usan Node y sustitutos de los módulos nativos, sin agregar un framework. No sustituyen una prueba de SecureStore, teclado o huella en un dispositivo físico.

Ver [guía de cierre del módulo](docs/cierre-modulo-cuenta.md) para la arquitectura, el informe de cambios y los pasos manuales completos. La documentación de etapas anteriores en `docs/autenticacion.md` se conserva como historial.
