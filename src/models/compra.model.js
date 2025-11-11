const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Compra = sequelize.define('Compra', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  proveedor_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  fecha_orden: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  monto_total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Monto total en dólares (USD)'
  },
  monto_total_divisa_original: {
    type: DataTypes.DECIMAL(20, 6),
    allowNull: true,
    comment: 'Monto total en la divisa original de la compra'
  },
  divisa_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID de la divisa utilizada en esta compra'
  },
  tasa_cambio_aplicada: {
    type: DataTypes.DECIMAL(20, 6),
    allowNull: true,
    comment: 'Tasa de cambio aplicada al momento de la compra'
  },
  estado: {
    type: DataTypes.ENUM('pendiente', 'completada', 'cancelada'),
    allowNull: false
  }
}, {
  tableName: 'compras',
  timestamps: false
});

module.exports = Compra;
