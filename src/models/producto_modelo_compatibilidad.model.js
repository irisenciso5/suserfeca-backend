const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Modelo para representar la relación muchos a muchos entre productos y modelos de vehículos
 */
const ProductoModeloCompatibilidad = sequelize.define('ProductoModeloCompatibilidad', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  producto_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID del producto'
  },
  modelo_vehiculo_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID del modelo de vehículo'
  },
  notas_compatibilidad: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notas específicas sobre la compatibilidad (ej: "Solo para versión automática")'
  },
  es_original: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Indica si es una pieza original o genérica/compatible'
  }
}, {
  tableName: 'productos_modelos_compatibilidad',
  timestamps: true,
  indexes: [
    {
      name: 'idx_producto_modelo',
      unique: true,
      fields: ['producto_id', 'modelo_vehiculo_id']
    }
  ]
});

module.exports = ProductoModeloCompatibilidad;
