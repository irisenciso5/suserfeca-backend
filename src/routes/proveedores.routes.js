const express = require('express');
const router = express.Router();
const { Proveedor, Producto } = require('../models');
const { verificarToken, esVendedor } = require('../middleware/auth.middleware');

// Obtener todos los proveedores
router.get('/', verificarToken, async (req, res) => {
  try {
    const proveedores = await Proveedor.findAll();
    res.status(200).json(proveedores);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtener un proveedor por ID
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const proveedor = await Proveedor.findByPk(req.params.id);
    
    if (!proveedor) {
      return res.status(404).json({ message: 'Proveedor no encontrado' });
    }
    
    res.status(200).json(proveedor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtener productos de un proveedor
router.get('/:id/productos', verificarToken, async (req, res) => {
  try {
    const proveedor = await Proveedor.findByPk(req.params.id);
    
    if (!proveedor) {
      return res.status(404).json({ message: 'Proveedor no encontrado' });
    }
    
    const productos = await proveedor.getProductos();
    
    res.status(200).json(productos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Crear un nuevo proveedor (vendedor o admin)
router.post('/', [verificarToken, esVendedor], async (req, res) => {
  try {
    const { 
      nombre_empresa, 
      pais, 
      direccion, 
      contacto_nombre, 
      contacto_telefono, 
      contacto_email 
    } = req.body;
    
    if (!nombre_empresa) {
      return res.status(400).json({ message: 'El nombre de la empresa es requerido' });
    }
    
    // Crear proveedor
    const nuevoProveedor = await Proveedor.create({
      nombre_empresa,
      pais,
      direccion,
      contacto_nombre,
      contacto_telefono,
      contacto_email
    });
    
    res.status(201).json(nuevoProveedor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Actualizar un proveedor (vendedor o admin)
router.put('/:id', [verificarToken, esVendedor], async (req, res) => {
  try {
    const { 
      nombre_empresa, 
      pais, 
      direccion, 
      contacto_nombre, 
      contacto_telefono, 
      contacto_email 
    } = req.body;
    
    // Buscar proveedor
    const proveedor = await Proveedor.findByPk(req.params.id);
    if (!proveedor) {
      return res.status(404).json({ message: 'Proveedor no encontrado' });
    }
    
    // Actualizar proveedor
    await proveedor.update({
      nombre_empresa: nombre_empresa || proveedor.nombre_empresa,
      pais: pais !== undefined ? pais : proveedor.pais,
      direccion: direccion !== undefined ? direccion : proveedor.direccion,
      contacto_nombre: contacto_nombre !== undefined ? contacto_nombre : proveedor.contacto_nombre,
      contacto_telefono: contacto_telefono !== undefined ? contacto_telefono : proveedor.contacto_telefono,
      contacto_email: contacto_email !== undefined ? contacto_email : proveedor.contacto_email
    });
    
    res.status(200).json(proveedor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Asociar productos a un proveedor (vendedor o admin)
router.post('/:id/productos', [verificarToken, esVendedor], async (req, res) => {
  try {
    const { producto_ids } = req.body;
    
    if (!producto_ids || !Array.isArray(producto_ids) || producto_ids.length === 0) {
      return res.status(400).json({ message: 'Se requiere un array de IDs de productos' });
    }
    
    // Buscar proveedor
    const proveedor = await Proveedor.findByPk(req.params.id);
    if (!proveedor) {
      return res.status(404).json({ message: 'Proveedor no encontrado' });
    }
    
    // Verificar que todos los productos existan
    const productos = await Producto.findAll({
      where: {
        id: producto_ids
      }
    });
    
    if (productos.length !== producto_ids.length) {
      return res.status(400).json({ message: 'Uno o más productos no existen' });
    }
    
    // Asociar productos al proveedor
    await proveedor.addProductos(productos);
    
    // Obtener productos actualizados del proveedor
    const productosActualizados = await proveedor.getProductos();
    
    res.status(200).json(productosActualizados);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Eliminar un proveedor (vendedor o admin)
router.delete('/:id', [verificarToken, esVendedor], async (req, res) => {
  try {
    const proveedor = await Proveedor.findByPk(req.params.id);
    
    if (!proveedor) {
      return res.status(404).json({ message: 'Proveedor no encontrado' });
    }
    
    // Verificar si hay compras asociadas a este proveedor
    const comprasAsociadas = await proveedor.getCompras();
    if (comprasAsociadas.length > 0) {
      return res.status(400).json({ 
        message: 'No se puede eliminar el proveedor porque tiene compras asociadas',
        compras: comprasAsociadas.length
      });
    }
    
    // Desasociar productos antes de eliminar
    await proveedor.setProductos([]);
    
    await proveedor.destroy();
    
    res.status(200).json({ message: 'Proveedor eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
