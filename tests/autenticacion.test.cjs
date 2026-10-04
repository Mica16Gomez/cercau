const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

// Node no ejecuta módulos nativos. Probamos el servicio real con un almacenamiento
// en memoria que puede simular los rechazos de SecureStore y localStorage.
function crearEntorno(plataforma = 'ios', disco = new Map()) {
  const fallos = { lectura: false, escritura: false, borrado: false };
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
      window: { localStorage: almacenamiento },
      require: (nombre) => {
        if (nombre === 'react-native') return { Platform: { OS: plataforma } };
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
    servicio: cargar('src/servicios/autenticacion.ts'),
    sesion: cargar('src/servicios/almacenamiento-sesion.ts'),
    validaciones: cargar('src/servicios/validaciones-autenticacion.ts'),
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
  const persistido = [...app.disco.values()][0];
  assert.equal(persistido.includes(datos.contrasena), false);
  assert.deepEqual(Object.keys(JSON.parse(persistido).usuario).sort(), ['email', 'id', 'nombre', 'rol']);
  const reinicio = crearEntorno('ios', app.disco);
  assert.equal(JSON.stringify(await reinicio.sesion.recuperarSesion()), JSON.stringify(usuario));
  assert.equal(app.demoras[0], 700);
});

test('cuentas de ambos roles, cierre persistente y nuevo inicio de sesión', async () => {
  const app = crearEntorno();
  await app.servicio.registrarse({ ...datos, rol: 'comercio' });
  await app.servicio.cerrarSesion();
  assert.equal(await crearEntorno('ios', app.disco).sesion.recuperarSesion(), null);
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
  assert.equal((await app.sesion.recuperarSesion()).email, datos.email);
});

test('si falla cerrar sesión no informa éxito ni borra la sesión anterior', async () => {
  const app = crearEntorno();
  await app.servicio.iniciarSesion(credencialesDemo);
  app.fallos.borrado = true;
  await assert.rejects(app.servicio.cerrarSesion(), { codigo: 'ALMACENAMIENTO' });
  assert.equal((await app.sesion.recuperarSesion()).email, credencialesDemo.email);
  app.fallos.borrado = false;
  await app.servicio.cerrarSesion();
  assert.equal(await app.sesion.recuperarSesion(), null);
});

test('sesiones corruptas o con roles desconocidos se descartan con un error claro', async () => {
  for (const contenido of ['{incompleto', JSON.stringify({ version: 1, usuario: { id: '1', ...datos, rol: 'admin' } })]) {
    const app = crearEntorno('ios', new Map([['cercau.sesion.v1', contenido]]));
    await assert.rejects(app.sesion.recuperarSesion(), { codigo: 'SESION_INVALIDA' });
    assert.equal(app.disco.size, 0);
  }
});

test('el fallo de lectura se convierte en un mensaje controlado', async () => {
  const app = crearEntorno();
  app.fallos.lectura = true;
  await assert.rejects(app.sesion.recuperarSesion(), { codigo: 'ALMACENAMIENTO' });
});

test('web conserva y elimina la sesión mediante localStorage', async () => {
  const app = crearEntorno('web');
  await app.servicio.iniciarSesion(credencialesDemo);
  const reinicio = crearEntorno('web', app.disco);
  assert.equal((await reinicio.sesion.recuperarSesion()).email, credencialesDemo.email);
  await reinicio.servicio.cerrarSesion();
  assert.equal(await reinicio.sesion.recuperarSesion(), null);
  reinicio.fallos.escritura = true;
  await assert.rejects(reinicio.servicio.iniciarSesion(credencialesDemo), { codigo: 'ALMACENAMIENTO' });
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
