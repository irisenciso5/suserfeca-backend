const { sequelize } = require('../models');

async function syncAllModels() {
  try {
    console.log('Sincronizando todos los modelos con la base de datos...');
    
    // Sincronizar todos los modelos a la vez
    // Esto es más seguro para SQLite cuando hay relaciones entre tablas
    await sequelize.sync({ alter: true });
    console.log('Todos los modelos sincronizados correctamente.');
    
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
syncAllModels();
