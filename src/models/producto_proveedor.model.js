const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ProductoProveedor = sequelize.define('ProductoProveedor', {
  producto_id: {
    type: DataTypes.INTEGER,
    primaryKey: true
  },
  proveedor_id: {
    type: DataTypes.INTEGER,
    primaryKey: true
  }
}, {
  tableName: 'producto_proveedor',
  timestamps: false
});

module.exports = ProductoProveedor;
