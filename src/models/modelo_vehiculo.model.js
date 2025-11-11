const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Modelo para representar los modelos de vehículos compatibles con los productos
 */
const ModeloVehiculo = sequelize.define('ModeloVehiculo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  marca: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Marca del vehículo (Toyota, Ford, Chevrolet, etc.)'
  },
  modelo: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Modelo del vehículo (Corolla, Mustang, Aveo, etc.)'
  },
  anio_inicio: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Año de inicio de compatibilidad'
  },
  anio_fin: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Año de fin de compatibilidad (null si sigue vigente)'
  },
  motor: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Descripción del motor (1.6L, V8, etc.)'
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Observaciones adicionales sobre el modelo'
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Indica si el modelo está activo en el sistema'
  }
}, {
  tableName: 'modelos_vehiculos',
  timestamps: true,
  indexes: [
    {
      name: 'idx_marca_modelo',
      fields: ['marca', 'modelo']
    },
    {
      name: 'idx_anios',
      fields: ['anio_inicio', 'anio_fin']
    }
  ]
});

module.exports = ModeloVehiculo;
