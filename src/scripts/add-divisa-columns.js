const { sequelize, Venta, Compra } = require('../models');
const { DataTypes } = require('sequelize');

async function addDivisaColumns() {
  try {
    console.log('Agregando columnas relacionadas con divisas a las tablas existentes...');
    
    const queryInterface = sequelize.getQueryInterface();
    
    // Agregar columnas a la tabla ventas
    console.log('Agregando columnas a la tabla ventas...');
    try {
      await queryInterface.addColumn('ventas', 'monto_total_divisa_original', {
        type: DataTypes.DECIMAL(20, 6),
        allowNull: true,
        comment: 'Monto total en la divisa original de la venta'
      });
      console.log('Columna monto_total_divisa_original agregada a ventas.');
    } catch (error) {
      console.log('La columna monto_total_divisa_original ya existe en ventas o hubo un error:', error.message);
    }
    
    try {
      await queryInterface.addColumn('ventas', 'divisa_id', {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'ID de la divisa utilizada en esta venta'
      });
      console.log('Columna divisa_id agregada a ventas.');
    } catch (error) {
      console.log('La columna divisa_id ya existe en ventas o hubo un error:', error.message);
    }
    
    try {
      await queryInterface.addColumn('ventas', 'tasa_cambio_aplicada', {
        type: DataTypes.DECIMAL(20, 6),
        allowNull: true,
        comment: 'Tasa de cambio aplicada al momento de la venta'
      });
      console.log('Columna tasa_cambio_aplicada agregada a ventas.');
    } catch (error) {
      console.log('La columna tasa_cambio_aplicada ya existe en ventas o hubo un error:', error.message);
    }
    
    // Agregar columnas a la tabla compras
    console.log('Agregando columnas a la tabla compras...');
    try {
      await queryInterface.addColumn('compras', 'monto_total_divisa_original', {
        type: DataTypes.DECIMAL(20, 6),
        allowNull: true,
        comment: 'Monto total en la divisa original de la compra'
      });
      console.log('Columna monto_total_divisa_original agregada a compras.');
    } catch (error) {
      console.log('La columna monto_total_divisa_original ya existe en compras o hubo un error:', error.message);
    }
    
    try {
      await queryInterface.addColumn('compras', 'divisa_id', {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'ID de la divisa utilizada en esta compra'
      });
      console.log('Columna divisa_id agregada a compras.');
    } catch (error) {
      console.log('La columna divisa_id ya existe en compras o hubo un error:', error.message);
    }
    
    try {
      await queryInterface.addColumn('compras', 'tasa_cambio_aplicada', {
        type: DataTypes.DECIMAL(20, 6),
        allowNull: true,
        comment: 'Tasa de cambio aplicada al momento de la compra'
      });
      console.log('Columna tasa_cambio_aplicada agregada a compras.');
    } catch (error) {
      console.log('La columna tasa_cambio_aplicada ya existe en compras o hubo un error:', error.message);
    }
    
    // Agregar columna a la tabla configuracion_empresa
    console.log('Agregando columna a la tabla configuracion_empresa...');
    try {
      await queryInterface.addColumn('configuracion_empresa', 'divisa_principal_id', {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'ID de la divisa principal utilizada por la empresa'
      });
      console.log('Columna divisa_principal_id agregada a configuracion_empresa.');
    } catch (error) {
      console.log('La columna divisa_principal_id ya existe en configuracion_empresa o hubo un error:', error.message);
    }
    
    console.log('Proceso completado con éxito.');
  } catch (error) {
    console.error('Error al agregar columnas:', error);
  } finally {
    // Cerrar la conexión a la base de datos
    await sequelize.close();
  }
}

// Ejecutar la función
addDivisaColumns();
