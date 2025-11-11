const express = require('express');
const router = express.Router();
const { Rol } = require('../models');
const { verificarToken } = require('../middleware/auth.middleware');

// Obtener todos los roles disponibles
router.get('/', verificarToken, async (req, res) => {
  try {
    const roles = await Rol.findAll({
      attributes: ['id', 'nombre']
    });
    
    res.status(200).json(roles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
