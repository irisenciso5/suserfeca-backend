/**
 * Script para limpiar tablas de respaldo
 * Este script elimina las tablas de respaldo que pueden causar conflictos
 */

const { sequelize } = require('../config/database');

const cleanBackupTables = async () => {
  try {
    console.log('Buscando tablas de respaldo...');
    
    // Consultar todas las tablas que terminan en _backup
    const [results] = await sequelize.query(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name LIKE '%_backup'
    `);
    
    if (results.length === 0) {
      console.log('No se encontraron tablas de respaldo');
      return;
    }
    
    console.log(`Se encontraron ${results.length} tablas de respaldo`);
    
    // Eliminar cada tabla de respaldo
    for (const result of results) {
      const tableName = result.name;
      console.log(`Eliminando tabla ${tableName}...`);
      await sequelize.query(`DROP TABLE IF EXISTS "${tableName}"`);
      console.log(`Tabla ${tableName} eliminada`);
    }
    
    console.log('Proceso de limpieza completado');
  } catch (error) {
    console.error('Error al limpiar tablas de respaldo:', error);
  } finally {
    process.exit(0);
  }
};

// Ejecutar la función
cleanBackupTables();
