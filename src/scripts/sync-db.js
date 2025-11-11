const { sequelize } = require('../models');

// Función para sincronizar los modelos con la base de datos
const syncDatabase = async () => {
  try {
    console.log('Sincronizando modelos con la base de datos...');
    
    // Usamos { alter: true } para actualizar las tablas existentes
    await sequelize.sync({ alter: true });
    
    console.log('Base de datos sincronizada correctamente');
    return true;
  } catch (error) {
    console.error('Error al sincronizar la base de datos:', error);
    return false;
  }
};

// Si se ejecuta directamente este archivo
if (require.main === module) {
  syncDatabase()
    .then(() => {
      console.log('Proceso de sincronización completado');
      process.exit(0);
    })
    .catch(error => {
      console.error('Error en el proceso de sincronización:', error);
      process.exit(1);
    });
}

module.exports = syncDatabase;
