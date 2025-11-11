const express = require('express');
const router = express.Router();
const { ConfiguracionEmpresa } = require('../models');
const { verificarToken, esAdmin } = require('../middleware/auth.middleware');

// Obtener configuración de la empresa
router.get('/', verificarToken, async (req, res) => {
  try {
    // Buscar configuración (siempre ID=1)
    let configuracion = await ConfiguracionEmpresa.findByPk(1);
    
    // Si no existe, crear configuración por defecto
    if (!configuracion) {
      configuracion = await ConfiguracionEmpresa.create({
        id: 1,
        nombre_empresa: 'Mi Empresa',
        impuesto_porcentaje: 16.00,
        alerta_stock_minimo: true
      });
    }
    
    res.status(200).json(configuracion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Actualizar configuración de la empresa (solo admin)
router.put('/', [verificarToken, esAdmin], async (req, res) => {
  try {
    const { 
      nombre_empresa, 
      logo_url, 
      rif, 
      contacto_info, 
      impuesto_porcentaje, 
      alerta_stock_minimo 
    } = req.body;
    
    // Buscar configuración (siempre ID=1)
    let configuracion = await ConfiguracionEmpresa.findByPk(1);
    
    // Si no existe, crear configuración
    if (!configuracion) {
      configuracion = await ConfiguracionEmpresa.create({
        id: 1,
        nombre_empresa: nombre_empresa || 'Mi Empresa',
        logo_url,
        rif,
        contacto_info,
        impuesto_porcentaje: impuesto_porcentaje !== undefined ? impuesto_porcentaje : 16.00,
        alerta_stock_minimo: alerta_stock_minimo !== undefined ? alerta_stock_minimo : true
      });
    } else {
      // Actualizar configuración existente
      await configuracion.update({
        nombre_empresa: nombre_empresa !== undefined ? nombre_empresa : configuracion.nombre_empresa,
        logo_url: logo_url !== undefined ? logo_url : configuracion.logo_url,
        rif: rif !== undefined ? rif : configuracion.rif,
        contacto_info: contacto_info !== undefined ? contacto_info : configuracion.contacto_info,
        impuesto_porcentaje: impuesto_porcentaje !== undefined ? impuesto_porcentaje : configuracion.impuesto_porcentaje,
        alerta_stock_minimo: alerta_stock_minimo !== undefined ? alerta_stock_minimo : configuracion.alerta_stock_minimo
      });
    }
    
    res.status(200).json(configuracion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
