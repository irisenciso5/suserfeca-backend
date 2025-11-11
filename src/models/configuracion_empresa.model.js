const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ConfiguracionEmpresa = sequelize.define('ConfiguracionEmpresa', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    defaultValue: 1
  },
  nombre_empresa: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  logo_url: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  rif: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  contacto_info: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  impuesto_porcentaje: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00
  },
  alerta_stock_minimo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  divisa_principal_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID de la divisa principal utilizada por la empresa'
  }
}, {
  tableName: 'configuracion_empresa',
  timestamps: false
});

module.exports = ConfiguracionEmpresa;
