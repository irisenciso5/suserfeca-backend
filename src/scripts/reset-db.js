/**
 * Script para reinicializar la base de datos
 * Este script elimina el archivo de marca de inicialización y ejecuta la inicialización forzada
 */

const fs = require('fs');
const path = require('path');
const initializeDatabase = require('../utils/init-db');

// Ruta al archivo de marca
const flagPath = path.join(__dirname, '../../.db_initialized');

// Eliminar el archivo de marca si existe
if (fs.existsSync(flagPath)) {
  console.log('Eliminando marca de inicialización...');
  fs.unlinkSync(flagPath);
  console.log('Marca de inicialización eliminada');
}

// Inicializar la base de datos de forma forzada
console.log('Reinicializando la base de datos...');
initializeDatabase(true)
  .then(() => {
    console.log('Base de datos reinicializada correctamente');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error al reinicializar la base de datos:', error);
    process.exit(1);
  });
