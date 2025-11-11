const { sequelize, ModeloVehiculo, ProductoModeloCompatibilidad } = require('../models');

async function syncVehiculosModels() {
  try {
    console.log('Sincronizando modelos relacionados con vehículos...');
    
    // Sincronizar solo los nuevos modelos, sin alterar los existentes
    await ModeloVehiculo.sync({ force: false });
    console.log('Modelo ModeloVehiculo sincronizado correctamente.');
    
    await ProductoModeloCompatibilidad.sync({ force: false });
    console.log('Modelo ProductoModeloCompatibilidad sincronizado correctamente.');
    
    console.log('Ejecutando script de inicialización de modelos de vehículos...');
    // Importar y ejecutar el script de inicialización de modelos de vehículos
    const { initModelosVehiculos } = require('./init-modelos-vehiculos');
    await initModelosVehiculos();
    
    console.log('Proceso completado con éxito.');
  } catch (error) {
    console.error('Error al sincronizar modelos:', error);
  } finally {
    // Cerrar la conexión a la base de datos
    await sequelize.close();
  }
}

// Ejecutar la función
syncVehiculosModels();
