const express = require('express');
const router = express.Router();
const { Usuario, Rol } = require('../models');
const jwt = require('jsonwebtoken');
const { verificarToken } = require('../middleware/auth.middleware');

// Ruta para iniciar sesión
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar datos de entrada
    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña son requeridos' });
    }

    // Buscar usuario por email
    const usuario = await Usuario.findOne({ 
      where: { email },
      include: [{ model: Rol }]
    });

    // Verificar si el usuario existe
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar si el usuario está activo
    if (!usuario.activo) {
      return res.status(403).json({ message: 'Usuario desactivado. Contacte al administrador.' });
    }

    // Verificar contraseña
    const passwordValida = await usuario.validarPassword(password);
    if (!passwordValida) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    // Generar token JWT
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.Rol.nombre },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Responder con datos del usuario y token
    res.status(200).json({
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.Rol.nombre,
      token
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Ruta para verificar token y obtener datos del usuario actual
router.get('/perfil', verificarToken, async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.userId, {
      attributes: { exclude: ['password'] },
      include: [{ model: Rol }]
    });

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.status(200).json({
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.Rol.nombre,
      fecha_creacion: usuario.fecha_creacion,
      activo: usuario.activo
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Ruta para cambiar contraseña
router.post('/cambiar-password', verificarToken, async (req, res) => {
  try {
    const { passwordActual, passwordNueva } = req.body;
    
    // Validar datos de entrada
    if (!passwordActual || !passwordNueva) {
      return res.status(400).json({ message: 'Contraseña actual y nueva son requeridas' });
    }

    // Buscar usuario
    const usuario = await Usuario.findByPk(req.userId);
    
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar contraseña actual
    const passwordValida = await usuario.validarPassword(passwordActual);
    if (!passwordValida) {
      return res.status(401).json({ message: 'Contraseña actual incorrecta' });
    }

    // Actualizar contraseña
    usuario.password = passwordNueva;
    await usuario.save();

    res.status(200).json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
