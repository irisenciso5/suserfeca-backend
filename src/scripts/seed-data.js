/**
 * Script para generar datos de prueba para el sistema de inventario
 * Enfocado en repuestos de vehículos grandes para una empresa en Venezuela
 */

const { sequelize, Categoria, Marca, Producto, Proveedor, Cliente, Usuario, Rol, 
        Compra, DetalleCompra, Venta, DetalleVenta } = require('../models');

const seedData = async (forceRegenerate = false) => {
  try {
    console.log('Iniciando generación de datos de prueba...');

    // Verificar si ya existen datos
    const productosCount = await Producto.count();
    if (!forceRegenerate && productosCount > 5) { // Ya hay productos más allá de los básicos
      console.log('Ya existen datos en la base de datos. Omitiendo generación de datos de prueba.');
      return;
    }

    // 1. Crear categorías de repuestos
    console.log('Creando categorías...');
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
      { nombre: 'Refrigeración' }
    ];

    for (const categoria of categorias) {
      await Categoria.findOrCreate({
        where: { nombre: categoria.nombre },
        defaults: categoria
      });
    }

    // 2. Crear marcas de vehículos y repuestos
    console.log('Creando marcas...');
    const marcas = [
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
      { nombre: 'Bosch' },
      { nombre: 'SKF' },
      { nombre: 'Fleetguard' },
      { nombre: 'Baldwin' },
      { nombre: 'Wabco' },
      { nombre: 'ZF' },
      { nombre: 'Eaton' }
    ];

    for (const marca of marcas) {
      await Marca.findOrCreate({
        where: { nombre: marca.nombre },
        defaults: marca
      });
    }

    // 3. Crear proveedores
    console.log('Creando proveedores...');
    const proveedores = [
      {
        nombre_empresa: 'Repuestos Internacionales C.A.',
        pais: 'Estados Unidos',
        direccion: 'Miami, FL',
        contacto_nombre: 'Carlos Rodríguez',
        contacto_telefono: '+1 305-555-1234',
        contacto_email: 'carlos@repuestosinternacionales.com'
      },
      {
        nombre_empresa: 'Diesel Parts Venezuela',
        pais: 'Venezuela',
        direccion: 'Caracas, Venezuela',
        contacto_nombre: 'María González',
        contacto_telefono: '+58 212-555-6789',
        contacto_email: 'maria@dieselparts.com.ve'
      },
      {
        nombre_empresa: 'Truck Spares Colombia',
        pais: 'Colombia',
        direccion: 'Bogotá, Colombia',
        contacto_nombre: 'Juan Pérez',
        contacto_telefono: '+57 1-555-7890',
        contacto_email: 'juan@truckspares.co'
      },
      {
        nombre_empresa: 'European Truck Parts',
        pais: 'España',
        direccion: 'Madrid, España',
        contacto_nombre: 'Ana Martínez',
        contacto_telefono: '+34 91-555-4321',
        contacto_email: 'ana@europeantruckparts.es'
      },
      {
        nombre_empresa: 'Heavy Duty Supplies',
        pais: 'Panamá',
        direccion: 'Ciudad de Panamá, Panamá',
        contacto_nombre: 'Roberto Díaz',
        contacto_telefono: '+507 555-8765',
        contacto_email: 'roberto@heavydutysupplies.com'
      }
    ];

    for (const proveedor of proveedores) {
      await Proveedor.findOrCreate({
        where: { nombre_empresa: proveedor.nombre_empresa },
        defaults: proveedor
      });
    }

    // 4. Crear clientes
    console.log('Creando clientes...');
    const clientes = [
      {
        nombre: 'Transportes del Este C.A.',
        identificacion: 'J-12345678-9',
        telefono: '+58 414-555-1234',
        direccion: 'Carretera Nacional, km 15, Puerto La Cruz, Venezuela'
      },
      {
        nombre: 'Logística y Distribución Andina',
        identificacion: 'J-87654321-0',
        telefono: '+58 416-555-5678',
        direccion: 'Av. Principal, Zona Industrial, Mérida, Venezuela'
      },
      {
        nombre: 'Constructora Bolívar',
        identificacion: 'J-23456789-0',
        telefono: '+58 424-555-9012',
        direccion: 'Calle 5, Sector Industrial, Maracaibo, Venezuela'
      },
      {
        nombre: 'Minera Guayana',
        identificacion: 'J-34567890-1',
        telefono: '+58 412-555-3456',
        direccion: 'Zona Industrial, Puerto Ordaz, Venezuela'
      },
      {
        nombre: 'Agrícola del Zulia',
        identificacion: 'J-45678901-2',
        telefono: '+58 414-555-7890',
        direccion: 'Carretera Principal, San Carlos, Venezuela'
      },
      {
        nombre: 'Taller Mecánico El Experto',
        identificacion: 'V-12345678',
        telefono: '+58 416-555-2345',
        direccion: 'Calle Los Mecánicos, Caracas, Venezuela'
      },
      {
        nombre: 'Servicio Técnico Diesel Truck',
        identificacion: 'J-56789012-3',
        telefono: '+58 424-555-6789',
        direccion: 'Av. Principal, Valencia, Venezuela'
      }
    ];

    for (const cliente of clientes) {
      await Cliente.findOrCreate({
        where: { identificacion: cliente.identificacion },
        defaults: cliente
      });
    }

    // 5. Crear usuarios (vendedores)
    console.log('Creando usuarios vendedores...');
    const rolVendedor = await Rol.findOne({ where: { nombre: 'vendedor' } });
    
    if (rolVendedor) {
      const vendedores = [
        {
          nombre: 'Pedro Ramírez',
          email: 'pedro@sistema.com',
          password: 'vendedor123',
          rol_id: rolVendedor.id,
          activo: true
        },
        {
          nombre: 'Laura Mendoza',
          email: 'laura@sistema.com',
          password: 'vendedor123',
          rol_id: rolVendedor.id,
          activo: true
        }
      ];

      for (const vendedor of vendedores) {
        await Usuario.findOrCreate({
          where: { email: vendedor.email },
          defaults: vendedor
        });
      }
    }

    // 6. Crear productos
    console.log('Creando productos...');
    
    // Obtener IDs de categorías y marcas
    const categoriaMotor = await Categoria.findOne({ where: { nombre: 'Motor' } });
    const categoriaTransmision = await Categoria.findOne({ where: { nombre: 'Transmisión' } });
    const categoriaFrenos = await Categoria.findOne({ where: { nombre: 'Sistema de Frenos' } });
    const categoriaElectrico = await Categoria.findOne({ where: { nombre: 'Sistema Eléctrico' } });
    const categoriaSuspension = await Categoria.findOne({ where: { nombre: 'Suspensión' } });
    const categoriaFiltros = await Categoria.findOne({ where: { nombre: 'Filtros' } });
    const categoriaLubricantes = await Categoria.findOne({ where: { nombre: 'Lubricantes' } });
    
    const marcaCaterpillar = await Marca.findOne({ where: { nombre: 'Caterpillar' } });
    const marcaCummins = await Marca.findOne({ where: { nombre: 'Cummins' } });
    const marcaVolvo = await Marca.findOne({ where: { nombre: 'Volvo' } });
    const marcaMercedes = await Marca.findOne({ where: { nombre: 'Mercedes-Benz' } });
    const marcaBosch = await Marca.findOne({ where: { nombre: 'Bosch' } });
    const marcaSKF = await Marca.findOne({ where: { nombre: 'SKF' } });
    const marcaFleetguard = await Marca.findOne({ where: { nombre: 'Fleetguard' } });
    const marcaWabco = await Marca.findOne({ where: { nombre: 'Wabco' } });
    
    const productos = [
      {
        codigo: 'M-CAT-001',
        descripcion: 'Juego de Pistones Caterpillar 3406E',
        categoria_id: categoriaMotor?.id,
        marca_id: marcaCaterpillar?.id,
        precio_compra: 450.00,
        precio_venta: 650.00,
        stock_actual: 8,
        stock_minimo: 3,
        ubicacion: 'Estante A-1',
        pais_origen: 'Estados Unidos',
        observaciones: 'Compatible con modelos 3406E y C15'
      },
      {
        codigo: 'M-CUM-001',
        descripcion: 'Kit de Juntas para Motor Cummins ISX',
        categoria_id: categoriaMotor?.id,
        marca_id: marcaCummins?.id,
        precio_compra: 180.00,
        precio_venta: 280.00,
        stock_actual: 12,
        stock_minimo: 5,
        ubicacion: 'Estante A-2',
        pais_origen: 'Estados Unidos',
        observaciones: 'Kit completo incluye juntas de culata'
      },
      {
        codigo: 'T-VOL-001',
        descripcion: 'Caja de Cambios Volvo FH 12',
        categoria_id: categoriaTransmision?.id,
        marca_id: marcaVolvo?.id,
        precio_compra: 2800.00,
        precio_venta: 3500.00,
        stock_actual: 2,
        stock_minimo: 1,
        ubicacion: 'Sección B-1',
        pais_origen: 'Suecia',
        observaciones: 'Remanufacturada con garantía de 6 meses'
      },
      {
        codigo: 'F-WAB-001',
        descripcion: 'Compresor de Aire Wabco para Sistema de Frenos',
        categoria_id: categoriaFrenos?.id,
        marca_id: marcaWabco?.id,
        precio_compra: 320.00,
        precio_venta: 450.00,
        stock_actual: 5,
        stock_minimo: 2,
        ubicacion: 'Estante C-3',
        pais_origen: 'Alemania',
        observaciones: 'Compatible con múltiples marcas de camiones europeos'
      },
      {
        codigo: 'E-BOS-001',
        descripcion: 'Alternador Bosch 24V 100A',
        categoria_id: categoriaElectrico?.id,
        marca_id: marcaBosch?.id,
        precio_compra: 280.00,
        precio_venta: 380.00,
        stock_actual: 7,
        stock_minimo: 3,
        ubicacion: 'Estante D-2',
        pais_origen: 'Alemania',
        observaciones: 'Para camiones Mercedes y MAN'
      },
      {
        codigo: 'S-SKF-001',
        descripcion: 'Rodamiento de Rueda Delantera SKF',
        categoria_id: categoriaSuspension?.id,
        marca_id: marcaSKF?.id,
        precio_compra: 85.00,
        precio_venta: 130.00,
        stock_actual: 15,
        stock_minimo: 6,
        ubicacion: 'Estante E-1',
        pais_origen: 'Suecia',
        observaciones: 'Alta durabilidad para cargas pesadas'
      },
      {
        codigo: 'FIL-FLT-001',
        descripcion: 'Filtro de Aceite Fleetguard LF9009',
        categoria_id: categoriaFiltros?.id,
        marca_id: marcaFleetguard?.id,
        precio_compra: 18.00,
        precio_venta: 28.00,
        stock_actual: 40,
        stock_minimo: 15,
        ubicacion: 'Estante F-1',
        pais_origen: 'Estados Unidos',
        observaciones: 'Compatible con motores Cummins'
      },
      {
        codigo: 'FIL-FLT-002',
        descripcion: 'Filtro de Combustible Fleetguard FF5320',
        categoria_id: categoriaFiltros?.id,
        marca_id: marcaFleetguard?.id,
        precio_compra: 22.00,
        precio_venta: 35.00,
        stock_actual: 35,
        stock_minimo: 15,
        ubicacion: 'Estante F-1',
        pais_origen: 'Estados Unidos',
        observaciones: 'Para motores diesel de alta potencia'
      },
      {
        codigo: 'FIL-FLT-003',
        descripcion: 'Filtro de Aire Fleetguard AF25139M',
        categoria_id: categoriaFiltros?.id,
        marca_id: marcaFleetguard?.id,
        precio_compra: 45.00,
        precio_venta: 65.00,
        stock_actual: 25,
        stock_minimo: 10,
        ubicacion: 'Estante F-2',
        pais_origen: 'Estados Unidos',
        observaciones: 'Para camiones de carga pesada'
      },
      {
        codigo: 'M-MER-001',
        descripcion: 'Culata Mercedes-Benz Actros',
        categoria_id: categoriaMotor?.id,
        marca_id: marcaMercedes?.id,
        precio_compra: 1200.00,
        precio_venta: 1800.00,
        stock_actual: 3,
        stock_minimo: 1,
        ubicacion: 'Sección A-3',
        pais_origen: 'Alemania',
        observaciones: 'Original con garantía'
      },
      {
        codigo: 'L-MOB-001',
        descripcion: 'Aceite Mobil Delvac MX 15W-40 (Galón)',
        categoria_id: categoriaLubricantes?.id,
        marca_id: null,
        precio_compra: 22.00,
        precio_venta: 32.00,
        stock_actual: 50,
        stock_minimo: 20,
        ubicacion: 'Estante G-1',
        pais_origen: 'Estados Unidos',
        observaciones: 'Para motores diesel de trabajo pesado'
      },
      {
        codigo: 'L-MOB-002',
        descripcion: 'Aceite Mobil Delvac 1 5W-40 Sintético (Galón)',
        categoria_id: categoriaLubricantes?.id,
        marca_id: null,
        precio_compra: 35.00,
        precio_venta: 48.00,
        stock_actual: 30,
        stock_minimo: 15,
        ubicacion: 'Estante G-1',
        pais_origen: 'Estados Unidos',
        observaciones: 'Sintético para condiciones extremas'
      },
      {
        codigo: 'E-BOS-002',
        descripcion: 'Motor de Arranque Bosch para Camiones Pesados',
        categoria_id: categoriaElectrico?.id,
        marca_id: marcaBosch?.id,
        precio_compra: 320.00,
        precio_venta: 450.00,
        stock_actual: 6,
        stock_minimo: 2,
        ubicacion: 'Estante D-1',
        pais_origen: 'Alemania',
        observaciones: 'Compatible con múltiples marcas'
      },
      {
        codigo: 'F-WAB-002',
        descripcion: 'Válvula Reguladora de Presión para Sistema de Frenos',
        categoria_id: categoriaFrenos?.id,
        marca_id: marcaWabco?.id,
        precio_compra: 75.00,
        precio_venta: 120.00,
        stock_actual: 10,
        stock_minimo: 4,
        ubicacion: 'Estante C-2',
        pais_origen: 'Alemania',
        observaciones: 'Alta precisión y durabilidad'
      },
      {
        codigo: 'S-SKF-002',
        descripcion: 'Amortiguador Delantero para Camión Pesado',
        categoria_id: categoriaSuspension?.id,
        marca_id: marcaSKF?.id,
        precio_compra: 110.00,
        precio_venta: 165.00,
        stock_actual: 8,
        stock_minimo: 4,
        ubicacion: 'Estante E-2',
        pais_origen: 'Suecia',
        observaciones: 'Para cargas de hasta 12 toneladas'
      }
    ];

    for (const producto of productos) {
      await Producto.findOrCreate({
        where: { codigo: producto.codigo },
        defaults: producto
      });
    }

    // 7. Crear compras
    console.log('Creando compras y detalles de compra...');
    
    // Obtener proveedores
    const proveedorInt = await Proveedor.findOne({ where: { nombre_empresa: 'Repuestos Internacionales C.A.' } });
    const proveedorVzla = await Proveedor.findOne({ where: { nombre_empresa: 'Diesel Parts Venezuela' } });
    
    if (proveedorInt && proveedorVzla) {
      // Crear compras
      const compra1 = await Compra.create({
        proveedor_id: proveedorInt.id,
        fecha_orden: '2025-10-15',
        estado: 'completada',
        monto_total: 3500.00
      });
      
      const compra2 = await Compra.create({
        proveedor_id: proveedorVzla.id,
        fecha_orden: '2025-10-25',
        estado: 'completada',
        monto_total: 1200.00
      });
      
      // Crear detalles de compra
      const filtroAceite = await Producto.findOne({ where: { codigo: 'FIL-FLT-001' } });
      const filtroCombustible = await Producto.findOne({ where: { codigo: 'FIL-FLT-002' } });
      const filtroAire = await Producto.findOne({ where: { codigo: 'FIL-FLT-003' } });
      const aceite = await Producto.findOne({ where: { codigo: 'L-MOB-001' } });
      
      if (filtroAceite && filtroCombustible && filtroAire && aceite) {
        await DetalleCompra.create({
          compra_id: compra1.id,
          producto_id: filtroAceite.id,
          cantidad: 20,
          precio_unitario: 18.00
        });
        
        await DetalleCompra.create({
          compra_id: compra1.id,
          producto_id: filtroCombustible.id,
          cantidad: 15,
          precio_unitario: 22.00
        });
        
        await DetalleCompra.create({
          compra_id: compra1.id,
          producto_id: filtroAire.id,
          cantidad: 10,
          precio_unitario: 45.00
        });
        
        await DetalleCompra.create({
          compra_id: compra2.id,
          producto_id: aceite.id,
          cantidad: 30,
          precio_unitario: 22.00
        });
      }
    }

    // 8. Crear ventas
    console.log('Creando ventas y detalles de venta...');
    
    // Obtener clientes
    const cliente1 = await Cliente.findOne({ where: { nombre: 'Transportes del Este C.A.' } });
    const cliente2 = await Cliente.findOne({ where: { nombre: 'Taller Mecánico El Experto' } });
    
    // Obtener vendedor
    const vendedor = await Usuario.findOne({ where: { email: 'pedro@sistema.com' } });
    
    if (cliente1 && cliente2 && vendedor) {
      // Crear ventas
      const venta1 = await Venta.create({
        cliente_id: cliente1.id,
        usuario_id: vendedor.id,
        fecha_venta: '2025-10-20',
        descuento: 0.00,
        monto_total: 280.00
      });
      
      const venta2 = await Venta.create({
        cliente_id: cliente2.id,
        usuario_id: vendedor.id,
        fecha_venta: '2025-10-28',
        descuento: 10.00,
        monto_total: 638.00
      });
      
      // Crear detalles de venta
      const filtroAceite = await Producto.findOne({ where: { codigo: 'FIL-FLT-001' } });
      const filtroCombustible = await Producto.findOne({ where: { codigo: 'FIL-FLT-002' } });
      const aceite = await Producto.findOne({ where: { codigo: 'L-MOB-001' } });
      const alternador = await Producto.findOne({ where: { codigo: 'E-BOS-001' } });
      
      if (filtroAceite && filtroCombustible && aceite && alternador) {
        await DetalleVenta.create({
          venta_id: venta1.id,
          producto_id: filtroAceite.id,
          cantidad: 5,
          precio_unitario: 28.00
        });
        
        await DetalleVenta.create({
          venta_id: venta1.id,
          producto_id: filtroCombustible.id,
          cantidad: 4,
          precio_unitario: 35.00
        });
        
        await DetalleVenta.create({
          venta_id: venta2.id,
          producto_id: aceite.id,
          cantidad: 8,
          precio_unitario: 32.00
        });
        
        await DetalleVenta.create({
          venta_id: venta2.id,
          producto_id: alternador.id,
          cantidad: 1,
          precio_unitario: 380.00
        });
      }
    }

    console.log('Datos de prueba generados correctamente');
    return true;
  } catch (error) {
    console.error('Error al generar datos de prueba:', error);
    return false;
  }
};

// Si se ejecuta directamente este archivo
if (require.main === module) {
  seedData()
    .then(() => {
      console.log('Proceso de generación de datos completado');
      process.exit(0);
    })
    .catch(error => {
      console.error('Error en el proceso de generación de datos:', error);
      process.exit(1);
    });
}

module.exports = seedData;
