/**
 * Script para regenerar todos los datos de prueba
 * Elimina productos, compras y ventas existentes y los recrea
 */

const { sequelize } = require('../models');
const seedData = require('./seed-data');

const regenerateData = async () => {
  try {
    console.log('Iniciando regeneración de datos de prueba...');
    
    // Eliminar datos existentes en orden inverso para evitar problemas con las relaciones
    console.log('Eliminando datos existentes...');
    
    // Eliminar detalles de ventas y compras
    await sequelize.query('DELETE FROM detalle_venta');
    await sequelize.query('DELETE FROM detalle_compra');
    
    // Eliminar ventas y compras
    await sequelize.query('DELETE FROM ventas');
    await sequelize.query('DELETE FROM compras');
    
    // Eliminar productos
    await sequelize.query('DELETE FROM productos');
    
    // Reiniciar contadores de autoincremento
    await sequelize.query('DELETE FROM sqlite_sequence WHERE name="detalle_venta"');
    await sequelize.query('DELETE FROM sqlite_sequence WHERE name="detalle_compra"');
    await sequelize.query('DELETE FROM sqlite_sequence WHERE name="ventas"');
    await sequelize.query('DELETE FROM sqlite_sequence WHERE name="compras"');
    await sequelize.query('DELETE FROM sqlite_sequence WHERE name="productos"');
    
    console.log('Datos eliminados correctamente');
    
    // Regenerar datos usando el script de seed-data
    console.log('Regenerando datos...');
    await seedData(true); // Pasar true para forzar la regeneración
    
    console.log('Datos regenerados correctamente');
    return true;
  } catch (error) {
    console.error('Error al regenerar datos:', error);
    return false;
  }
};

// Si se ejecuta directamente este archivo
if (require.main === module) {
  regenerateData()
    .then(() => {
      console.log('Proceso de regeneración de datos completado');
      process.exit(0);
    })
    .catch(error => {
      console.error('Error en el proceso de regeneración de datos:', error);
      process.exit(1);
    });
}

module.exports = regenerateData;
