const express = require('express');
const router = express.Router();
const { Compra, DetalleCompra, Proveedor, Producto, MovimientoInventario, sequelize } = require('../models');
const { verificarToken, esVendedor } = require('../middleware/auth.middleware');
const { Op } = require('sequelize');
const ExcelJS = require('exceljs');

// Obtener todas las compras
router.get('/', verificarToken, async (req, res) => {
  try {
    const { 
      proveedor_id, 
      estado, 
      fecha_inicio, 
      fecha_fin,
      limite,
      pagina
    } = req.query;
    
    // Configurar opciones de búsqueda
    const opciones = {
      include: [
        { model: Proveedor }
      ],
      where: {},
      order: [['fecha_orden', 'DESC']]
    };
    
    // Filtrar por proveedor
    if (proveedor_id) {
      opciones.where.proveedor_id = proveedor_id;
    }
    
    // Filtrar por estado
    if (estado) {
      opciones.where.estado = estado;
    }
    
    // Filtrar por rango de fechas
    if (fecha_inicio && fecha_fin) {
      opciones.where.fecha_orden = {
        [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)]
      };
    } else if (fecha_inicio) {
      opciones.where.fecha_orden = {
        [Op.gte]: new Date(fecha_inicio)
      };
    } else if (fecha_fin) {
      opciones.where.fecha_orden = {
        [Op.lte]: new Date(fecha_fin)
      };
    }
    
    // Paginación
    if (limite && pagina) {
      opciones.limit = parseInt(limite);
      opciones.offset = (parseInt(pagina) - 1) * parseInt(limite);
    }
    
    // Obtener compras
    const compras = await Compra.findAndCountAll(opciones);
    
    res.status(200).json({
      total: compras.count,
      pagina: pagina ? parseInt(pagina) : 1,
      limite: limite ? parseInt(limite) : compras.count,
      compras: compras.rows
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtener una compra por ID
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const compra = await Compra.findByPk(req.params.id, {
      include: [
        { model: Proveedor },
        { 
          model: DetalleCompra,
          include: [{ model: Producto }]
        }
      ]
    });
    
    if (!compra) {
      return res.status(404).json({ message: 'Compra no encontrada' });
    }
    
    res.status(200).json(compra);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Crear una nueva compra (vendedor o admin)
router.post('/', [verificarToken, esVendedor], async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { 
      proveedor_id, 
      fecha_orden, 
      estado,
      detalles
    } = req.body;
    
    // Validar campos requeridos
    if (!proveedor_id || !fecha_orden || !estado || !detalles || !Array.isArray(detalles) || detalles.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Proveedor, fecha, estado y detalles son requeridos' });
    }
    
    // Verificar que el proveedor existe
    const proveedor = await Proveedor.findByPk(proveedor_id, { transaction });
    if (!proveedor) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Proveedor no encontrado' });
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
      
      montoTotal += detalle.cantidad * detalle.precio_unitario;
    }
    
    // Crear compra
    const nuevaCompra = await Compra.create({
      proveedor_id,
      fecha_orden,
      monto_total: montoTotal,
      estado: estado || 'pendiente' // Por defecto, las compras se crean como pendientes
    }, { transaction });
    
    // Crear detalles de compra
    for (const detalle of detalles) {
      await DetalleCompra.create({
        compra_id: nuevaCompra.id,
        producto_id: detalle.producto_id,
        cantidad: detalle.cantidad,
        precio_unitario: detalle.precio_unitario
      }, { transaction });
      
      // Si la compra está completada, actualizar el stock y registrar movimiento
      if (estado === 'completada') {
        const producto = await Producto.findByPk(detalle.producto_id, { transaction });
        
        // Actualizar precio de compra del producto
        await producto.update({
          precio_compra: detalle.precio_unitario
        }, { transaction });
        
        // Registrar movimiento de inventario
        await MovimientoInventario.create({
          producto_id: detalle.producto_id,
          tipo_movimiento: 'entrada',
          cantidad: detalle.cantidad,
          motivo: `Compra #${nuevaCompra.id}`,
          usuario_id: req.userId,
          fecha: new Date()
        }, { transaction });
        
        // Actualizar stock
        await producto.update({
          stock_actual: producto.stock_actual + detalle.cantidad
        }, { transaction });
      }
    }
    
    // Confirmar transacción
    await transaction.commit();
    
    // Obtener compra creada con sus relaciones
    const compraCreada = await Compra.findByPk(nuevaCompra.id, {
      include: [
        { model: Proveedor },
        { 
          model: DetalleCompra,
          include: [{ model: Producto }]
        }
      ]
    });
    
    res.status(201).json(compraCreada);
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: error.message });
  }
});

// Actualizar estado de una compra (vendedor o admin)
router.put('/:id/estado', [verificarToken, esVendedor], async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { estado } = req.body;
    
    if (!estado) {
      await transaction.rollback();
      return res.status(400).json({ message: 'El estado es requerido' });
    }
    
    // Buscar compra
    const compra = await Compra.findByPk(req.params.id, {
      include: [
        { 
          model: DetalleCompra,
          include: [{ model: Producto }]
        }
      ],
      transaction
    });
    
    if (!compra) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Compra no encontrada' });
    }
    
    const estadoAnterior = compra.estado;
    
    // Actualizar estado
    await compra.update({ estado }, { transaction });
    
    // Si la compra pasa a completada, actualizar inventario
    if (estadoAnterior !== 'completada' && estado === 'completada') {
      for (const detalle of compra.DetalleCompras) {
        const producto = detalle.Producto;
        
        // Actualizar precio de compra del producto
        await producto.update({
          precio_compra: detalle.precio_unitario
        }, { transaction });
        
        // Registrar movimiento de inventario
        await MovimientoInventario.create({
          producto_id: detalle.producto_id,
          tipo_movimiento: 'entrada',
          cantidad: detalle.cantidad,
          motivo: `Compra #${compra.id}`,
          usuario_id: req.userId,
          fecha: new Date()
        }, { transaction });
        
        // Actualizar stock
        await producto.update({
          stock_actual: producto.stock_actual + detalle.cantidad
        }, { transaction });
      }
    }
    // Si la compra pasa de completada a otro estado, revertir inventario
    else if (estadoAnterior === 'completada' && estado !== 'completada') {
      for (const detalle of compra.DetalleCompras) {
        const producto = detalle.Producto;
        
        // Verificar stock suficiente
        if (producto.stock_actual < detalle.cantidad) {
          await transaction.rollback();
          return res.status(400).json({ 
            message: `Stock insuficiente para revertir la compra. Producto: ${producto.descripcion}`,
            stock_actual: producto.stock_actual,
            cantidad_requerida: detalle.cantidad
          });
        }
        
        // Registrar movimiento de inventario
        await MovimientoInventario.create({
          producto_id: detalle.producto_id,
          tipo_movimiento: 'salida',
          cantidad: detalle.cantidad,
          motivo: `Reversión Compra #${compra.id}`,
          usuario_id: req.userId,
          fecha: new Date()
        }, { transaction });
        
        // Actualizar stock
        await producto.update({
          stock_actual: producto.stock_actual - detalle.cantidad
        }, { transaction });
      }
    }
    
    // Confirmar transacción
    await transaction.commit();
    
    // Obtener compra actualizada
    const compraActualizada = await Compra.findByPk(req.params.id, {
      include: [
        { model: Proveedor },
        { 
          model: DetalleCompra,
          include: [{ model: Producto }]
        }
      ]
    });
    
    res.status(200).json(compraActualizada);
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: error.message });
  }
});

// Completar una compra (cambiar estado de pendiente a completada)
router.post('/:id/completar', [verificarToken, esVendedor], async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const compra = await Compra.findByPk(req.params.id, {
      include: [
        { 
          model: DetalleCompra,
          include: [{ model: Producto }]
        }
      ],
      transaction
    });
    
    if (!compra) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Compra no encontrada' });
    }
    
    // Verificar que la compra esté en estado pendiente
    if (compra.estado !== 'pendiente') {
      await transaction.rollback();
      return res.status(400).json({ message: `La compra no está en estado pendiente, estado actual: ${compra.estado}` });
    }
    
    // Actualizar inventario para cada producto en la compra
    for (const detalle of compra.DetalleCompras) {
      const producto = detalle.Producto;
      
      // Actualizar precio de compra del producto
      await producto.update({
        precio_compra: detalle.precio_unitario
      }, { transaction });
      
      // Registrar movimiento de inventario
      await MovimientoInventario.create({
        producto_id: detalle.producto_id,
        tipo_movimiento: 'entrada',
        cantidad: detalle.cantidad,
        motivo: `Compra #${compra.id}`,
        usuario_id: req.userId,
        fecha: new Date()
      }, { transaction });
      
      // Actualizar stock
      await producto.update({
        stock_actual: producto.stock_actual + detalle.cantidad
      }, { transaction });
    }
    
    // Actualizar el estado de la compra a 'completada'
    await compra.update({
      estado: 'completada'
    }, { transaction });
    
    // Confirmar transacción
    await transaction.commit();
    
    // Obtener compra actualizada
    const compraActualizada = await Compra.findByPk(compra.id, {
      include: [
        { model: Proveedor },
        { 
          model: DetalleCompra,
          include: [{ model: Producto }]
        }
      ]
    });
    
    res.status(200).json({ 
      message: 'Compra completada correctamente',
      compra: compraActualizada
    });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: error.message });
  }
});

// Eliminar una compra (vendedor o admin)
router.delete('/:id', [verificarToken, esVendedor], async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const compra = await Compra.findByPk(req.params.id, {
      include: [{ model: DetalleCompra }],
      transaction
    });
    
    if (!compra) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Compra no encontrada' });
    }
    
    // Solo se pueden eliminar compras en estado pendiente o cancelada
    if (compra.estado === 'completada') {
      await transaction.rollback();
      return res.status(400).json({ message: 'No se puede eliminar una compra completada' });
    }
    
    // Eliminar detalles de compra
    await DetalleCompra.destroy({
      where: { compra_id: compra.id },
      transaction
    });
    
    // Eliminar compra
    await compra.destroy({ transaction });
    
    // Confirmar transacción
    await transaction.commit();
    
    res.status(200).json({ message: 'Compra eliminada correctamente' });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: error.message });
  }
});

// Generar reporte de compras en Excel
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
    
    // Obtener compras
    const compras = await Compra.findAll({
      where: {
        fecha_orden: {
          [Op.between]: [fechaInicio, fechaFin]
        }
      },
      include: [
        { model: Proveedor },
        { 
          model: DetalleCompra,
          include: [{ model: Producto }]
        }
      ],
      order: [['fecha_orden', 'ASC']]
    });
    
    // Crear libro de Excel
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema de Inventario';
    workbook.lastModifiedBy = 'API';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    // Crear hoja de compras
    const comprasSheet = workbook.addWorksheet('Compras');
    
    // Configurar encabezados
    comprasSheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Fecha', key: 'fecha', width: 20 },
      { header: 'Proveedor', key: 'proveedor', width: 30 },
      { header: 'Estado', key: 'estado', width: 15 },
      { header: 'Total', key: 'total', width: 15 }
    ];
    
    // Estilo para encabezados
    comprasSheet.getRow(1).font = { bold: true };
    comprasSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    };
    
    // Agregar datos de compras
    let totalCompras = 0;
    
    compras.forEach(compra => {
      // Asegurarse de que fecha_orden sea un objeto Date válido
      const fechaOrden = compra.fecha_orden instanceof Date ? 
        compra.fecha_orden : new Date(compra.fecha_orden);
      
      comprasSheet.addRow({
        id: compra.id,
        fecha: fechaOrden.toLocaleDateString('es-ES'),
        proveedor: compra.Proveedor ? compra.Proveedor.nombre_empresa : 'Proveedor no especificado',
        estado: compra.estado,
        total: parseFloat(compra.monto_total)
      });
      
      totalCompras += parseFloat(compra.monto_total);
    });
    
    // Agregar fila de totales
    const totalRow = comprasSheet.addRow({
      id: '',
      fecha: '',
      proveedor: 'TOTALES',
      estado: '',
      total: totalCompras
    });
    
    totalRow.font = { bold: true };
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFF2CC' }
    };
    
    // Crear hoja de detalles
    const detallesSheet = workbook.addWorksheet('Detalles de Compras');
    
    // Configurar encabezados de detalles
    detallesSheet.columns = [
      { header: 'ID Compra', key: 'compra_id', width: 10 },
      { header: 'Fecha', key: 'fecha', width: 20 },
      { header: 'Proveedor', key: 'proveedor', width: 30 },
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
    compras.forEach(compra => {
      if (compra.DetalleCompras && compra.DetalleCompras.length > 0) {
        compra.DetalleCompras.forEach(detalle => {
          // Asegurarse de que fecha_orden sea un objeto Date válido
          const fechaOrden = compra.fecha_orden instanceof Date ? 
            compra.fecha_orden : new Date(compra.fecha_orden);
            
          detallesSheet.addRow({
            compra_id: compra.id,
            fecha: fechaOrden.toLocaleDateString('es-ES'),
            proveedor: compra.Proveedor ? compra.Proveedor.nombre_empresa : 'Proveedor no especificado',
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
    resumenSheet.addRow({ concepto: 'Total de Compras', valor: compras.length });
    resumenSheet.addRow({ concepto: 'Monto Total', valor: totalCompras });
    
    // Compras por estado
    const comprasPorEstado = {};
    compras.forEach(compra => {
      if (!comprasPorEstado[compra.estado]) {
        comprasPorEstado[compra.estado] = 0;
      }
      comprasPorEstado[compra.estado]++;
    });
    
    resumenSheet.addRow({ concepto: '', valor: '' }); // Fila vacía
    resumenSheet.addRow({ concepto: 'COMPRAS POR ESTADO', valor: '' });
    Object.keys(comprasPorEstado).forEach(estado => {
      resumenSheet.addRow({ concepto: estado, valor: comprasPorEstado[estado] });
    });
    
    // Compras por proveedor
    const comprasPorProveedor = {};
    compras.forEach(compra => {
      const nombreProveedor = compra.Proveedor ? compra.Proveedor.nombre_empresa : 'Proveedor no especificado';
      if (!comprasPorProveedor[nombreProveedor]) {
        comprasPorProveedor[nombreProveedor] = 0;
      }
      comprasPorProveedor[nombreProveedor] += parseFloat(compra.monto_total);
    });
    
    resumenSheet.addRow({ concepto: '', valor: '' }); // Fila vacía
    resumenSheet.addRow({ concepto: 'COMPRAS POR PROVEEDOR', valor: '' });
    Object.keys(comprasPorProveedor).forEach(proveedor => {
      resumenSheet.addRow({ concepto: proveedor, valor: comprasPorProveedor[proveedor] });
    });
    
    // Configurar el nombre del archivo
    const nombreArchivo = tipo === 'mensual' ? 
      `reporte_compras_${mes}_${ano}.xlsx` : 
      `reporte_compras_anual_${ano}.xlsx`;
    
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
