const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Proveedor = sequelize.define('Proveedor', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre_empresa: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  pais: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  direccion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  contacto_nombre: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  contacto_telefono: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  contacto_email: {
    type: DataTypes.STRING(100),
    allowNull: true
  }
}, {
  tableName: 'proveedores',
  timestamps: false
});

module.exports = Proveedor;
