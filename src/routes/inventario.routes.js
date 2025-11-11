const express = require('express');
const router = express.Router();
const { MovimientoInventario, Producto, Usuario, Categoria, Marca, sequelize } = require('../models');
const { verificarToken, esVendedor } = require('../middleware/auth.middleware');
const { Op } = require('sequelize');

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

module.exports = router;
