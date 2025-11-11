const express = require('express');
const router = express.Router();
const { Usuario, Rol } = require('../models');
const { verificarToken, esAdmin } = require('../middleware/auth.middleware');

// Obtener todos los usuarios (solo administradores)
router.get('/', [verificarToken, esAdmin], async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      attributes: { exclude: ['password'] },
      include: [{ model: Rol }]
    });
    
    res.status(200).json(usuarios);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtener un usuario por ID (solo administradores)
router.get('/:id', [verificarToken, esAdmin], async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [{ model: Rol }]
    });
    
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    res.status(200).json(usuario);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Crear un nuevo usuario (solo administradores)
router.post('/', [verificarToken, esAdmin], async (req, res) => {
  try {
    const { nombre, email, password, rol_id } = req.body;
    
    // Validar datos de entrada
    if (!nombre || !email || !password || !rol_id) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }
    
    // Verificar si el email ya existe
    const usuarioExistente = await Usuario.findOne({ where: { email } });
    if (usuarioExistente) {
      return res.status(400).json({ message: 'El email ya está registrado' });
    }
    
    // Verificar si el rol existe
    const rolExistente = await Rol.findByPk(rol_id);
    if (!rolExistente) {
      return res.status(404).json({ message: 'El rol especificado no existe' });
    }
    
    // Crear usuario
    const nuevoUsuario = await Usuario.create({
      nombre,
      email,
      password,
      rol_id
    });
    
    // Responder sin incluir la contraseña
    res.status(201).json({
      id: nuevoUsuario.id,
      nombre: nuevoUsuario.nombre,
      email: nuevoUsuario.email,
      rol_id: nuevoUsuario.rol_id,
      fecha_creacion: nuevoUsuario.fecha_creacion,
      activo: nuevoUsuario.activo
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Actualizar un usuario (solo administradores)
router.put('/:id', [verificarToken, esAdmin], async (req, res) => {
  try {
    const { nombre, email, rol_id, activo } = req.body;
    
    // Buscar usuario
    const usuario = await Usuario.findByPk(req.params.id);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // Verificar si el email ya existe (si se está cambiando)
    if (email && email !== usuario.email) {
      const emailExistente = await Usuario.findOne({ where: { email } });
      if (emailExistente) {
        return res.status(400).json({ message: 'El email ya está registrado por otro usuario' });
      }
    }
    
    // Verificar si el rol existe (si se está cambiando)
    if (rol_id) {
      const rolExistente = await Rol.findByPk(rol_id);
      if (!rolExistente) {
        return res.status(404).json({ message: 'El rol especificado no existe' });
      }
    }
    
    // Actualizar usuario
    await usuario.update({
      nombre: nombre || usuario.nombre,
      email: email || usuario.email,
      rol_id: rol_id || usuario.rol_id,
      activo: activo !== undefined ? activo : usuario.activo
    });
    
    // Obtener usuario actualizado con su rol
    const usuarioActualizado = await Usuario.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [{ model: Rol }]
    });
    
    res.status(200).json(usuarioActualizado);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Cambiar contraseña de un usuario (solo administradores)
router.put('/:id/password', [verificarToken, esAdmin], async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ message: 'La contraseña es requerida' });
    }
    
    // Buscar usuario
    const usuario = await Usuario.findByPk(req.params.id);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // Actualizar contraseña
    usuario.password = password;
    await usuario.save();
    
    res.status(200).json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Eliminar un usuario (solo administradores)
router.delete('/:id', [verificarToken, esAdmin], async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id);
    
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // Verificar que no se elimine a sí mismo
    if (parseInt(req.params.id) === req.userId) {
      return res.status(400).json({ message: 'No puede eliminar su propio usuario' });
    }
    
    await usuario.destroy();
    
    res.status(200).json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
