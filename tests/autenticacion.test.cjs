const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');
const crypto = require('node:crypto');

// Node no ejecuta módulos nativos. Probamos el servicio real con un almacenamiento
// en memoria que puede simular los rechazos de SecureStore y localStorage.
function crearEntorno(plataforma = 'ios', disco = new Map(), discoLocal = new Map()) {
  const fallos = { lectura: false, escritura: false, borrado: false, localLectura: false, localEscritura: false };
  const biometriaNativa = { hardware: true, configurada: true, tipos: [1], nivel: 3, resultado: { success: true }, solicitudes: 0, expoGo: false, demora: null };
  const cache = new Map();
  const operaciones = [];
  const demoras = [];
  const almacenamiento = {
    getItem(clave) {
      operaciones.push('leer');
      if (fallos.lectura) throw new Error('Lectura rechazada');
      return disco.get(clave) ?? null;
    },
    setItem(clave, valor) {
      operaciones.push('guardar');
      if (fallos.escritura) throw new Error('Escritura rechazada');
      disco.set(clave, valor);
    },
    removeItem(clave) {
      operaciones.push('borrar');
      if (fallos.borrado) throw new Error('Borrado rechazado');
      disco.delete(clave);
    },
  };
  const local = {
    getItem(clave) { if (fallos.localLectura) throw new Error('Lectura local rechazada'); return discoLocal.get(clave) ?? null; },
    setItem(clave, valor) { if (fallos.localEscritura) throw new Error('Escritura local rechazada'); discoLocal.set(clave, valor); },
    removeItem(clave) { discoLocal.delete(clave); },
  };

  function cargar(archivo) {
    const ruta = path.resolve(__dirname, '..', archivo);
    if (cache.has(ruta)) return cache.get(ruta).exports;
    const modulo = { exports: {} };
    cache.set(ruta, modulo);
    const codigo = ts.transpileModule(fs.readFileSync(ruta, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    vm.runInNewContext(codigo, {
      exports: modulo.exports,
      module: modulo,
      setTimeout: (resolver, milisegundos) => { demoras.push(milisegundos); resolver(); },
      window: { localStorage: local },
      require: (nombre) => {
        if (nombre === 'react-native') return { Platform: { OS: plataforma } };
        if (/\.(jpg|png)$/.test(nombre)) return nombre;
        if (nombre === 'expo-sqlite/kv-store') return { __esModule: true, default: local };
        if (nombre === 'expo-crypto') return {
          CryptoDigestAlgorithm: { SHA256: 'sha256' },
          getRandomBytesAsync: async (n) => crypto.randomBytes(n),
          digestStringAsync: async (algoritmo, texto) => crypto.createHash(algoritmo).update(texto).digest('hex'),
        };
        if (nombre === 'expo-constants') return { __esModule: true, default: { get executionEnvironment() { return biometriaNativa.expoGo ? 'storeClient' : 'standalone'; } }, ExecutionEnvironment: { StoreClient: 'storeClient' } };
        if (nombre === 'expo-local-authentication') return {
          AuthenticationType: { FINGERPRINT: 1, FACIAL_RECOGNITION: 2 }, SecurityLevel: { BIOMETRIC_STRONG: 3 },
          hasHardwareAsync: async () => biometriaNativa.hardware,
          isEnrolledAsync: async () => biometriaNativa.configurada,
          supportedAuthenticationTypesAsync: async () => biometriaNativa.tipos,
          getEnrolledLevelAsync: async () => biometriaNativa.nivel,
          authenticateAsync: async () => { biometriaNativa.solicitudes++; if (biometriaNativa.demora) await biometriaNativa.demora; return biometriaNativa.resultado; },
        };
        if (nombre === 'expo-secure-store') return {
          getItemAsync: async (...args) => {
            assert.notEqual(plataforma, 'web');
            return almacenamiento.getItem(...args);
          },
          setItemAsync: async (...args) => {
            assert.notEqual(plataforma, 'web');
            return almacenamiento.setItem(...args);
          },
          deleteItemAsync: async (...args) => {
            assert.notEqual(plataforma, 'web');
            return almacenamiento.removeItem(...args);
          },
        };
        const destino = nombre.startsWith('@/')
          ? path.join('src', nombre.slice(2))
          : path.relative(path.resolve(__dirname, '..'), path.resolve(path.dirname(ruta), nombre));
        return cargar(`${destino}.ts`);
      },
    }, { filename: ruta });
    return modulo.exports;
  }

  return {
    disco, fallos, operaciones, demoras,
    discoLocal, biometriaNativa,
    servicio: cargar('src/servicios/autenticacion.ts'),
    sesion: cargar('src/servicios/almacenamiento-sesion.ts'),
    validaciones: cargar('src/servicios/validaciones-autenticacion.ts'),
    cuenta: cargar('src/servicios/cuenta.ts'),
    biometria: cargar('src/servicios/biometria.ts'),
    comercios: cargar('src/servicios/comercios.ts'),
    actividad: cargar('src/servicios/actividad.ts'),
  };
}

const datos = { nombre: 'Ana del barrio', email: 'ana@example.test', contrasena: 'Prueba123', rol: 'vecino' };
const credencialesDemo = { email: 'vecino@cercau.test', contrasena: 'Cercau123' };

test('registro normaliza datos y una nueva ejecución restaura la sesión sin contraseña', async () => {
  const app = crearEntorno();
  const usuario = await app.servicio.registrarse({ ...datos, nombre: '  Ana del barrio  ', email: ' ANA@example.test ' });
  assert.equal(usuario.nombre, datos.nombre);
  assert.equal(usuario.email, datos.email);
  assert.equal(usuario.rol, 'vecino');
  assert.equal(typeof usuario.id, 'string');
  const persistido = app.disco.get('cercau.sesion.v2');
  assert.equal(persistido.includes(datos.contrasena), false);
  assert.match(JSON.parse(persistido).token, /^[a-f0-9]{64}$/);
  assert.equal(usuario.comercioId, null);
  for (const valor of [...app.disco.values(), ...app.discoLocal.values()]) assert.equal(valor.includes(datos.contrasena), false);
  const reinicio = crearEntorno('ios', app.disco, app.discoLocal);
  assert.equal(JSON.stringify(await reinicio.servicio.restaurarSesion()), JSON.stringify(usuario));
  assert.equal(app.demoras[0], 700);
});

test('cuentas de ambos roles, cierre persistente y nuevo inicio de sesión', async () => {
  const app = crearEntorno();
  await app.servicio.registrarse({ ...datos, rol: 'comercio' });
  await app.servicio.cerrarSesion();
  assert.equal(await crearEntorno('ios', app.disco, app.discoLocal).sesion.recuperarSesion(), null);
  const usuario = await app.servicio.iniciarSesion(datos);
  assert.equal(usuario.rol, 'comercio');
  const demo = await app.servicio.iniciarSesion(credencialesDemo);
  assert.equal(demo.rol, 'vecino');
});

test('credenciales incorrectas y email duplicado producen errores controlados', async () => {
  const app = crearEntorno();
  await assert.rejects(app.servicio.iniciarSesion({ ...credencialesDemo, contrasena: 'Incorrecta1' }), { codigo: 'CREDENCIALES_INVALIDAS' });
  assert.equal(app.disco.size, 0);
  await app.servicio.registrarse(datos);
  await assert.rejects(app.servicio.registrarse({ ...datos, email: 'ANA@example.test' }), { codigo: 'EMAIL_REGISTRADO' });
});

test('rechaza nombre, email, contraseña y rol inválidos antes de guardar', async () => {
  const app = crearEntorno();
  for (const cambio of [{ nombre: ' ' }, { email: 'invalido' }, { contrasena: '123' }, { rol: 'admin' }]) {
    await assert.rejects(app.servicio.registrarse({ ...datos, ...cambio }), { codigo: 'DATOS_INVALIDOS' });
  }
  assert.equal(app.disco.size, 0);
});

test('un fallo de guardado permite reintentar el registro con el mismo email', async () => {
  const app = crearEntorno();
  app.fallos.escritura = true;
  await assert.rejects(app.servicio.registrarse(datos), { codigo: 'ALMACENAMIENTO' });
  assert.equal(app.disco.size, 0);
  app.fallos.escritura = false;
  await app.servicio.registrarse(datos);
  assert.equal((await app.servicio.restaurarSesion()).email, datos.email);
});

test('si falla cerrar sesión no informa éxito ni borra la sesión anterior', async () => {
  const app = crearEntorno();
  await app.servicio.iniciarSesion(credencialesDemo);
  app.fallos.borrado = true;
  await assert.rejects(app.servicio.cerrarSesion(), { codigo: 'ALMACENAMIENTO' });
  assert.equal((await app.servicio.restaurarSesion()).email, credencialesDemo.email);
  app.fallos.borrado = false;
  await app.servicio.cerrarSesion();
  assert.equal(await app.sesion.recuperarSesion(), null);
});

test('sesiones corruptas o con roles desconocidos se descartan con un error claro', async () => {
  for (const contenido of ['{incompleto', JSON.stringify({ version: 1, usuario: { id: '1', ...datos, rol: 'admin' } })]) {
    const app = crearEntorno('ios', new Map([['cercau.sesion.v2', contenido]]));
    await assert.rejects(app.sesion.recuperarSesion(), { codigo: 'SESION_INVALIDA' });
    assert.equal(app.disco.size, 0);
  }
});

test('el fallo de lectura se convierte en un mensaje controlado', async () => {
  const app = crearEntorno();
  app.fallos.lectura = true;
  await assert.rejects(app.sesion.recuperarSesion(), { codigo: 'ALMACENAMIENTO' });
});

test('web mantiene el token en memoria y nunca en localStorage; recargar exige login', async () => {
  const app = crearEntorno('web');
  await app.servicio.iniciarSesion(credencialesDemo);
  const token = (await app.sesion.recuperarSesion()).token;
  assert.equal(app.disco.size, 0);
  for (const valor of app.discoLocal.values()) assert.equal(valor.includes(token), false);
  const reinicio = crearEntorno('web', app.disco, app.discoLocal);
  assert.equal(await reinicio.sesion.recuperarSesion(), null);
  await app.servicio.cerrarSesion();
  assert.equal(await app.sesion.recuperarSesion(), null);
});

test('el formulario indica todos los campos vacíos para mostrar errores debajo de cada uno', () => {
  const { validaciones } = crearEntorno();
  const errores = validaciones.validarRegistro({ nombre: '', email: '', contrasena: '', confirmacion: '', rol: null });
  assert.deepEqual(Object.keys(errores).sort(), ['confirmacion', 'contrasena', 'email', 'nombre', 'rol']);
});

test('la confirmación debe coincidir y cambiar de rol no invalida los demás datos', () => {
  const { validaciones } = crearEntorno();
  const formulario = { ...datos, confirmacion: 'OtraClave123' };
  assert.deepEqual(Object.keys(validaciones.validarRegistro(formulario)), ['confirmacion']);
  formulario.confirmacion = datos.contrasena;
  assert.equal(Object.keys(validaciones.validarRegistro(formulario)).length, 0);
  formulario.rol = 'comercio';
  assert.equal(Object.keys(validaciones.validarRegistro(formulario)).length, 0);
});

test('inicio de sesión valida correo y contraseña sin alterar los valores escritos', () => {
  const { validaciones } = crearEntorno();
  assert.deepEqual(Object.keys(validaciones.validarInicioSesion({ email: 'correo sin arroba', contrasena: '' })).sort(), ['contrasena', 'email']);
  const credenciales = { email: ' VECINO@cercau.test ', contrasena: 'Cercau123' };
  assert.equal(Object.keys(validaciones.validarInicioSesion(credenciales)).length, 0);
  assert.equal(credenciales.email, ' VECINO@cercau.test ');
});

test('una cuenta registrada puede volver a ingresar después de logout y reiniciar', async () => {
  for (const plataforma of ['ios', 'android', 'web']) {
    const app = crearEntorno(plataforma);
    const usuario = await app.servicio.registrarse(datos);
    await app.servicio.cerrarSesion();
    const reinicio = crearEntorno(plataforma, app.disco, app.discoLocal);
    assert.equal((await reinicio.servicio.iniciarSesion(datos)).id, usuario.id);
    await assert.rejects(reinicio.servicio.iniciarSesion({ ...datos, contrasena: 'OtraClave123' }), { codigo: 'CREDENCIALES_INVALIDAS' });
  }
});

test('favoritos, rubros, avisos y nombre persisten por usuario sin duplicados', async () => {
  const app = crearEntorno();
  let ana = await app.servicio.registrarse(datos);
  ana = await app.cuenta.actualizarCuenta(ana, {
    favoritos: ['cafe-la-esquina', 'cafe-la-esquina'], rubrosDeInteres: ['Comida', 'Comida'], avisosActivos: true, nombre: 'Ana editada',
  });
  assert.equal(ana.favoritos.length, 1);
  assert.equal(ana.rubrosDeInteres.length, 1);
  const comercios = await app.comercios.obtenerComerciosPorIds(ana.favoritos);
  assert.equal(comercios[0].name, 'Café La Esquina');
  assert.ok(comercios[0].imagen);
  await app.servicio.cerrarSesion();
  let otro = await app.servicio.iniciarSesion(credencialesDemo);
  assert.equal(otro.favoritos.length, 0);
  assert.equal(otro.rubrosDeInteres.length, 0);
  assert.equal(otro.avisosActivos, false);
  otro = await app.cuenta.actualizarCuenta(otro, { favoritos: ['floreria-verde'] });
  const reinicio = crearEntorno('ios', app.disco, app.discoLocal);
  const recuperada = await reinicio.servicio.iniciarSesion(datos);
  assert.equal(JSON.stringify(recuperada), JSON.stringify(ana));
  const sinFavoritos = await reinicio.cuenta.actualizarCuenta(recuperada, { favoritos: [], rubrosDeInteres: [], avisosActivos: false });
  assert.equal(sinFavoritos.favoritos.length, 0);
  assert.equal(sinFavoritos.rubrosDeInteres.length, 0);
  assert.equal((await reinicio.servicio.iniciarSesion(credencialesDemo)).favoritos[0], otro.favoritos[0]);
});

test('editar perfil conserva identificadores, rol, correo y relación con comercio', async () => {
  const app = crearEntorno();
  const comercio = await app.servicio.iniciarSesion({ email: 'comercio@cercau.test', contrasena: 'Cercau123' });
  assert.equal(comercio.comercioId, 'panaderia-la-esquina');
  const cambiado = await app.cuenta.actualizarCuenta(comercio, { nombre: '  Almacén Ana  ', rol: 'vecino', email: 'otro@test.com', comercioId: null });
  assert.equal(cambiado.nombre, 'Almacén Ana');
  for (const campo of ['id', 'rol', 'email', 'comercioId']) assert.equal(cambiado[campo], comercio[campo]);
  await assert.rejects(app.cuenta.actualizarCuenta(cambiado, { nombre: ' ' }), { codigo: 'DATOS_INVALIDOS' });
});

test('un usuario sin sesión o con otra cuenta activa no puede guardar cambios privados', async () => {
  const app = crearEntorno();
  const ana = await app.servicio.registrarse(datos);
  await app.servicio.cerrarSesion();
  await assert.rejects(app.cuenta.actualizarCuenta(ana, { favoritos: ['cafe-la-esquina'] }), { codigo: 'SIN_SESION' });
  await app.servicio.iniciarSesion(credencialesDemo);
  await assert.rejects(app.cuenta.actualizarCuenta(ana, { avisosActivos: true }), { codigo: 'SIN_SESION' });
  await assert.rejects(app.actividad.obtenerMisResenas(ana.id), { codigo: 'SIN_SESION' });
});

test('fallos de persistencia no sobrescriben favoritos ni preferencias anteriores', async () => {
  const app = crearEntorno();
  const usuario = await app.servicio.iniciarSesion(credencialesDemo);
  app.fallos.localEscritura = true;
  await assert.rejects(app.cuenta.actualizarCuenta(usuario, { favoritos: ['cafe-la-esquina'], avisosActivos: true }), { codigo: 'ALMACENAMIENTO' });
  app.fallos.localEscritura = false;
  const recuperado = await app.cuenta.obtenerUsuario(usuario.id);
  assert.equal(recuperado.favoritos.length, 0);
  assert.equal(recuperado.avisosActivos, false);
  app.fallos.localLectura = true;
  await assert.rejects(app.servicio.restaurarSesion(), { codigo: 'ALMACENAMIENTO' });
  app.fallos.localLectura = false;
  assert.equal((await app.servicio.restaurarSesion()).id, usuario.id);
});

test('rechaza ids de comercios y rubros inexistentes; no duplica objetos de comercio', async () => {
  const app = crearEntorno();
  const usuario = await app.servicio.iniciarSesion(credencialesDemo);
  await assert.rejects(app.cuenta.actualizarCuenta(usuario, { favoritos: ['inventado'] }), { codigo: 'DATOS_INVALIDOS' });
  await assert.rejects(app.cuenta.actualizarCuenta(usuario, { rubrosDeInteres: ['inventado'] }), { codigo: 'DATOS_INVALIDOS' });
  const porIds = await app.comercios.obtenerComerciosPorIds(['cafe-la-esquina', 'cafe-la-esquina']);
  assert.equal(porIds.length, 1);
  assert.equal((await app.comercios.buscarComercios('CAFE', 'Todos'))[0].id, 'cafe-la-esquina');
});

test('cada login rota el token y las sesiones vencidas se eliminan', async () => {
  const app = crearEntorno();
  await app.servicio.iniciarSesion(credencialesDemo);
  const primera = await app.sesion.recuperarSesion();
  await app.servicio.iniciarSesion(credencialesDemo);
  const segunda = await app.sesion.recuperarSesion();
  assert.notEqual(primera.token, segunda.token);
  const persistido = JSON.parse(app.disco.get('cercau.sesion.v2'));
  persistido.venceEn = Date.now() - 1;
  app.disco.set('cercau.sesion.v2', JSON.stringify(persistido));
  await assert.rejects(app.servicio.restaurarSesion(), { codigo: 'SESION_INVALIDA' });
  assert.equal(app.disco.has('cercau.sesion.v2'), false);
  assert.equal(app.discoLocal.size, 1);
});

test('una sesión antigua sin token no autoriza acciones privadas', async () => {
  const app = crearEntorno('ios', new Map([['cercau.sesion.v1', JSON.stringify({ version: 1, usuario: { ...datos, id: 'anterior' } })]]));
  assert.equal(await app.servicio.restaurarSesion(), null);
  assert.equal(app.disco.size, 0);
});

test('un perfil corrupto se informa y se conserva para evitar pérdida de datos', async () => {
  const app = crearEntorno();
  const usuario = await app.servicio.iniciarSesion(credencialesDemo);
  const clave = `cercau.usuario.v1.${usuario.id}`;
  app.discoLocal.set(clave, '{incompleto');
  await assert.rejects(app.servicio.restaurarSesion(), { codigo: 'ALMACENAMIENTO' });
  assert.equal(app.discoLocal.get(clave), '{incompleto');
});

test('consulta biométrica comprueba hardware, configuración y tipo sin abrir diálogos', async () => {
  const app = crearEntorno('android');
  assert.equal((await app.biometria.consultarBiometria()).nombre, 'Huella digital');
  assert.equal(app.biometriaNativa.solicitudes, 0);
  app.biometriaNativa.hardware = false;
  assert.equal((await app.biometria.consultarBiometria()).disponible, false);
  app.biometriaNativa.hardware = true;
  app.biometriaNativa.configurada = false;
  await assert.rejects(app.biometria.solicitarValidacionBiometrica(), { codigo: 'BIOMETRIA' });
  assert.equal(app.biometriaNativa.solicitudes, 0);
  app.biometriaNativa.configurada = true;
  app.biometriaNativa.nivel = 2;
  assert.equal((await app.biometria.consultarBiometria()).disponible, false);
});

test('biometría permite éxito y convierte cancelación, fallo y bloqueo en mensajes claros', async () => {
  const app = crearEntorno('android');
  await app.biometria.solicitarValidacionBiometrica();
  for (const error of ['user_cancel', 'authentication_failed', 'lockout', 'not_available', 'timeout', 'user_fallback', 'unknown']) {
    app.biometriaNativa.resultado = { success: false, error };
    await assert.rejects(app.biometria.solicitarValidacionBiometrica(), (fallo) => fallo.codigo === 'BIOMETRIA' && /correo y contraseña/.test(fallo.message));
  }
  assert.equal(app.biometriaNativa.solicitudes, 8);
});

test('Face ID en Expo Go y biometría web ofrecen alternativa de correo', async () => {
  const app = crearEntorno('ios');
  app.biometriaNativa.tipos = [2];
  app.biometriaNativa.expoGo = true;
  assert.match((await app.biometria.consultarBiometria()).mensaje, /development build/);
  await assert.rejects(app.biometria.solicitarValidacionBiometrica(), { codigo: 'BIOMETRIA' });
  app.biometriaNativa.expoGo = false;
  assert.equal((await app.biometria.consultarBiometria()).disponible, true);
  assert.equal((await crearEntorno('web').biometria.consultarBiometria()).disponible, false);
});

test('bloquea solicitudes biométricas simultáneas sin reintentos automáticos', async () => {
  const app = crearEntorno('android');
  let resolver;
  app.biometriaNativa.demora = new Promise((resolve) => { resolver = resolve; });
  const primera = app.biometria.solicitarValidacionBiometrica();
  await assert.rejects(app.biometria.solicitarValidacionBiometrica(), { codigo: 'OPERACION_EN_CURSO' });
  resolver();
  await primera;
  assert.equal(app.biometriaNativa.solicitudes, 1);
});

test('actividad devuelve vacío sin inventar reseñas y permite conectar una lectura real', async () => {
  const app = crearEntorno();
  const usuario = await app.servicio.iniciarSesion(credencialesDemo);
  assert.equal((await app.actividad.obtenerMisResenas(usuario.id)).length, 0);
  app.actividad.conectarConsultaResenas(async (id) => [{ id: 'externa', comercioNombre: 'Registro externo', texto: id, fecha: '20/10/2026' }]);
  assert.equal((await app.actividad.obtenerMisResenas(usuario.id))[0].texto, usuario.id);
});
