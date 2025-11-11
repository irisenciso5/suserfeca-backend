const { sequelize } = require('../config/database');
const { DataTypes } = require('sequelize');

// Importar modelos
const Rol = require('./rol.model');
const Usuario = require('./usuario.model');
const Categoria = require('./categoria.model');
const Marca = require('./marca.model');
const Proveedor = require('./proveedor.model');
const Producto = require('./producto.model');
const ProductoProveedor = require('./producto_proveedor.model');
const MovimientoInventario = require('./movimiento_inventario.model');
const Compra = require('./compra.model');
const DetalleCompra = require('./detalle_compra.model');
const Cliente = require('./cliente.model');
const Venta = require('./venta.model');
const DetalleVenta = require('./detalle_venta.model');
const ConfiguracionEmpresa = require('./configuracion_empresa.model');
const Backup = require('./backup.model');
const Divisa = require('./divisa.model');
const ModeloVehiculo = require('./modelo_vehiculo.model');
const ProductoModeloCompatibilidad = require('./producto_modelo_compatibilidad.model');

// Definir relaciones
// Usuarios - Roles
Usuario.belongsTo(Rol, { foreignKey: 'rol_id' });
Rol.hasMany(Usuario, { foreignKey: 'rol_id' });

// Productos - Categorías
Producto.belongsTo(Categoria, { foreignKey: 'categoria_id' });
Categoria.hasMany(Producto, { foreignKey: 'categoria_id' });

// Productos - Marcas
Producto.belongsTo(Marca, { foreignKey: 'marca_id' });
Marca.hasMany(Producto, { foreignKey: 'marca_id' });

// Productos - Proveedores (N:M)
Producto.belongsToMany(Proveedor, { through: ProductoProveedor, foreignKey: 'producto_id' });
Proveedor.belongsToMany(Producto, { through: ProductoProveedor, foreignKey: 'proveedor_id' });

// Movimientos de Inventario
MovimientoInventario.belongsTo(Producto, { foreignKey: 'producto_id' });
Producto.hasMany(MovimientoInventario, { foreignKey: 'producto_id' });
MovimientoInventario.belongsTo(Usuario, { foreignKey: 'usuario_id' });
Usuario.hasMany(MovimientoInventario, { foreignKey: 'usuario_id' });

// Compras
Compra.belongsTo(Proveedor, { foreignKey: 'proveedor_id' });
Proveedor.hasMany(Compra, { foreignKey: 'proveedor_id' });

// Detalles de Compra
DetalleCompra.belongsTo(Compra, { foreignKey: 'compra_id' });
Compra.hasMany(DetalleCompra, { foreignKey: 'compra_id' });
DetalleCompra.belongsTo(Producto, { foreignKey: 'producto_id' });
Producto.hasMany(DetalleCompra, { foreignKey: 'producto_id' });

// Ventas
Venta.belongsTo(Cliente, { foreignKey: 'cliente_id' });
Cliente.hasMany(Venta, { foreignKey: 'cliente_id' });
Venta.belongsTo(Usuario, { foreignKey: 'usuario_id' });
Usuario.hasMany(Venta, { foreignKey: 'usuario_id' });

// Detalles de Venta
DetalleVenta.belongsTo(Venta, { foreignKey: 'venta_id' });
Venta.hasMany(DetalleVenta, { foreignKey: 'venta_id' });
DetalleVenta.belongsTo(Producto, { foreignKey: 'producto_id' });
Producto.hasMany(DetalleVenta, { foreignKey: 'producto_id' });

// Backups
Backup.belongsTo(Usuario, { foreignKey: 'usuario_id' });
Usuario.hasMany(Backup, { foreignKey: 'usuario_id' });

// Divisas - ConfiguracionEmpresa
ConfiguracionEmpresa.belongsTo(Divisa, { foreignKey: 'divisa_principal_id', as: 'DivisaPrincipal' });
Divisa.hasMany(ConfiguracionEmpresa, { foreignKey: 'divisa_principal_id' });

// Divisas - Compras
Compra.belongsTo(Divisa, { foreignKey: 'divisa_id' });
Divisa.hasMany(Compra, { foreignKey: 'divisa_id' });

// Divisas - Ventas
Venta.belongsTo(Divisa, { foreignKey: 'divisa_id' });
Divisa.hasMany(Venta, { foreignKey: 'divisa_id' });

// Productos - ModelosVehiculos (N:M)
Producto.belongsToMany(ModeloVehiculo, { 
  through: ProductoModeloCompatibilidad, 
  foreignKey: 'producto_id',
  as: 'ModelosCompatibles'
});
ModeloVehiculo.belongsToMany(Producto, { 
  through: ProductoModeloCompatibilidad, 
  foreignKey: 'modelo_vehiculo_id',
  as: 'ProductosCompatibles'
});

// Relaciones para ProductoModeloCompatibilidad
ProductoModeloCompatibilidad.belongsTo(Producto, { foreignKey: 'producto_id' });
ProductoModeloCompatibilidad.belongsTo(ModeloVehiculo, { foreignKey: 'modelo_vehiculo_id' });

// Exportar modelos
module.exports = {
  sequelize,
  Rol,
  Usuario,
  Categoria,
  Marca,
  Proveedor,
  Producto,
  ProductoProveedor,
  MovimientoInventario,
  Compra,
  DetalleCompra,
  Cliente,
  Venta,
  DetalleVenta,
  ConfiguracionEmpresa,
  Backup,
  Divisa,
  ModeloVehiculo,
  ProductoModeloCompatibilidad
};
