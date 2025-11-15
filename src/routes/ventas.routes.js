const express = require('express');
const router = express.Router();
const { Venta, DetalleVenta, Cliente, Producto, Usuario, MovimientoInventario, sequelize, Rol } = require('../models');
const { verificarToken, esVendedor } = require('../middleware/auth.middleware');
const { Op } = require('sequelize');
const ExcelJS = require('exceljs');

// Obtener todas las ventas
router.get('/', verificarToken, async (req, res) => {
  try {
    const { 
      cliente_id, 
      usuario_id, 
      fecha_inicio, 
      fecha_fin,
      limite,
      pagina
    } = req.query;
    
    // Obtener el usuario autenticado y su rol
    const usuarioAutenticado = await Usuario.findByPk(req.userId, {
      include: [{ model: Rol }]
    });
    
    if (!usuarioAutenticado) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // Configurar opciones de búsqueda
    const opciones = {
      include: [
        { model: Cliente },
        { model: Usuario, attributes: ['id', 'nombre', 'email'] }
      ],
      where: {},
      order: [['fecha_venta', 'DESC']]
    };
    
    // Si el usuario es vendedor, solo mostrar sus ventas
    if (usuarioAutenticado.Rol.nombre === 'vendedor') {
      opciones.where.usuario_id = req.userId;
    }
    // Si no es vendedor (es admin) y se especifica un usuario_id en la consulta, filtrar por ese usuario
    else if (usuario_id) {
      opciones.where.usuario_id = usuario_id;
    }
    
    // Filtrar por cliente
    if (cliente_id) {
      opciones.where.cliente_id = cliente_id;
    }
    
    // Filtrar por rango de fechas
    if (fecha_inicio && fecha_fin) {
      opciones.where.fecha_venta = {
        [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)]
      };
    } else if (fecha_inicio) {
      opciones.where.fecha_venta = {
        [Op.gte]: new Date(fecha_inicio)
      };
    } else if (fecha_fin) {
      opciones.where.fecha_venta = {
        [Op.lte]: new Date(fecha_fin)
      };
    }
    
    // Paginación
    if (limite && pagina) {
      opciones.limit = parseInt(limite);
      opciones.offset = (parseInt(pagina) - 1) * parseInt(limite);
    }
    
    // Obtener ventas
    const ventas = await Venta.findAndCountAll(opciones);
    
    res.status(200).json({
      total: ventas.count,
      pagina: pagina ? parseInt(pagina) : 1,
      limite: limite ? parseInt(limite) : ventas.count,
      ventas: ventas.rows
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtener una venta por ID
router.get('/:id', verificarToken, async (req, res) => {
  try {
    // Obtener el usuario autenticado y su rol
    const usuarioAutenticado = await Usuario.findByPk(req.userId, {
      include: [{ model: Rol }]
    });
    
    if (!usuarioAutenticado) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // Configurar opciones de búsqueda
    const opciones = {
      include: [
        { model: Cliente },
        { model: Usuario, attributes: ['id', 'nombre', 'email'] },
        { 
          model: DetalleVenta,
          include: [{ model: Producto }]
        }
      ],
      where: { id: req.params.id }
    };
    
    // Si el usuario es vendedor, solo permitir ver sus propias ventas
    if (usuarioAutenticado.Rol.nombre === 'vendedor') {
      opciones.where.usuario_id = req.userId;
    }
    
    const venta = await Venta.findOne(opciones);
    
    if (!venta) {
      return res.status(404).json({ message: 'Venta no encontrada' });
    }
    
    res.status(200).json(venta);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Crear una nueva venta (vendedor o admin)
router.post('/', [verificarToken, esVendedor], async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { 
      cliente_id, 
      descuento,
      detalles,
      iva,
      estado
    } = req.body;
    
    // Validar campos requeridos
    if (!cliente_id || !detalles || !Array.isArray(detalles) || detalles.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Cliente y detalles son requeridos' });
    }
    
    // Verificar que el cliente existe
    const cliente = await Cliente.findByPk(cliente_id, { transaction });
    if (!cliente) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    
    // Calcular monto total
    let montoTotal = 0;
    for (const detalle of detalles) {
      if (!detalle.producto_id || !detalle.cantidad || !detalle.precio_unitario) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Cada detalle debe tener producto, cantidad y precio unitario' });
      }
      
      // Verificar que el producto existe
      const producto = await Producto.findByPk(detalle.producto_id, { transaction });
      if (!producto) {
        await transaction.rollback();
        return res.status(404).json({ message: `Producto con ID ${detalle.producto_id} no encontrado` });
      }
      
      // Verificar stock suficiente
      if (producto.stock_actual < detalle.cantidad) {
        await transaction.rollback();
        return res.status(400).json({ 
          message: `Stock insuficiente para el producto: ${producto.descripcion}`,
          stock_actual: producto.stock_actual,
          cantidad_solicitada: detalle.cantidad
        });
      }
      
      montoTotal += detalle.cantidad * detalle.precio_unitario;
    }
    
    // Aplicar descuento si existe
    if (descuento && descuento > 0) {
      montoTotal -= descuento;
    }
    
    // Crear venta
    const nuevaVenta = await Venta.create({
      cliente_id,
      usuario_id: req.userId,
      fecha_venta: new Date(),
      descuento: descuento || 0,
      monto_total: montoTotal,
      iva: iva || 0.00,
      estado: estado || 'completada'
    }, { transaction });
    
    // Crear detalles de venta y actualizar inventario
    for (const detalle of detalles) {
      await DetalleVenta.create({
        venta_id: nuevaVenta.id,
        producto_id: detalle.producto_id,
        cantidad: detalle.cantidad,
        precio_unitario: detalle.precio_unitario
      }, { transaction });
      
      const producto = await Producto.findByPk(detalle.producto_id, { transaction });
      
      // Registrar movimiento de inventario
      await MovimientoInventario.create({
        producto_id: detalle.producto_id,
        tipo_movimiento: 'salida',
        cantidad: detalle.cantidad,
        motivo: `Venta #${nuevaVenta.id}`,
        usuario_id: req.userId,
        fecha: new Date()
      }, { transaction });
      
      // Actualizar stock
      await producto.update({
        stock_actual: producto.stock_actual - detalle.cantidad
      }, { transaction });
    }
    
    // Confirmar transacción
    await transaction.commit();
    
    // Obtener venta creada con sus relaciones
    const ventaCreada = await Venta.findByPk(nuevaVenta.id, {
      include: [
        { model: Cliente },
        { model: Usuario, attributes: ['id', 'nombre', 'email'] },
        { 
          model: DetalleVenta,
          include: [{ model: Producto }]
        }
      ]
    });
    
    res.status(201).json(ventaCreada);
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: error.message });
  }
});

// Anular una venta (vendedor o admin)
router.post('/:id/anular', [verificarToken, esVendedor], async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const venta = await Venta.findByPk(req.params.id, {
      include: [
        { 
          model: DetalleVenta,
          include: [{ model: Producto }]
        }
      ],
      transaction
    });
    
    if (!venta) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Venta no encontrada' });
    }
    
    // Verificar si la venta ya fue anulada
    const ventaAnulada = await MovimientoInventario.findOne({
      where: {
        motivo: `Anulación Venta #${venta.id}`
      },
      transaction
    });
    
    if (ventaAnulada) {
      await transaction.rollback();
      return res.status(400).json({ message: 'La venta ya fue anulada previamente' });
    }
    
    // Revertir inventario
    for (const detalle of venta.DetalleVentas) {
      const producto = detalle.Producto;
      
      // Registrar movimiento de inventario
      await MovimientoInventario.create({
        producto_id: detalle.producto_id,
        tipo_movimiento: 'entrada',
        cantidad: detalle.cantidad,
        motivo: `Anulación Venta #${venta.id}`,
        usuario_id: req.userId,
        fecha: new Date()
      }, { transaction });
      
      // Actualizar stock
      await producto.update({
        stock_actual: producto.stock_actual + detalle.cantidad
      }, { transaction });
    }
    
    // Actualizar el estado de la venta a 'anulada'
    await venta.update({
      estado: 'anulada'
    }, { transaction });

    // Confirmar transacción
    await transaction.commit();
    
    res.status(200).json({ message: 'Venta anulada correctamente' });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: error.message });
  }
});

// Procesar devolución de una venta (vendedor o admin)
router.post('/:id/devolucion', [verificarToken, esVendedor], async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const venta = await Venta.findByPk(req.params.id, {
      include: [
        { 
          model: DetalleVenta,
          include: [{ model: Producto }]
        }
      ],
      transaction
    });
    
    if (!venta) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Venta no encontrada' });
    }
    
    // Verificar si la venta ya fue devuelta o anulada
    if (venta.estado === 'devuelta' || venta.estado === 'anulada') {
      await transaction.rollback();
      return res.status(400).json({ message: `La venta ya fue ${venta.estado} previamente` });
    }
    
    // Obtener los productos a devolver del cuerpo de la solicitud
    const { productos_devueltos, motivo } = req.body;
    
    if (!productos_devueltos || !Array.isArray(productos_devueltos) || productos_devueltos.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Debe especificar los productos a devolver' });
    }
    
    // Validar que los productos devueltos pertenezcan a la venta
    for (const devolucion of productos_devueltos) {
      const detalleVenta = venta.DetalleVentas.find(d => d.producto_id === devolucion.producto_id);
      
      if (!detalleVenta) {
        await transaction.rollback();
        return res.status(400).json({ message: `El producto con ID ${devolucion.producto_id} no pertenece a esta venta` });
      }
      
      if (devolucion.cantidad <= 0 || devolucion.cantidad > detalleVenta.cantidad) {
        await transaction.rollback();
        return res.status(400).json({ 
          message: `Cantidad inválida para el producto con ID ${devolucion.producto_id}`,
          cantidad_vendida: detalleVenta.cantidad,
          cantidad_devolucion: devolucion.cantidad
        });
      }
    }
    
    // Procesar la devolución
    for (const devolucion of productos_devueltos) {
      const producto = await Producto.findByPk(devolucion.producto_id, { transaction });
      
      // Registrar movimiento de inventario
      await MovimientoInventario.create({
        producto_id: devolucion.producto_id,
        tipo_movimiento: 'entrada',
        cantidad: devolucion.cantidad,
        motivo: `Devolución Venta #${venta.id} - ${motivo || 'Sin motivo especificado'}`,
        usuario_id: req.userId,
        fecha: new Date()
      }, { transaction });
      
      // Actualizar stock
      await producto.update({
        stock_actual: producto.stock_actual + devolucion.cantidad
      }, { transaction });
    }
    
    // Verificar si se están devolviendo todos los productos
    let totalProductosVendidos = 0;
    let totalProductosDevueltos = 0;
    
    // Contar total de productos vendidos
    for (const detalle of venta.DetalleVentas) {
      totalProductosVendidos += detalle.cantidad;
    }
    
    // Contar total de productos devueltos
    for (const devolucion of productos_devueltos) {
      totalProductosDevueltos += devolucion.cantidad;
    }
    
    // Actualizar el estado de la venta solo si se devuelven todos los productos
    if (totalProductosDevueltos >= totalProductosVendidos) {
      await venta.update({
        estado: 'devuelta'
      }, { transaction });
    } else {
      // Para devoluciones parciales, registrar un movimiento adicional con información
      await MovimientoInventario.create({
        producto_id: productos_devueltos[0].producto_id, // Usamos el primer producto como referencia
        tipo_movimiento: 'entrada',
        cantidad: 0, // Cantidad 0 para que no afecte el inventario
        motivo: `Devolución parcial: ${totalProductosDevueltos} de ${totalProductosVendidos} productos - Venta #${venta.id} - ${motivo || 'Sin motivo especificado'}`,
        usuario_id: req.userId,
        fecha: new Date()
      }, { transaction });
    }
    
    // Confirmar transacción
    await transaction.commit();
    
    res.status(200).json({ message: 'Devolución procesada correctamente' });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: error.message });
  }
});

// Generar reporte de ventas por período
router.get('/reportes/periodo', verificarToken, async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    
    if (!fecha_inicio || !fecha_fin) {
      return res.status(400).json({ message: 'Fecha de inicio y fin son requeridas' });
    }
    
    const ventas = await Venta.findAll({
      where: {
        fecha_venta: {
          [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)]
        }
      },
      include: [
        { model: Cliente },
        { model: Usuario, attributes: ['id', 'nombre', 'email'] }
      ],
      order: [['fecha_venta', 'ASC']]
    });
    
    // Calcular totales
    const totalVentas = ventas.length;
    const montoTotal = ventas.reduce((sum, venta) => sum + parseFloat(venta.monto_total), 0);
    const totalDescuentos = ventas.reduce((sum, venta) => sum + parseFloat(venta.descuento), 0);
    
    res.status(200).json({
      periodo: {
        inicio: fecha_inicio,
        fin: fecha_fin
      },
      totalVentas,
      montoTotal,
      totalDescuentos,
      ventas
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Crear un apartado de inventario (venta pendiente)
router.post('/apartado', [verificarToken, esVendedor], async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { 
      cliente_id, 
      descuento,
      detalles,
      iva,
      fecha_limite
    } = req.body;
    
    // Validar campos requeridos
    if (!cliente_id || !detalles || !Array.isArray(detalles) || detalles.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Cliente y detalles son requeridos' });
    }
    
    // Verificar que el cliente existe
    const cliente = await Cliente.findByPk(cliente_id, { transaction });
    if (!cliente) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    
    // Calcular monto total
    let montoTotal = 0;
    for (const detalle of detalles) {
      if (!detalle.producto_id || !detalle.cantidad || !detalle.precio_unitario) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Cada detalle debe tener producto, cantidad y precio unitario' });
      }
      
      // Verificar que el producto existe
      const producto = await Producto.findByPk(detalle.producto_id, { transaction });
      if (!producto) {
        await transaction.rollback();
        return res.status(404).json({ message: `Producto con ID ${detalle.producto_id} no encontrado` });
      }
      
      // Verificar stock suficiente
      if (producto.stock_actual < detalle.cantidad) {
        await transaction.rollback();
        return res.status(400).json({ 
          message: `Stock insuficiente para el producto: ${producto.descripcion}`,
          stock_actual: producto.stock_actual,
          cantidad_solicitada: detalle.cantidad
        });
      }
      
      montoTotal += detalle.cantidad * detalle.precio_unitario;
    }
    
    // Aplicar descuento si existe
    if (descuento && descuento > 0) {
      montoTotal -= descuento;
    }
    
    // Crear venta con estado 'pendiente'
    const nuevaVenta = await Venta.create({
      cliente_id,
      usuario_id: req.userId,
      fecha_venta: new Date(),
      descuento: descuento || 0,
      monto_total: montoTotal,
      iva: iva || 0.00,
      estado: 'pendiente'
    }, { transaction });
    
    // Crear detalles de venta y actualizar inventario
    for (const detalle of detalles) {
      await DetalleVenta.create({
        venta_id: nuevaVenta.id,
        producto_id: detalle.producto_id,
        cantidad: detalle.cantidad,
        precio_unitario: detalle.precio_unitario
      }, { transaction });
      
      const producto = await Producto.findByPk(detalle.producto_id, { transaction });
      
      // Registrar movimiento de inventario
      await MovimientoInventario.create({
        producto_id: detalle.producto_id,
        tipo_movimiento: 'salida',
        cantidad: detalle.cantidad,
        motivo: `Apartado #${nuevaVenta.id}`,
        usuario_id: req.userId,
        fecha: new Date()
      }, { transaction });
      
      // Actualizar stock
      await producto.update({
        stock_actual: producto.stock_actual - detalle.cantidad
      }, { transaction });
    }
    
    // Confirmar transacción
    await transaction.commit();
    
    // Obtener venta creada con sus relaciones
    const ventaCreada = await Venta.findByPk(nuevaVenta.id, {
      include: [
        { model: Cliente },
        { model: Usuario, attributes: ['id', 'nombre', 'email'] },
        { 
          model: DetalleVenta,
          include: [{ model: Producto }]
        }
      ]
    });
    
    res.status(201).json(ventaCreada);
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: error.message });
  }
});

// Completar un apartado (cambiar estado de pendiente a completada)
router.post('/:id/completar', [verificarToken, esVendedor], async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const venta = await Venta.findByPk(req.params.id, { transaction });
    
    if (!venta) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Venta no encontrada' });
    }
    
    // Verificar que la venta esté en estado pendiente
    if (venta.estado !== 'pendiente') {
      await transaction.rollback();
      return res.status(400).json({ message: `La venta no está en estado pendiente, estado actual: ${venta.estado}` });
    }
    
    // Actualizar el estado de la venta a 'completada'
    await venta.update({
      estado: 'completada'
    }, { transaction });
    
    // Confirmar transacción
    await transaction.commit();
    
    res.status(200).json({ message: 'Venta completada correctamente' });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: error.message });
  }
});

// Actualizar estado de una venta
router.put('/:id', [verificarToken, esVendedor], async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { estado } = req.body;
    
    // Validar que el estado sea válido
    const estadosValidos = ['completada', 'pendiente', 'devuelta', 'anulada'];
    if (!estado || !estadosValidos.includes(estado)) {
      await transaction.rollback();
      return res.status(400).json({ 
        message: 'Estado no válido', 
        estadosValidos 
      });
    }
    
    const venta = await Venta.findByPk(req.params.id, {
      include: [
        { 
          model: DetalleVenta,
          include: [{ model: Producto }]
        }
      ],
      transaction
    });
    
    if (!venta) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Venta no encontrada' });
    }
    
    const estadoAnterior = venta.estado;
    
    // Si se está cambiando a anulada o devuelta y no estaba en ese estado antes
    if ((estado === 'anulada' || estado === 'devuelta') && 
        estadoAnterior !== 'anulada' && estadoAnterior !== 'devuelta') {
      
      // Verificar si ya hay movimientos de inventario para esta anulación/devolución
      const movimientoExistente = await MovimientoInventario.findOne({
        where: {
          motivo: { [Op.like]: `%${estado === 'anulada' ? 'Anulación' : 'Devolución'} Venta #${venta.id}%` }
        },
        transaction
      });
      
      if (!movimientoExistente) {
        // Revertir inventario para cada producto
        for (const detalle of venta.DetalleVentas) {
          const producto = detalle.Producto;
          
          // Registrar movimiento de inventario
          await MovimientoInventario.create({
            producto_id: detalle.producto_id,
            tipo_movimiento: 'entrada',
            cantidad: detalle.cantidad,
            motivo: `${estado === 'anulada' ? 'Anulación' : 'Devolución'} Venta #${venta.id}`,
            usuario_id: req.userId,
            fecha: new Date()
          }, { transaction });
          
          // Actualizar stock
          await producto.update({
            stock_actual: producto.stock_actual + detalle.cantidad
          }, { transaction });
        }
      }
    }
    
    // Actualizar el estado de la venta
    await venta.update({ estado }, { transaction });
    
    // Confirmar transacción
    await transaction.commit();
    
    // Obtener la venta actualizada
    const ventaActualizada = await Venta.findByPk(req.params.id, {
      include: [
        { model: Cliente },
        { model: Usuario, attributes: ['id', 'nombre', 'email'] }
      ]
    });
    
    res.status(200).json({ 
      message: 'Venta actualizada correctamente',
      venta: ventaActualizada
    });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: error.message });
  }
});

// Generar reporte de ventas en Excel
router.get('/reportes/excel', verificarToken, async (req, res) => {
  try {
    const { tipo, mes, ano } = req.query;
    
    if (!tipo || !ano) {
      return res.status(400).json({ message: 'Tipo de reporte y año son requeridos' });
    }
    
    if (tipo !== 'mensual' && tipo !== 'anual') {
      return res.status(400).json({ message: 'Tipo de reporte debe ser mensual o anual' });
    }
    
    if (tipo === 'mensual' && (!mes || mes < 1 || mes > 12)) {
      return res.status(400).json({ message: 'Mes debe ser un número entre 1 y 12' });
    }
    
    // Configurar fechas para la consulta
    let fechaInicio, fechaFin;
    const anoNum = parseInt(ano);
    
    if (tipo === 'mensual') {
      const mesNum = parseInt(mes);
      fechaInicio = new Date(anoNum, mesNum - 1, 1); // Primer día del mes
      fechaFin = new Date(anoNum, mesNum, 0); // Último día del mes
    } else {
      fechaInicio = new Date(anoNum, 0, 1); // Primer día del año
      fechaFin = new Date(anoNum, 11, 31); // Último día del año
    }
    
    // Configurar la hora para incluir todo el día
    fechaFin.setHours(23, 59, 59, 999);
    
    // Obtener ventas
    const ventas = await Venta.findAll({
      where: {
        fecha_venta: {
          [Op.between]: [fechaInicio, fechaFin]
        }
      },
      include: [
        { model: Cliente },
        { model: Usuario, attributes: ['id', 'nombre', 'email'] },
        { 
          model: DetalleVenta,
          include: [{ model: Producto }]
        }
      ],
      order: [['fecha_venta', 'ASC']]
    });
    
    // Crear libro de Excel
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema de Inventario';
    workbook.lastModifiedBy = 'API';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    // Crear hoja de ventas
    const ventasSheet = workbook.addWorksheet('Ventas');
    
    // Configurar encabezados
    ventasSheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Fecha', key: 'fecha', width: 20 },
      { header: 'Cliente', key: 'cliente', width: 30 },
      { header: 'Vendedor', key: 'vendedor', width: 30 },
      { header: 'Estado', key: 'estado', width: 15 },
      { header: 'Subtotal', key: 'subtotal', width: 15 },
      { header: 'IVA', key: 'iva', width: 15 },
      { header: 'Descuento', key: 'descuento', width: 15 },
      { header: 'Total', key: 'total', width: 15 }
    ];
    
    // Estilo para encabezados
    ventasSheet.getRow(1).font = { bold: true };
    ventasSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    };
    
    // Agregar datos de ventas
    let totalVentas = 0;
    let totalIVA = 0;
    let totalDescuentos = 0;
    
    ventas.forEach(venta => {
      ventasSheet.addRow({
        id: venta.id,
        fecha: venta.fecha_venta.toLocaleDateString('es-ES'),
        cliente: venta.Cliente ? venta.Cliente.nombre : 'Cliente no especificado',
        vendedor: venta.Usuario ? venta.Usuario.nombre : 'Vendedor no especificado',
        estado: venta.estado,
        subtotal: parseFloat(venta.monto_total) + parseFloat(venta.descuento) - parseFloat(venta.iva),
        iva: parseFloat(venta.iva),
        descuento: parseFloat(venta.descuento),
        total: parseFloat(venta.monto_total)
      });
      
      totalVentas += parseFloat(venta.monto_total);
      totalIVA += parseFloat(venta.iva);
      totalDescuentos += parseFloat(venta.descuento);
    });
    
    // Agregar fila de totales
    const totalRow = ventasSheet.addRow({
      id: '',
      fecha: '',
      cliente: '',
      vendedor: '',
      estado: 'TOTALES',
      subtotal: totalVentas + totalDescuentos - totalIVA,
      iva: totalIVA,
      descuento: totalDescuentos,
      total: totalVentas
    });
    
    totalRow.font = { bold: true };
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFF2CC' }
    };
    
    // Crear hoja de detalles
    const detallesSheet = workbook.addWorksheet('Detalles de Ventas');
    
    // Configurar encabezados de detalles
    detallesSheet.columns = [
      { header: 'ID Venta', key: 'venta_id', width: 10 },
      { header: 'Fecha', key: 'fecha', width: 20 },
      { header: 'Cliente', key: 'cliente', width: 30 },
      { header: 'Código Producto', key: 'codigo', width: 15 },
      { header: 'Descripción', key: 'descripcion', width: 40 },
      { header: 'Cantidad', key: 'cantidad', width: 10 },
      { header: 'Precio Unitario', key: 'precio', width: 15 },
      { header: 'Total', key: 'total', width: 15 }
    ];
    
    // Estilo para encabezados de detalles
    detallesSheet.getRow(1).font = { bold: true };
    detallesSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    };
    
    // Agregar datos de detalles
    ventas.forEach(venta => {
      if (venta.DetalleVentas && venta.DetalleVentas.length > 0) {
        venta.DetalleVentas.forEach(detalle => {
          detallesSheet.addRow({
            venta_id: venta.id,
            fecha: venta.fecha_venta.toLocaleDateString('es-ES'),
            cliente: venta.Cliente ? venta.Cliente.nombre : 'Cliente no especificado',
            codigo: detalle.Producto ? detalle.Producto.codigo : 'N/A',
            descripcion: detalle.Producto ? detalle.Producto.descripcion : 'Producto no especificado',
            cantidad: detalle.cantidad,
            precio: parseFloat(detalle.precio_unitario),
            total: parseFloat(detalle.cantidad * detalle.precio_unitario)
          });
        });
      }
    });
    
    // Crear hoja de resumen
    const resumenSheet = workbook.addWorksheet('Resumen');
    
    // Configurar encabezados de resumen
    resumenSheet.columns = [
      { header: 'Concepto', key: 'concepto', width: 30 },
      { header: 'Valor', key: 'valor', width: 20 }
    ];
    
    // Estilo para encabezados de resumen
    resumenSheet.getRow(1).font = { bold: true };
    resumenSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    };
    
    // Agregar datos de resumen
    resumenSheet.addRow({ concepto: 'Período', valor: tipo === 'mensual' ? 
      `${mes}/${ano}` : `Año ${ano}` });
    resumenSheet.addRow({ concepto: 'Total de Ventas', valor: ventas.length });
    resumenSheet.addRow({ concepto: 'Monto Total', valor: totalVentas });
    resumenSheet.addRow({ concepto: 'Total IVA', valor: totalIVA });
    resumenSheet.addRow({ concepto: 'Total Descuentos', valor: totalDescuentos });
    
    // Ventas por estado
    const ventasPorEstado = {};
    ventas.forEach(venta => {
      if (!ventasPorEstado[venta.estado]) {
        ventasPorEstado[venta.estado] = 0;
      }
      ventasPorEstado[venta.estado]++;
    });
    
    resumenSheet.addRow({ concepto: '', valor: '' }); // Fila vacía
    resumenSheet.addRow({ concepto: 'VENTAS POR ESTADO', valor: '' });
    Object.keys(ventasPorEstado).forEach(estado => {
      resumenSheet.addRow({ concepto: estado, valor: ventasPorEstado[estado] });
    });
    
    // Configurar el nombre del archivo
    const nombreArchivo = tipo === 'mensual' ? 
      `reporte_ventas_${mes}_${ano}.xlsx` : 
      `reporte_ventas_anual_${ano}.xlsx`;
    
    // Configurar la respuesta HTTP
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${nombreArchivo}`);
    
    // Escribir el archivo y enviarlo como respuesta
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error al generar reporte Excel:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
