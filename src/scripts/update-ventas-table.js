const { sequelize } = require('../config/database');

// Función para actualizar la tabla de ventas
const updateVentasTable = async () => {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('Actualizando tabla de ventas...');
    
    // Verificar si la columna 'iva' ya existe
    const checkIvaColumn = await sequelize.query(
      "PRAGMA table_info(ventas);",
      { type: sequelize.QueryTypes.SELECT, transaction }
    );
    
    const ivaColumnExists = checkIvaColumn.some(column => column.name === 'iva');
    const estadoColumnExists = checkIvaColumn.some(column => column.name === 'estado');
    
    // Agregar columna 'iva' si no existe
    if (!ivaColumnExists) {
      console.log('Agregando columna iva a la tabla ventas...');
      await sequelize.query(
        "ALTER TABLE ventas ADD COLUMN iva DECIMAL(10, 2) DEFAULT 0.00;",
        { transaction }
      );
      console.log('Columna iva agregada correctamente');
    } else {
      console.log('La columna iva ya existe en la tabla ventas');
    }
    
    // Agregar columna 'estado' si no existe
    if (!estadoColumnExists) {
      console.log('Agregando columna estado a la tabla ventas...');
      await sequelize.query(
        "ALTER TABLE ventas ADD COLUMN estado VARCHAR(20) DEFAULT 'completada' NOT NULL;",
        { transaction }
      );
      console.log('Columna estado agregada correctamente');
    } else {
      console.log('La columna estado ya existe en la tabla ventas');
    }
    
    // Confirmar la transacción
    await transaction.commit();
    console.log('Tabla de ventas actualizada correctamente');
    return true;
  } catch (error) {
    // Revertir la transacción en caso de error
    await transaction.rollback();
    console.error('Error al actualizar la tabla de ventas:', error);
    return false;
  }
};

// Si se ejecuta directamente este archivo
if (require.main === module) {
  updateVentasTable()
    .then(() => {
      console.log('Proceso de actualización completado');
      process.exit(0);
    })
    .catch(error => {
      console.error('Error en el proceso de actualización:', error);
      process.exit(1);
    });
}

module.exports = updateVentasTable;
