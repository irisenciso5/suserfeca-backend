const jwt = require('jsonwebtoken');
const { Usuario, Rol } = require('../models');

// Middleware para verificar token JWT
const verificarToken = (req, res, next) => {
  const token = req.headers['x-access-token'] || req.headers['authorization'];
  
  if (!token) {
    return res.status(403).json({ message: 'No se proporcionó token de autenticación' });
  }

  try {
    // Verificar token
    const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

// Middleware para verificar si el usuario es administrador
const esAdmin = async (req, res, next) => {
  try {
    const usuario = await Usuario.findByPk(req.userId, {
      include: [{ model: Rol }]
    });

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (usuario.Rol.nombre === 'administrador') {
      next();
      return;
    }

    return res.status(403).json({ message: 'Requiere rol de administrador' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Middleware para verificar si el usuario es vendedor o administrador
const esVendedor = async (req, res, next) => {
  try {
    const usuario = await Usuario.findByPk(req.userId, {
      include: [{ model: Rol }]
    });

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (usuario.Rol.nombre === 'administrador' || usuario.Rol.nombre === 'vendedor') {
      next();
      return;
    }

    return res.status(403).json({ message: 'Requiere rol de vendedor o administrador' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  verificarToken,
  esAdmin,
  esVendedor
};
