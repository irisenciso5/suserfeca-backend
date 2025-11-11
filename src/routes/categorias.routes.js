const express = require('express');
const router = express.Router();
const { Categoria } = require('../models');
const { verificarToken, esVendedor } = require('../middleware/auth.middleware');

// Obtener todas las categorías
router.get('/', verificarToken, async (req, res) => {
  try {
    const categorias = await Categoria.findAll();
    res.status(200).json(categorias);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtener una categoría por ID
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const categoria = await Categoria.findByPk(req.params.id);
    
    if (!categoria) {
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }
    
    res.status(200).json(categoria);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Crear una nueva categoría (vendedor o admin)
router.post('/', [verificarToken, esVendedor], async (req, res) => {
  try {
    const { nombre } = req.body;
    
    if (!nombre) {
      return res.status(400).json({ message: 'El nombre de la categoría es requerido' });
    }
    
    // Verificar si ya existe una categoría con ese nombre
    const categoriaExistente = await Categoria.findOne({ where: { nombre } });
    if (categoriaExistente) {
      return res.status(400).json({ message: 'Ya existe una categoría con ese nombre' });
    }
    
    // Crear categoría
    const nuevaCategoria = await Categoria.create({ nombre });
    
    res.status(201).json(nuevaCategoria);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Actualizar una categoría (vendedor o admin)
router.put('/:id', [verificarToken, esVendedor], async (req, res) => {
  try {
    const { nombre } = req.body;
    
    if (!nombre) {
      return res.status(400).json({ message: 'El nombre de la categoría es requerido' });
    }
    
    // Buscar categoría
    const categoria = await Categoria.findByPk(req.params.id);
    if (!categoria) {
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }
    
    // Verificar si ya existe otra categoría con ese nombre
    if (nombre !== categoria.nombre) {
      const categoriaExistente = await Categoria.findOne({ where: { nombre } });
      if (categoriaExistente) {
        return res.status(400).json({ message: 'Ya existe otra categoría con ese nombre' });
      }
    }
    
    // Actualizar categoría
    await categoria.update({ nombre });
    
    res.status(200).json(categoria);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Eliminar una categoría (vendedor o admin)
router.delete('/:id', [verificarToken, esVendedor], async (req, res) => {
  try {
    const categoria = await Categoria.findByPk(req.params.id);
    
    if (!categoria) {
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }
    
    // Verificar si hay productos asociados a esta categoría
    const productosAsociados = await categoria.getProductos();
    if (productosAsociados.length > 0) {
      return res.status(400).json({ 
        message: 'No se puede eliminar la categoría porque tiene productos asociados',
        productos: productosAsociados.length
      });
    }
    
    await categoria.destroy();
    
    res.status(200).json({ message: 'Categoría eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
