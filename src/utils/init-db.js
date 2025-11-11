const { sequelize, Rol, Usuario, Categoria, Marca, ConfiguracionEmpresa, Divisa } = require('../models');
const { isDatabaseInitialized, markDatabaseAsInitialized } = require('./db-check');
const bcrypt = require('bcrypt');

// Función para inicializar la base de datos con datos por defecto
const initializeDatabase = async (force = false) => {
  try {
    // Verificar si la base de datos ya fue inicializada
    if (!force && isDatabaseInitialized()) {
      console.log('La base de datos ya fue inicializada anteriormente. Omitiendo inicialización.');
      return true;
    }
    
    console.log('Inicializando base de datos...');
    
    // Sincronizar modelos con la base de datos
    // Usamos { alter: true } para asegurar que se creen todas las tablas y se actualicen si ya existen
    await sequelize.sync({ alter: true });
    console.log('Base de datos sincronizada');
    
    // Crear roles por defecto si no existen
    const roles = [
      { nombre: 'administrador' },
      { nombre: 'vendedor' },
      { nombre: 'consulta' }
    ];
    
    for (const rol of roles) {
      const [rolCreado] = await Rol.findOrCreate({
        where: { nombre: rol.nombre },
        defaults: rol
      });
      console.log(`Rol ${rolCreado.nombre} ${rolCreado.id === rolCreado.id ? 'ya existe' : 'creado'}`);
    }
    
    // Crear usuario administrador por defecto si no existe
    const adminRol = await Rol.findOne({ where: { nombre: 'administrador' } });
    
    if (adminRol) {
      const [adminUsuario, created] = await Usuario.findOrCreate({
        where: { email: 'admin@sistema.com' },
        defaults: {
          nombre: 'Administrador',
          email: 'admin@sistema.com',
          password: 'admin123',
          rol_id: adminRol.id,
          activo: true
        }
      });
      
      console.log(`Usuario administrador ${created ? 'creado' : 'ya existe'}`);
    }
    
    // Crear categorías específicas para repuestos de vehículos grandes
    const categorias = [
      { nombre: 'Motor' },
      { nombre: 'Transmisión' },
      { nombre: 'Sistema de Frenos' },
      { nombre: 'Sistema Eléctrico' },
      { nombre: 'Suspensión' },
      { nombre: 'Dirección' },
      { nombre: 'Filtros' },
      { nombre: 'Lubricantes' },
      { nombre: 'Carrocería' },
      { nombre: 'Refrigeración' },
      { nombre: 'Neumáticos y Ruedas' },
      { nombre: 'Sistema de Escape' },
      { nombre: 'Sistema Hidráulico' },
      { nombre: 'Sistema de Combustible' },
      { nombre: 'Herramientas Especializadas' }
    ];
    
    for (const categoria of categorias) {
      const [categoriaCreada, created] = await Categoria.findOrCreate({
        where: { nombre: categoria.nombre },
        defaults: categoria
      });
      
      if (created) {
        console.log(`Categoría ${categoriaCreada.nombre} creada`);
      }
    }
    
    // Crear marcas específicas para repuestos de vehículos grandes
    const marcas = [
      // Fabricantes de camiones y maquinaria pesada
      { nombre: 'Caterpillar' },
      { nombre: 'Cummins' },
      { nombre: 'Detroit Diesel' },
      { nombre: 'Volvo' },
      { nombre: 'Mercedes-Benz' },
      { nombre: 'MAN' },
      { nombre: 'Scania' },
      { nombre: 'Kenworth' },
      { nombre: 'Mack' },
      { nombre: 'Freightliner' },
      { nombre: 'International' },
      { nombre: 'Iveco' },
      { nombre: 'DAF' },
      { nombre: 'Peterbilt' },
      { nombre: 'Western Star' },
      
      // Fabricantes de componentes y repuestos
      { nombre: 'Bosch' },
      { nombre: 'SKF' },
      { nombre: 'Fleetguard' },
      { nombre: 'Baldwin' },
      { nombre: 'Wabco' },
      { nombre: 'ZF' },
      { nombre: 'Eaton' },
      { nombre: 'Dana' },
      { nombre: 'Meritor' },
      { nombre: 'Timken' },
      { nombre: 'Federal-Mogul' },
      { nombre: 'Donaldson' },
      { nombre: 'Bendix' },
      { nombre: 'Haldex' },
      { nombre: 'Parker' }
    ];
    
    for (const marca of marcas) {
      const [marcaCreada, created] = await Marca.findOrCreate({
        where: { nombre: marca.nombre },
        defaults: marca
      });
      
      if (created) {
        console.log(`Marca ${marcaCreada.nombre} creada`);
      }
    }
    
    // Crear configuración de empresa por defecto
    const [configuracion, createdConfig] = await ConfiguracionEmpresa.findOrCreate({
      where: { id: 1 },
      defaults: {
        id: 1,
        nombre_empresa: 'Mi Empresa',
        impuesto_porcentaje: 16.00,
        alerta_stock_minimo: true
      }
    });
    
    console.log(`Configuración de empresa ${createdConfig ? 'creada' : 'ya existe'}`);
    
    // Crear divisas por defecto
    const divisas = [
      {
        codigo: 'VES',
        nombre: 'Bolívar venezolano',
        simbolo: 'Bs.',
        tasa_cambio: 1.0, // Base: 1 VES = 1 VES (divisa principal)
        es_principal: true,
        activa: true
      },
      {
        codigo: 'USD',
        nombre: 'Dólar estadounidense',
        simbolo: '$',
        tasa_cambio: 0.00435, // 1 VES = 0.00435 USD (equivalente a 1 USD = 230 VES)
        es_principal: false,
        activa: true
      },
      {
        codigo: 'COP',
        nombre: 'Peso colombiano',
        simbolo: '$',
        tasa_cambio: 16.67, // 1 VES = 16.67 COP (equivalente a 1 COP = 0.06 VES)
        es_principal: false,
        activa: true
      },
      {
        codigo: 'EUR',
        nombre: 'Euro',
        simbolo: '€',
        tasa_cambio: 0.00374, // 1 VES = 0.00374 EUR (equivalente a 1 EUR = 267 VES)
        es_principal: false,
        activa: true
      }
    ];
    
    for (const divisa of divisas) {
      const [divisaCreada, created] = await Divisa.findOrCreate({
        where: { codigo: divisa.codigo },
        defaults: divisa
      });
      
      console.log(`Divisa ${divisaCreada.nombre} ${created ? 'creada' : 'ya existe'}`);
    }
    
    // Actualizar la configuración de la empresa para usar VES como divisa principal si no tiene una asignada
    const divisaPrincipal = await Divisa.findOne({ where: { codigo: 'VES' } });
    if (divisaPrincipal && !configuracion.divisa_principal_id) {
      await configuracion.update({ divisa_principal_id: divisaPrincipal.id });
      console.log('Configuración de divisa principal actualizada a Bolívar venezolano (VES)');
    }
    
    console.log('Base de datos inicializada correctamente');
    
    // Marcar la base de datos como inicializada
    markDatabaseAsInitialized();
    return true;
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
    return false;
  }
};

// Exportar función
module.exports = initializeDatabase;

// Si se ejecuta directamente este archivo
if (require.main === module) {
  // Forzar la inicialización cuando se ejecuta directamente
  initializeDatabase(true)
    .then(() => {
      console.log('Proceso de inicialización completado');
      process.exit(0);
    })
    .catch(error => {
      console.error('Error en el proceso de inicialización:', error);
      process.exit(1);
    });
}
