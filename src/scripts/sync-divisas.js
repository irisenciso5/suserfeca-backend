const { sequelize, Divisa, ConfiguracionEmpresa, Venta, Compra } = require('../models');

async function syncModels() {
  try {
    console.log('Sincronizando modelos relacionados con divisas...');
    
    // Sincronizar los modelos necesarios
    await Divisa.sync({ alter: true });
    console.log('Modelo de Divisa sincronizado correctamente.');
    
    await ConfiguracionEmpresa.sync({ alter: true });
    console.log('Modelo de ConfiguracionEmpresa sincronizado correctamente.');
    
    await Venta.sync({ alter: true });
    console.log('Modelo de Venta sincronizado correctamente.');
    
    await Compra.sync({ alter: true });
    console.log('Modelo de Compra sincronizado correctamente.');
    
    console.log('Ejecutando script de inicialización de divisas...');
    // Importar y ejecutar el script de inicialización de divisas
    const { initDivisas } = require('./init-divisas');
    await initDivisas();
    
    console.log('Proceso completado con éxito.');
  } catch (error) {
    console.error('Error al sincronizar modelos:', error);
  } finally {
    // Cerrar la conexión a la base de datos
    await sequelize.close();
  }
}

// Ejecutar la función
syncModels();
