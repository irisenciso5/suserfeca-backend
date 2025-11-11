const express = require('express');
const router = express.Router();
const { Cliente, Venta } = require('../models');
const { verificarToken, esVendedor } = require('../middleware/auth.middleware');
const { Op } = require('sequelize');

// Obtener todos los clientes
router.get('/', verificarToken, async (req, res) => {
  try {
    const { buscar, limite, pagina } = req.query;
    
    // Configurar opciones de búsqueda
    const opciones = {
      where: {}
    };
    
    // Filtrar por término de búsqueda
    if (buscar) {
      opciones.where = {
        [Op.or]: [
          { nombre: { [Op.like]: `%${buscar}%` } },
          { identificacion: { [Op.like]: `%${buscar}%` } },
          { telefono: { [Op.like]: `%${buscar}%` } }
        ]
      };
    }
    
    // Paginación
    if (limite && pagina) {
      opciones.limit = parseInt(limite);
      opciones.offset = (parseInt(pagina) - 1) * parseInt(limite);
    }
    
    // Obtener clientes
    const clientes = await Cliente.findAndCountAll(opciones);
    
    res.status(200).json({
      total: clientes.count,
      pagina: pagina ? parseInt(pagina) : 1,
      limite: limite ? parseInt(limite) : clientes.count,
      clientes: clientes.rows
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtener un cliente por ID
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const cliente = await Cliente.findByPk(req.params.id);
    
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    
    res.status(200).json(cliente);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtener ventas de un cliente
router.get('/:id/ventas', verificarToken, async (req, res) => {
  try {
    const cliente = await Cliente.findByPk(req.params.id);
    
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    
    const ventas = await Venta.findAll({
      where: { cliente_id: req.params.id },
      order: [['fecha_venta', 'DESC']]
    });
    
    res.status(200).json(ventas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Crear un nuevo cliente (vendedor o admin)
router.post('/', [verificarToken, esVendedor], async (req, res) => {
  try {
    const { nombre, identificacion, telefono, direccion } = req.body;
    
    // Validar campos requeridos
    if (!nombre) {
      return res.status(400).json({ message: 'El nombre del cliente es requerido' });
    }
    
    // Verificar si ya existe un cliente con esa identificación
    if (identificacion) {
      const clienteExistente = await Cliente.findOne({ where: { identificacion } });
      if (clienteExistente) {
        return res.status(400).json({ message: 'Ya existe un cliente con esa identificación' });
      }
    }
    
    // Crear cliente
    const nuevoCliente = await Cliente.create({
      nombre,
      identificacion,
      telefono,
      direccion
    });
    
    res.status(201).json(nuevoCliente);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Actualizar un cliente (vendedor o admin)
router.put('/:id', [verificarToken, esVendedor], async (req, res) => {
  try {
    const { nombre, identificacion, telefono, direccion } = req.body;
    
    // Buscar cliente
    const cliente = await Cliente.findByPk(req.params.id);
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    
    // Verificar si ya existe otro cliente con esa identificación
    if (identificacion && identificacion !== cliente.identificacion) {
      const identificacionExistente = await Cliente.findOne({ where: { identificacion } });
      if (identificacionExistente) {
        return res.status(400).json({ message: 'Ya existe otro cliente con esa identificación' });
      }
    }
    
    // Actualizar cliente
    await cliente.update({
      nombre: nombre || cliente.nombre,
      identificacion: identificacion !== undefined ? identificacion : cliente.identificacion,
      telefono: telefono !== undefined ? telefono : cliente.telefono,
      direccion: direccion !== undefined ? direccion : cliente.direccion
    });
    
    res.status(200).json(cliente);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Eliminar un cliente (vendedor o admin)
router.delete('/:id', [verificarToken, esVendedor], async (req, res) => {
  try {
    const cliente = await Cliente.findByPk(req.params.id);
    
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    
    // Verificar si hay ventas asociadas a este cliente
    const ventasAsociadas = await Venta.count({ where: { cliente_id: req.params.id } });
    if (ventasAsociadas > 0) {
      return res.status(400).json({ 
        message: 'No se puede eliminar el cliente porque tiene ventas asociadas',
        ventas: ventasAsociadas
      });
    }
    
    await cliente.destroy();
    
    res.status(200).json({ message: 'Cliente eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
