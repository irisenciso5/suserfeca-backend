const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Venta = sequelize.define('Venta', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  cliente_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  fecha_venta: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  descuento: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  monto_total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Monto total en dólares (USD)'
  },
  monto_total_divisa_original: {
    type: DataTypes.DECIMAL(20, 6),
    allowNull: true,
    comment: 'Monto total en la divisa original de la venta'
  },
  divisa_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID de la divisa utilizada en esta venta'
  },
  tasa_cambio_aplicada: {
    type: DataTypes.DECIMAL(20, 6),
    allowNull: true,
    comment: 'Tasa de cambio aplicada al momento de la venta'
  },
  iva: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0.00,
    comment: 'Monto del IVA aplicado a la venta'
  },
  estado: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'completada',
    comment: 'Estado de la venta: completada, pendiente, devuelta, anulada'
  }
}, {
  tableName: 'ventas',
  timestamps: false
});

module.exports = Venta;
