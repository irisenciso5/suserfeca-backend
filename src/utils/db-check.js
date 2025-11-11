const fs = require('fs');
const path = require('path');

/**
 * Verifica si la base de datos ya ha sido inicializada
 * @returns {boolean} true si ya fue inicializada, false en caso contrario
 */
const isDatabaseInitialized = () => {
  try {
    // Verificar si existe el archivo de marca
    const flagPath = path.join(__dirname, '../../.db_initialized');
    return fs.existsSync(flagPath);
  } catch (error) {
    console.error('Error al verificar el estado de inicialización de la base de datos:', error);
    return false;
  }
};

/**
 * Marca la base de datos como inicializada
 */
const markDatabaseAsInitialized = () => {
  try {
    // Crear archivo de marca
    const flagPath = path.join(__dirname, '../../.db_initialized');
    fs.writeFileSync(flagPath, new Date().toISOString());
    console.log('Base de datos marcada como inicializada');
    return true;
  } catch (error) {
    console.error('Error al marcar la base de datos como inicializada:', error);
    return false;
  }
};

module.exports = {
  isDatabaseInitialized,
  markDatabaseAsInitialized
};
