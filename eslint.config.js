const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

// Usamos las reglas de Expo y omitimos archivos generados automáticamente.
module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['.expo/**', 'dist/**'],
  },
]);
