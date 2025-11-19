const express = require('express');
const router = express.Router();
const { MovimientoInventario, Producto, Usuario, Categoria, Marca, sequelize } = require('../models');
const { verificarToken, esVendedor } = require('../middleware/auth.middleware');
const { Op } = require('sequelize');
const ExcelJS = require('exceljs');

// Obtener todos los movimientos de inventario
router.get('/', verificarToken, async (req, res) => {
  try {
    const { 
      producto_id, 
      tipo_movimiento, 
      fecha_inicio, 
      fecha_fin, 
      usuario_id,
      limite,
      pagina
    } = req.query;
    
    // Configurar opciones de búsqueda
    const opciones = {
      include: [
        { model: Producto },
        { model: Usuario, attributes: ['id', 'nombre', 'email'] }
      ],
      where: {},
      order: [['fecha', 'DESC']]
    };
    
    // Filtrar por producto
    if (producto_id) {
      opciones.where.producto_id = producto_id;
    }
    
    // Filtrar por tipo de movimiento
    if (tipo_movimiento) {
      opciones.where.tipo_movimiento = tipo_movimiento;
    }
    
    // Filtrar por rango de fechas
    if (fecha_inicio && fecha_fin) {
      opciones.where.fecha = {
        [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)]
      };
    } else if (fecha_inicio) {
      opciones.where.fecha = {
        [Op.gte]: new Date(fecha_inicio)
      };
    } else if (fecha_fin) {
      opciones.where.fecha = {
        [Op.lte]: new Date(fecha_fin)
      };
    }
    
    // Filtrar por usuario
    if (usuario_id) {
      opciones.where.usuario_id = usuario_id;
    }
    
    // Paginación
    if (limite && pagina) {
      opciones.limit = parseInt(limite);
      opciones.offset = (parseInt(pagina) - 1) * parseInt(limite);
    }
    
    // Obtener movimientos
    const movimientos = await MovimientoInventario.findAndCountAll(opciones);
    
    res.status(200).json({
      total: movimientos.count,
      pagina: pagina ? parseInt(pagina) : 1,
      limite: limite ? parseInt(limite) : movimientos.count,
      movimientos: movimientos.rows
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtener un movimiento de inventario por ID
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const movimiento = await MovimientoInventario.findByPk(req.params.id, {
      include: [
        { model: Producto },
        { model: Usuario, attributes: ['id', 'nombre', 'email'] }
      ]
    });
    
    if (!movimiento) {
      return res.status(404).json({ message: 'Movimiento de inventario no encontrado' });
    }
    
    res.status(200).json(movimiento);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Crear un nuevo movimiento de inventario (vendedor o admin)
router.post('/', [verificarToken, esVendedor], async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { producto_id, tipo_movimiento, cantidad, motivo } = req.body;
    
    // Validar campos requeridos
    if (!producto_id || !tipo_movimiento || !cantidad) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Producto, tipo de movimiento y cantidad son requeridos' });
    }
    
    // Verificar que el producto existe
    const producto = await Producto.findByPk(producto_id, { transaction });
    if (!producto) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    
    // Verificar que la cantidad sea válida
    if (cantidad <= 0) {
      await transaction.rollback();
      return res.status(400).json({ message: 'La cantidad debe ser mayor a cero' });
    }
    
    // Verificar stock suficiente para salidas
    if (tipo_movimiento === 'salida' && producto.stock_actual < cantidad) {
      await transaction.rollback();
      return res.status(400).json({ 
        message: 'Stock insuficiente para realizar la salida',
        stock_actual: producto.stock_actual,
        cantidad_solicitada: cantidad
      });
    }
    
    // Crear movimiento de inventario
    const nuevoMovimiento = await MovimientoInventario.create({
      producto_id,
      tipo_movimiento,
      cantidad,
      motivo,
      usuario_id: req.userId,
      fecha: new Date()
    }, { transaction });
    
    // Actualizar stock del producto
    let nuevoStock = producto.stock_actual;
    
    if (tipo_movimiento === 'entrada') {
      nuevoStock += cantidad;
    } else if (tipo_movimiento === 'salida') {
      nuevoStock -= cantidad;
    } else if (tipo_movimiento === 'ajuste') {
      // Para ajustes, la cantidad representa el nuevo valor absoluto del stock
      nuevoStock = cantidad;
    }
    
    await producto.update({ stock_actual: nuevoStock }, { transaction });
    
    // Confirmar transacción
    await transaction.commit();
    
    // Obtener movimiento creado con sus relaciones
    const movimientoCreado = await MovimientoInventario.findByPk(nuevoMovimiento.id, {
      include: [
        { model: Producto },
        { model: Usuario, attributes: ['id', 'nombre', 'email'] }
      ]
    });
    
    res.status(201).json(movimientoCreado);
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: error.message });
  }
});

// Obtener productos con stock bajo
router.get('/alertas/stock-bajo', verificarToken, async (req, res) => {
  try {
    const productosStockBajo = await Producto.findAll({
      where: sequelize.literal('stock_actual <= stock_minimo'),
      include: [
        { model: Categoria },
        { model: Marca }
      ]
    });
    
    res.status(200).json(productosStockBajo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Generar reporte de movimientos de inventario en Excel
router.get('/movimientos/reportes/excel', verificarToken, async (req, res) => {
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

    // Configurar rango de fechas
    let fechaInicio, fechaFin;
    const anoNum = parseInt(ano, 10);

    if (tipo === 'mensual') {
      const mesNum = parseInt(mes, 10);
      fechaInicio = new Date(anoNum, mesNum - 1, 1);
      fechaFin = new Date(anoNum, mesNum, 0);
    } else {
      fechaInicio = new Date(anoNum, 0, 1);
      fechaFin = new Date(anoNum, 11, 31);
    }

    fechaFin.setHours(23, 59, 59, 999);

    // Obtener movimientos
    const movimientos = await MovimientoInventario.findAll({
      where: {
        fecha: {
          [Op.between]: [fechaInicio, fechaFin]
        }
      },
      include: [
        { model: Producto },
        { model: Usuario, attributes: ['id', 'nombre', 'email'] }
      ],
      order: [['fecha', 'ASC']]
    });

    // Crear libro de Excel
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema de Inventario';
    workbook.lastModifiedBy = 'API';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Hoja principal: Movimientos
    const movimientosSheet = workbook.addWorksheet('Movimientos');

    movimientosSheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Fecha', key: 'fecha', width: 20 },
      { header: 'Tipo', key: 'tipo', width: 12 },
      { header: 'Producto', key: 'producto', width: 35 },
      { header: 'Cantidad', key: 'cantidad', width: 12 },
      { header: 'Usuario', key: 'usuario', width: 25 },
      { header: 'Motivo', key: 'motivo', width: 45 }
    ];

    movimientosSheet.getRow(1).font = { bold: true };
    movimientosSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    };

    let totalEntradas = 0;
    let totalSalidas = 0;
    let totalAjustes = 0;

    // Totales por producto
    const totalesPorProducto = {};

    movimientos.forEach(mov => {
      const fechaMov = mov.fecha instanceof Date ? mov.fecha : new Date(mov.fecha);

      movimientosSheet.addRow({
        id: mov.id,
        fecha: fechaMov.toLocaleDateString('es-ES'),
        tipo: mov.tipo_movimiento,
        producto: mov.Producto ? `${mov.Producto.codigo || ''} ${mov.Producto.descripcion || ''}`.trim() : 'Producto no especificado',
        cantidad: mov.cantidad,
        usuario: mov.Usuario ? mov.Usuario.nombre : 'Usuario no especificado',
        motivo: mov.motivo || ''
      });

      // Acumular totales por tipo
      if (mov.tipo_movimiento === 'entrada') {
        totalEntradas += mov.cantidad;
      } else if (mov.tipo_movimiento === 'salida') {
        totalSalidas += mov.cantidad;
      } else if (mov.tipo_movimiento === 'ajuste') {
        totalAjustes += mov.cantidad;
      }

      // Totales por producto (entradas y salidas netas)
      if (mov.Producto) {
        const clave = mov.Producto.codigo || `ID-${mov.Producto.id}`;
        if (!totalesPorProducto[clave]) {
          totalesPorProducto[clave] = {
            descripcion: mov.Producto.descripcion || '',
            entradas: 0,
            salidas: 0,
            ajustes: 0
          };
        }

        if (mov.tipo_movimiento === 'entrada') {
          totalesPorProducto[clave].entradas += mov.cantidad;
        } else if (mov.tipo_movimiento === 'salida') {
          totalesPorProducto[clave].salidas += mov.cantidad;
        } else if (mov.tipo_movimiento === 'ajuste') {
          totalesPorProducto[clave].ajustes += mov.cantidad;
        }
      }
    });

    // Hoja de resumen
    const resumenSheet = workbook.addWorksheet('Resumen');

    resumenSheet.columns = [
      { header: 'Concepto', key: 'concepto', width: 35 },
      { header: 'Valor', key: 'valor', width: 20 }
    ];

    resumenSheet.getRow(1).font = { bold: true };
    resumenSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    };

    resumenSheet.addRow({ concepto: 'Período', valor: tipo === 'mensual' ? `${mes}/${ano}` : `Año ${ano}` });
    resumenSheet.addRow({ concepto: 'Total de movimientos', valor: movimientos.length });
    resumenSheet.addRow({ concepto: 'Total entradas', valor: totalEntradas });
    resumenSheet.addRow({ concepto: 'Total salidas', valor: totalSalidas });
    resumenSheet.addRow({ concepto: 'Total ajustes', valor: totalAjustes });

    // Totales por producto
    resumenSheet.addRow({ concepto: '', valor: '' });
    resumenSheet.addRow({ concepto: 'MOVIMIENTOS POR PRODUCTO', valor: '' });

    resumenSheet.addRow({
      concepto: 'Producto (código - descripción)',
      valor: 'Entradas / Salidas / Ajustes'
    });

    Object.keys(totalesPorProducto).forEach(cod => {
      const info = totalesPorProducto[cod];
      resumenSheet.addRow({
        concepto: `${cod} - ${info.descripcion}`.trim(),
        valor: `${info.entradas} / ${info.salidas} / ${info.ajustes}`
      });
    });

    // Configurar nombre de archivo
    const nombreArchivo = tipo === 'mensual'
      ? `reporte_movimientos_inventario_${mes}_${ano}.xlsx`
      : `reporte_movimientos_inventario_anual_${ano}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${nombreArchivo}`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error al generar reporte Excel de movimientos:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
