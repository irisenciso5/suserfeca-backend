const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Divisa = sequelize.define('Divisa', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  codigo: {
    type: DataTypes.STRING(3),
    allowNull: false,
    unique: true,
    comment: 'Código ISO de la divisa (USD, COP, VES, EUR)'
  },
  nombre: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Nombre de la divisa (Dólar estadounidense, Peso colombiano, etc.)'
  },
  simbolo: {
    type: DataTypes.STRING(5),
    allowNull: false,
    comment: 'Símbolo de la divisa ($, €, etc.)'
  },
  tasa_cambio: {
    type: DataTypes.DECIMAL(20, 6),
    allowNull: false,
    comment: 'Tasa de cambio con respecto al dólar (USD)'
  },
  es_principal: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Indica si es la divisa principal del sistema'
  },
  activa: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Indica si la divisa está activa en el sistema'
  },
  ultima_actualizacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: 'Fecha de la última actualización de la tasa de cambio'
  }
}, {
  tableName: 'divisas',
  timestamps: true
});

module.exports = Divisa;
