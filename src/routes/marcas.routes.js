const express = require('express');
const router = express.Router();
const { Marca } = require('../models');
const { verificarToken, esVendedor } = require('../middleware/auth.middleware');

// Obtener todas las marcas
router.get('/', verificarToken, async (req, res) => {
  try {
    const marcas = await Marca.findAll();
    res.status(200).json(marcas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtener una marca por ID
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const marca = await Marca.findByPk(req.params.id);
    
    if (!marca) {
      return res.status(404).json({ message: 'Marca no encontrada' });
    }
    
    res.status(200).json(marca);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Crear una nueva marca (vendedor o admin)
router.post('/', [verificarToken, esVendedor], async (req, res) => {
  try {
    const { nombre } = req.body;
    
    if (!nombre) {
      return res.status(400).json({ message: 'El nombre de la marca es requerido' });
    }
    
    // Verificar si ya existe una marca con ese nombre
    const marcaExistente = await Marca.findOne({ where: { nombre } });
    if (marcaExistente) {
      return res.status(400).json({ message: 'Ya existe una marca con ese nombre' });
    }
    
    // Crear marca
    const nuevaMarca = await Marca.create({ nombre });
    
    res.status(201).json(nuevaMarca);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Actualizar una marca (vendedor o admin)
router.put('/:id', [verificarToken, esVendedor], async (req, res) => {
  try {
    const { nombre } = req.body;
    
    if (!nombre) {
      return res.status(400).json({ message: 'El nombre de la marca es requerido' });
    }
    
    // Buscar marca
    const marca = await Marca.findByPk(req.params.id);
    if (!marca) {
      return res.status(404).json({ message: 'Marca no encontrada' });
    }
    
    // Verificar si ya existe otra marca con ese nombre
    if (nombre !== marca.nombre) {
      const marcaExistente = await Marca.findOne({ where: { nombre } });
      if (marcaExistente) {
        return res.status(400).json({ message: 'Ya existe otra marca con ese nombre' });
      }
    }
    
    // Actualizar marca
    await marca.update({ nombre });
    
    res.status(200).json(marca);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Eliminar una marca (vendedor o admin)
router.delete('/:id', [verificarToken, esVendedor], async (req, res) => {
  try {
    const marca = await Marca.findByPk(req.params.id);
    
    if (!marca) {
      return res.status(404).json({ message: 'Marca no encontrada' });
    }
    
    // Verificar si hay productos asociados a esta marca
    const productosAsociados = await marca.getProductos();
    if (productosAsociados.length > 0) {
      return res.status(400).json({ 
        message: 'No se puede eliminar la marca porque tiene productos asociados',
        productos: productosAsociados.length
      });
    }
    
    await marca.destroy();
    
    res.status(200).json({ message: 'Marca eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
