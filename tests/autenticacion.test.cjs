const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');
const axios = require('axios');

// Respuestas del servidor de prueba: el cliente y sus interceptores son Axios real.
// Cada disco conserva el mismo servidor entre reinicios del entorno de prueba.
const servidores = new WeakMap();
function crearServidor() {
  return {
    usuarios: new Map([
      ['vecino@api.test', { id: 'usr-vecino', nombre: 'Vecino API', email: 'vecino@api.test', rol: 'vecino', comercioId: null }],
      ['comercio@api.test', { id: 'usr-comercio', nombre: 'Comercio API', email: 'comercio@api.test', rol: 'comercio', comercioId: 'panaderia-la-esquina' }],
    ]), tokens: new Map(), secuencia: 0,
  };
}

// Node no ejecuta módulos nativos. Probamos el servicio real con un almacenamiento
// en memoria que puede simular los rechazos de SecureStore y localStorage.
function crearEntorno(plataforma = 'ios', disco = new Map(), discoLocal = new Map(), configuracion = {}) {
  const fallos = { lectura: false, escritura: false, borrado: false, localLectura: false, localEscritura: false };
  const biometriaNativa = { hardware: true, configurada: true, tipos: [1], nivel: 3, resultado: { success: true }, solicitudes: 0, expoGo: false, demora: null };
  const cache = new Map();
  const operaciones = [];
  const demoras = [];
  if (!servidores.has(discoLocal)) servidores.set(discoLocal, crearServidor());
  const servidor = servidores.get(discoLocal);
  const http = { solicitudes: [], fallo: null, respuesta: null, pausa: null };

  async function adapter(config) {
    http.solicitudes.push(config);
    if (http.pausa) await http.pausa;
    if (http.fallo) throw new axios.AxiosError('Fallo de prueba', http.fallo, config);
    const responder = (status, data) => {
      const response = { status, data, config, headers: {}, statusText: String(status) };
      if (status >= 400) throw new axios.AxiosError('Respuesta de prueba', 'ERR_BAD_RESPONSE', config, {}, response);
      return response;
    };
    if (http.respuesta) return responder(http.respuesta.status, http.respuesta.data);
    const cuerpo = config.data ? JSON.parse(config.data) : {};
    if (config.url === '/yo') {
      const usuario = servidor.tokens.get(config.headers.get('Authorization')?.slice(7));
      return usuario ? responder(200, { datos: usuario, meta: null })
        : responder(401, { error: { codigo: 'NO_AUTENTICADO', mensaje: 'Sesión inválida' } });
    }
    if (config.url === '/auth/registro') {
      if (servidor.usuarios.has(cuerpo.email)) return responder(409, { error: { codigo: 'EMAIL_YA_REGISTRADO', mensaje: 'Ya registrado' } });
      servidor.usuarios.set(cuerpo.email, { id: `usr-${++servidor.secuencia}`, nombre: cuerpo.nombre, email: cuerpo.email, rol: 'vecino', comercioId: null });
    }
    const usuario = servidor.usuarios.get(cuerpo.email);
    if (!usuario || ['Incorrecta1', 'OtraClave123'].includes(cuerpo.contrasena)) {
      return responder(401, { error: { codigo: 'CREDENCIALES_INVALIDAS', mensaje: 'Credenciales inválidas' } });
    }
    const completo = { ...usuario, favoritos: [], rubrosDeInteres: [], avisosActivos: true };
    const token = `token-api-${++servidor.secuencia}`;
    servidor.tokens.set(token, completo);
    return responder(config.url === '/auth/registro' ? 201 : 200, { datos: { token, usuario: completo }, meta: null });
  }
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
      process: { env: { EXPO_PUBLIC_API_URL: 'apiURL' in configuracion ? configuracion.apiURL : 'http://api.example.test' } },
      require: (nombre) => {
        if (nombre === 'axios') return { __esModule: true,
          create: (config) => axios.create({ ...config, adapter }), isAxiosError: axios.isAxiosError,
        };
        if (nombre === 'react-native') return { Platform: { OS: plataforma } };
        if (/\.(jpg|png)$/.test(nombre)) return nombre;
        if (nombre === 'expo-sqlite/kv-store') return { __esModule: true, default: local };
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
    disco, fallos, operaciones, demoras, http, servidor,
    discoLocal, biometriaNativa,
    servicio: cargar('src/servicios/autenticacion.ts'),
    sesion: cargar('src/servicios/almacenamiento-sesion.ts'),
    cliente: cargar('src/servicios/cliente-http.ts').clienteHttp,
    errores: cargar('src/servicios/errores-autenticacion.ts'),
    validaciones: cargar('src/servicios/validaciones-autenticacion.ts'),
    cuenta: cargar('src/servicios/cuenta.ts'),
    biometria: cargar('src/servicios/biometria.ts'),
    comercios: cargar('src/servicios/comercios.ts'),
    actividad: cargar('src/servicios/actividad.ts'),
  };
}

const datos = { nombre: 'Ana del barrio', email: 'ana@example.test', contrasena: 'Prueba123' };
const credencialesApi = { email: 'vecino@api.test', contrasena: 'Prueba123' };

test('registro normaliza datos y una nueva ejecución restaura la sesión sin contraseña', async () => {
  const app = crearEntorno();
  const usuario = await app.servicio.registrarse({ ...datos, nombre: '  Ana del barrio  ', email: ' ANA@example.test ' });
  assert.equal(usuario.nombre, datos.nombre);
  assert.equal(usuario.email, datos.email);
  assert.equal(usuario.rol, 'vecino');
  assert.equal(typeof usuario.id, 'string');
  const persistido = app.disco.get('cercau.sesion.v3');
  assert.equal(persistido.includes(datos.contrasena), false);
  assert.equal(JSON.parse(persistido).token, [...app.servidor.tokens.keys()][0]);
  assert.deepEqual(Object.keys(JSON.parse(persistido)).sort(), ['token', 'usuarioId', 'version']);
  assert.deepEqual(Object.keys(JSON.parse(app.http.solicitudes[0].data)).sort(), ['contrasena', 'email', 'nombre']);
  assert.equal(usuario.comercioId, null);
  for (const valor of [...app.disco.values(), ...app.discoLocal.values()]) assert.equal(valor.includes(datos.contrasena), false);
  const reinicio = crearEntorno('ios', app.disco, app.discoLocal);
  assert.equal(JSON.stringify(await reinicio.servicio.restaurarSesion()), JSON.stringify(usuario));
  assert.equal(reinicio.http.solicitudes[0].url, '/yo');
  assert.equal(reinicio.http.solicitudes[0].headers.get('Authorization'), `Bearer ${JSON.parse(persistido).token}`);
});

test('registro siempre vecino, cierre persistente e ingreso de comercio creado por la API', async () => {
  const app = crearEntorno();
  const creada = await app.servicio.registrarse({ ...datos, rol: 'comercio' });
  assert.equal(creada.rol, 'vecino');
  assert.equal(JSON.parse(app.http.solicitudes[0].data).rol, undefined);
  await app.servicio.cerrarSesion();
  assert.equal(await crearEntorno('ios', app.disco, app.discoLocal).sesion.recuperarSesion(), null);
  const usuario = await app.servicio.iniciarSesion(datos);
  assert.equal(usuario.rol, 'vecino');
  assert.equal((await app.servicio.iniciarSesion({ email: 'comercio@api.test', contrasena: 'Prueba123' })).rol, 'comercio');
  const demo = await app.servicio.iniciarSesion(credencialesApi);
  assert.equal(demo.rol, 'vecino');
});

test('credenciales incorrectas y email duplicado producen errores controlados', async () => {
  const app = crearEntorno();
  await assert.rejects(app.servicio.iniciarSesion({ ...credencialesApi, contrasena: 'Incorrecta1' }), { codigo: 'CREDENCIALES_INVALIDAS' });
  assert.equal(app.disco.size, 0);
  await app.servicio.registrarse(datos);
  await assert.rejects(app.servicio.registrarse({ ...datos, email: 'ANA@example.test' }), { codigo: 'EMAIL_REGISTRADO' });
});

test('rechaza nombre, email y contraseña inválidos antes de pedir el registro', async () => {
  const app = crearEntorno();
  for (const cambio of [{ nombre: ' ' }, { email: 'invalido' }, { contrasena: '123' }, { contrasena: 'x'.repeat(101) }]) {
    await assert.rejects(app.servicio.registrarse({ ...datos, ...cambio }), { codigo: 'DATOS_INVALIDOS' });
  }
  assert.equal(app.disco.size, 0);
  assert.equal(app.http.solicitudes.length, 0);
});

test('un registro aceptado con fallo de guardado permite ingresar sin repetir el alta', async () => {
  const app = crearEntorno();
  app.fallos.escritura = true;
  await assert.rejects(app.servicio.registrarse(datos), { codigo: 'ALMACENAMIENTO' });
  assert.equal(app.disco.size, 0);
  app.fallos.escritura = false;
  await assert.rejects(app.servicio.registrarse(datos), { codigo: 'EMAIL_REGISTRADO' });
  await app.servicio.iniciarSesion(datos);
  assert.equal((await app.servicio.restaurarSesion()).email, datos.email);
});

test('si falla cerrar sesión no informa éxito ni borra la sesión anterior', async () => {
  const app = crearEntorno();
  await app.servicio.iniciarSesion(credencialesApi);
  app.fallos.borrado = true;
  await assert.rejects(app.servicio.cerrarSesion(), { codigo: 'ALMACENAMIENTO' });
  assert.equal((await app.servicio.restaurarSesion()).email, credencialesApi.email);
  app.fallos.borrado = false;
  await app.servicio.cerrarSesion();
  assert.equal(await app.sesion.recuperarSesion(), null);
});

test('sesiones corruptas o con roles desconocidos se descartan con un error claro', async () => {
  for (const contenido of ['{incompleto', JSON.stringify({ version: 1, usuario: { id: '1', ...datos, rol: 'admin' } })]) {
    const app = crearEntorno('ios', new Map([['cercau.sesion.v3', contenido]]));
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
  await app.servicio.iniciarSesion(credencialesApi);
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
  const errores = validaciones.validarRegistro({ nombre: '', email: '', contrasena: '', confirmacion: '' });
  assert.deepEqual(Object.keys(errores).sort(), ['confirmacion', 'contrasena', 'email', 'nombre']);
});

test('la confirmación debe coincidir y el registro no necesita un rol', () => {
  const { validaciones } = crearEntorno();
  const formulario = { ...datos, confirmacion: 'OtraClave123' };
  assert.deepEqual(Object.keys(validaciones.validarRegistro(formulario)), ['confirmacion']);
  formulario.confirmacion = datos.contrasena;
  assert.equal(Object.keys(validaciones.validarRegistro(formulario)).length, 0);
});

test('inicio de sesión valida correo y contraseña sin alterar los valores escritos', () => {
  const { validaciones } = crearEntorno();
  assert.deepEqual(Object.keys(validaciones.validarInicioSesion({ email: 'correo sin arroba', contrasena: '' })).sort(), ['contrasena', 'email']);
  const credenciales = { email: ' VECINO@api.test ', contrasena: 'Prueba123' };
  assert.equal(Object.keys(validaciones.validarInicioSesion(credenciales)).length, 0);
  assert.equal(credenciales.email, ' VECINO@api.test ');
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
  let otro = await app.servicio.iniciarSesion(credencialesApi);
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
  assert.equal((await reinicio.servicio.iniciarSesion(credencialesApi)).favoritos[0], otro.favoritos[0]);
});

test('editar perfil conserva identificadores, rol, correo y relación con comercio', async () => {
  const app = crearEntorno();
  const comercio = await app.servicio.iniciarSesion({ email: 'comercio@api.test', contrasena: 'Prueba123' });
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
  await app.servicio.iniciarSesion(credencialesApi);
  await assert.rejects(app.cuenta.actualizarCuenta(ana, { avisosActivos: true }), { codigo: 'SIN_SESION' });
  await assert.rejects(app.actividad.obtenerMisResenas(ana.id), { codigo: 'SIN_SESION' });
});

test('fallos de persistencia no sobrescriben favoritos ni preferencias anteriores', async () => {
  const app = crearEntorno();
  const usuario = await app.servicio.iniciarSesion(credencialesApi);
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
  const usuario = await app.servicio.iniciarSesion(credencialesApi);
  await assert.rejects(app.cuenta.actualizarCuenta(usuario, { favoritos: ['inventado'] }), { codigo: 'DATOS_INVALIDOS' });
  await assert.rejects(app.cuenta.actualizarCuenta(usuario, { rubrosDeInteres: ['inventado'] }), { codigo: 'DATOS_INVALIDOS' });
  const porIds = await app.comercios.obtenerComerciosPorIds(['cafe-la-esquina', 'cafe-la-esquina']);
  assert.equal(porIds.length, 1);
  assert.equal((await app.comercios.buscarComercios('CAFE', 'Todos'))[0].id, 'cafe-la-esquina');
});

test('cada login guarda el token recibido y un 401 elimina la sesión vencida', async () => {
  const app = crearEntorno();
  await app.servicio.iniciarSesion(credencialesApi);
  const primera = await app.sesion.recuperarSesion();
  await app.servicio.iniciarSesion(credencialesApi);
  const segunda = await app.sesion.recuperarSesion();
  assert.notEqual(primera.token, segunda.token);
  app.servidor.tokens.delete(segunda.token);
  await assert.rejects(app.servicio.restaurarSesion(), { codigo: 'SESION_INVALIDA' });
  assert.equal(app.disco.has('cercau.sesion.v3'), false);
  assert.equal(app.discoLocal.size, 1);
});

test('una sesión antigua sin token no autoriza acciones privadas', async () => {
  const app = crearEntorno('ios', new Map([['cercau.sesion.v1', JSON.stringify({ version: 1, usuario: { ...datos, id: 'anterior' } })]]));
  assert.equal(await app.servicio.restaurarSesion(), null);
  assert.equal(app.disco.size, 0);
});

test('un perfil corrupto se informa y se conserva para evitar pérdida de datos', async () => {
  const app = crearEntorno();
  const usuario = await app.servicio.iniciarSesion(credencialesApi);
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
  const usuario = await app.servicio.iniciarSesion(credencialesApi);
  assert.equal((await app.actividad.obtenerMisResenas(usuario.id)).length, 0);
  app.actividad.conectarConsultaResenas(async (id) => [{ id: 'externa', comercioNombre: 'Registro externo', texto: id, fecha: '20/10/2026' }]);
  assert.equal((await app.actividad.obtenerMisResenas(usuario.id))[0].texto, usuario.id);
});

test('sin URL configurada no envía el formulario a un destino implícito', async () => {
  const app = crearEntorno('ios', new Map(), new Map(), { apiURL: undefined });
  await assert.rejects(app.servicio.iniciarSesion(credencialesApi), { codigo: 'API_NO_DISPONIBLE' });
  assert.equal(app.http.solicitudes.length, 0);
  assert.equal(crearEntorno().cliente.defaults.timeout, 12000);
});

test('los errores de red, timeout y servidor tienen mensajes españoles sin exponer credenciales', async () => {
  for (const [fallo, codigo] of [['ERR_NETWORK', 'SIN_CONEXION'], ['ECONNABORTED', 'API_NO_DISPONIBLE'], ['ETIMEDOUT', 'API_NO_DISPONIBLE']]) {
    const app = crearEntorno();
    app.http.fallo = fallo;
    await assert.rejects(app.servicio.iniciarSesion(credencialesApi), (error) => {
      assert.equal(error.codigo, codigo);
      assert.equal(error.message.includes(credencialesApi.contrasena), false);
      return true;
    });
    assert.equal(app.http.solicitudes.length, 1);
    assert.equal(app.disco.size, 0);
  }
  for (const [status, codigo] of [[400, 'DATOS_INVALIDOS'], [500, 'API_NO_DISPONIBLE'], [503, 'API_NO_DISPONIBLE'], [418, 'ERROR_INESPERADO']]) {
    const app = crearEntorno();
    app.http.respuesta = { status, data: { error: { codigo: 'ERROR_INTERNO', mensaje: 'Detalle privado del servidor' } } };
    await assert.rejects(app.servicio.iniciarSesion(credencialesApi), (error) => error.codigo === codigo && !error.message.includes('Detalle privado'));
  }
});

test('si la API está caída conserva el token para reintentar GET /yo sin autorizar un perfil local', async () => {
  const app = crearEntorno();
  await app.servicio.iniciarSesion(credencialesApi);
  const sesion = await app.sesion.recuperarSesion();
  app.http.fallo = 'ERR_NETWORK';
  await assert.rejects(app.servicio.restaurarSesion(), { codigo: 'SIN_CONEXION' });
  assert.equal((await app.sesion.recuperarSesion()).token, sesion.token);
  app.http.fallo = null;
  assert.equal((await app.servicio.restaurarSesion()).id, sesion.usuarioId);
});

test('el login público no envía Bearer y credenciales incorrectas no invalidan otra sesión', async () => {
  const app = crearEntorno();
  await app.servicio.iniciarSesion(credencialesApi);
  const anterior = await app.sesion.recuperarSesion();
  await assert.rejects(app.servicio.iniciarSesion({ ...credencialesApi, contrasena: 'Incorrecta1' }), { codigo: 'CREDENCIALES_INVALIDAS' });
  assert.equal(app.http.solicitudes.at(-1).headers.get('Authorization'), undefined);
  assert.equal((await app.sesion.recuperarSesion()).token, anterior.token);
});

test('un 401 protegido avisa al contexto y borra la sesión sin borrar preferencias', async () => {
  const app = crearEntorno();
  await app.servicio.iniciarSesion(credencialesApi);
  let avisos = 0;
  const cancelar = app.sesion.suscribirSesionInvalidada(() => { avisos++; });
  app.servidor.tokens.clear();
  await assert.rejects(app.cliente.get('/yo'), { codigo: 'SESION_INVALIDA' });
  assert.equal(avisos, 1);
  assert.equal(await app.sesion.recuperarSesion(), null);
  assert.equal(app.disco.size, 0);
  assert.equal(app.discoLocal.size, 1);
  cancelar();
});

test('un token rechazado tampoco puede reutilizarse si SecureStore falla al borrarlo', async () => {
  const app = crearEntorno();
  await app.servicio.iniciarSesion(credencialesApi);
  let invalidada = false;
  app.sesion.suscribirSesionInvalidada(() => { invalidada = true; });
  app.servidor.tokens.clear();
  app.fallos.borrado = true;
  await assert.rejects(app.servicio.restaurarSesion(), { codigo: 'ALMACENAMIENTO' });
  assert.equal(invalidada, true);
  assert.equal(await app.sesion.recuperarSesion(), null);
  app.fallos.borrado = false;
  await app.servicio.iniciarSesion(credencialesApi);
  assert.ok(await app.servicio.restaurarSesion());
});

test('un 401 tardío no cierra la sesión de un nuevo ingreso', async () => {
  const app = crearEntorno();
  await app.servicio.iniciarSesion(credencialesApi);
  let liberar;
  let enviada;
  const iniciada = new Promise((resolve) => { enviada = resolve; });
  const espera = new Promise((resolve) => { liberar = resolve; });
  const antigua = assert.rejects(app.cliente.get('/yo', { adapter: async (config) => {
    enviada();
    await espera;
    throw new axios.AxiosError('401 tardío', 'ERR_BAD_RESPONSE', config, {}, { status: 401, data: {}, config });
  } }), { codigo: 'SESION_INVALIDA' });
  await iniciada;
  await app.servicio.iniciarSesion(credencialesApi);
  const nueva = await app.sesion.recuperarSesion();
  liberar();
  await antigua;
  assert.equal((await app.sesion.recuperarSesion()).token, nueva.token);
});

test('descarta las sesiones ficticias v1/v2 sin enviarlas a la API', async () => {
  const app = crearEntorno('ios', new Map([
    ['cercau.sesion.v1', JSON.stringify({ usuario: { id: 'local-ana' } })],
    ['cercau.sesion.v2', JSON.stringify({ version: 2, token: 'a'.repeat(64), usuarioId: 'local-ana', venceEn: Date.now() + 999999 })],
  ]));
  assert.equal(await app.servicio.restaurarSesion(), null);
  assert.equal(app.http.solicitudes.length, 0);
  assert.equal(app.disco.size, 0);
});

test('un usuario guardado en el dispositivo no habilita el ingreso sin respuesta de la API', async () => {
  const app = crearEntorno();
  await app.servicio.iniciarSesion(credencialesApi);
  await app.servicio.cerrarSesion();
  app.http.fallo = 'ERR_NETWORK';
  await assert.rejects(app.servicio.iniciarSesion(credencialesApi), { codigo: 'SIN_CONEXION' });
  assert.equal(await app.sesion.recuperarSesion(), null);
});

test('rechaza respuestas de login malformadas sin persistir tokens ni contraseñas', async () => {
  for (const datos of [null, { token: '', usuario: {} }, { token: 'token-externo', usuario: { rol: 'admin' } }]) {
    const app = crearEntorno();
    app.http.respuesta = { status: 200, data: { datos, meta: null } };
    await assert.rejects(app.servicio.iniciarSesion(credencialesApi), { codigo: 'ERROR_INESPERADO' });
    assert.equal(app.disco.size, 0);
    assert.equal(app.discoLocal.size, 0);
  }
});

test('GET /yo debe corresponder al usuario de la sesión guardada', async () => {
  const app = crearEntorno();
  const usuario = await app.servicio.iniciarSesion(credencialesApi);
  app.http.respuesta = { status: 200, data: { datos: { ...usuario, id: 'otro-usuario' }, meta: null } };
  await assert.rejects(app.servicio.restaurarSesion(), { codigo: 'SESION_INVALIDA' });
  assert.equal(await app.sesion.recuperarSesion(), null);
});

test('el ingreso admite contraseñas de 1 a 100 caracteres y el registro exige al menos 8', () => {
  const { validaciones } = crearEntorno();
  assert.equal(Object.keys(validaciones.validarInicioSesion({ ...credencialesApi, contrasena: 'x' })).length, 0);
  assert.ok(validaciones.validarInicioSesion({ ...credencialesApi, contrasena: 'x'.repeat(101) }).contrasena);
  assert.ok(validaciones.validarRegistro({ ...datos, contrasena: '123', confirmacion: '123' }).contrasena);
});

test('la preferencia biométrica sobrevive al reinicio y solo se recupera con un token real válido', async () => {
  const app = crearEntorno('android');
  const usuario = await app.servicio.iniciarSesion(credencialesApi);
  await app.biometria.solicitarValidacionBiometrica();
  await app.cuenta.actualizarCuenta(usuario, { biometriaActiva: true });
  const reinicio = crearEntorno('android', app.disco, app.discoLocal);
  assert.equal((await reinicio.servicio.restaurarSesion()).biometriaActiva, true);
  reinicio.servidor.tokens.clear();
  await assert.rejects(reinicio.servicio.restaurarSesion(), { codigo: 'SESION_INVALIDA' });
  assert.equal(await reinicio.sesion.recuperarSesion(), null);
  for (const valor of [...app.disco.values(), ...app.discoLocal.values()]) {
    assert.equal(valor.includes(credencialesApi.contrasena), false);
    assert.equal(valor.includes('resumen'), false);
  }
});

test('una respuesta de GET /yo que termina después del logout no restaura la cuenta', async () => {
  const app = crearEntorno();
  const usuario = await app.servicio.iniciarSesion(credencialesApi);
  let liberar;
  let enviada;
  const iniciada = new Promise((resolve) => { enviada = resolve; });
  const espera = new Promise((resolve) => { liberar = resolve; });
  app.cliente.defaults.adapter = async (config) => {
    enviada();
    await espera;
    return { status: 200, data: { datos: usuario, meta: null }, config, headers: {} };
  };
  const restauracion = app.servicio.restaurarSesion();
  await iniciada;
  await app.servicio.cerrarSesion();
  liberar();
  assert.equal(await restauracion, null);
  assert.equal(await app.sesion.recuperarSesion(), null);
});
