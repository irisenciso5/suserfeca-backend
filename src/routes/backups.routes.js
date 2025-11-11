const express = require('express');
const router = express.Router();
const { Backup } = require('../models');
const { verificarToken, esAdmin } = require('../middleware/auth.middleware');
const path = require('path');
const fs = require('fs');
const { sequelize } = require('../config/database');

// Directorio para backups
const BACKUP_DIR = path.join(__dirname, '../../backups');

// Crear directorio de backups si no existe
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Obtener todos los backups
router.get('/', [verificarToken, esAdmin], async (req, res) => {
  try {
    const backups = await Backup.findAll({
      order: [['fecha_creacion', 'DESC']]
    });
    
    res.status(200).json(backups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Crear un nuevo backup (solo admin)
router.post('/', [verificarToken, esAdmin], async (req, res) => {
  try {
    // Generar nombre de archivo con fecha y hora
    const fecha = new Date();
    const nombreArchivo = `backup_${fecha.getFullYear()}${(fecha.getMonth() + 1).toString().padStart(2, '0')}${fecha.getDate().toString().padStart(2, '0')}_${fecha.getHours().toString().padStart(2, '0')}${fecha.getMinutes().toString().padStart(2, '0')}.sqlite`;
    const rutaArchivo = path.join(BACKUP_DIR, nombreArchivo);
    
    // Crear copia de la base de datos
    const dbPath = path.join(__dirname, '../../database.sqlite');
    
    if (!fs.existsSync(dbPath)) {
      return res.status(404).json({ message: 'Archivo de base de datos no encontrado' });
    }
    
    // Copiar archivo de base de datos
    fs.copyFileSync(dbPath, rutaArchivo);
    
    // Registrar backup en la base de datos
    const nuevoBackup = await Backup.create({
      fecha_creacion: fecha,
      nombre_archivo: nombreArchivo,
      ruta_archivo: rutaArchivo,
      usuario_id: req.userId
    });
    
    res.status(201).json(nuevoBackup);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Restaurar un backup (solo admin)
router.post('/:id/restaurar', [verificarToken, esAdmin], async (req, res) => {
  try {
    const backup = await Backup.findByPk(req.params.id);
    
    if (!backup) {
      return res.status(404).json({ message: 'Backup no encontrado' });
    }
    
    // Verificar que el archivo existe
    if (!fs.existsSync(backup.ruta_archivo)) {
      return res.status(404).json({ message: 'Archivo de backup no encontrado' });
    }
    
    // Cerrar todas las conexiones a la base de datos
    await sequelize.close();
    
    // Ruta de la base de datos actual
    const dbPath = path.join(__dirname, '../../database.sqlite');
    
    // Crear backup de la base de datos actual antes de restaurar
    const fechaActual = new Date();
    const nombreArchivoAntes = `pre_restauracion_${fechaActual.getFullYear()}${(fechaActual.getMonth() + 1).toString().padStart(2, '0')}${fechaActual.getDate().toString().padStart(2, '0')}_${fechaActual.getHours().toString().padStart(2, '0')}${fechaActual.getMinutes().toString().padStart(2, '0')}.sqlite`;
    const rutaArchivoAntes = path.join(BACKUP_DIR, nombreArchivoAntes);
    
    // Copiar base de datos actual como respaldo
    fs.copyFileSync(dbPath, rutaArchivoAntes);
    
    // Restaurar backup
    fs.copyFileSync(backup.ruta_archivo, dbPath);
    
    // Registrar el backup automático
    await Backup.create({
      fecha_creacion: fechaActual,
      nombre_archivo: nombreArchivoAntes,
      ruta_archivo: rutaArchivoAntes,
      usuario_id: req.userId
    });
    
    res.status(200).json({ message: 'Backup restaurado correctamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Eliminar un backup (solo admin)
router.delete('/:id', [verificarToken, esAdmin], async (req, res) => {
  try {
    const backup = await Backup.findByPk(req.params.id);
    
    if (!backup) {
      return res.status(404).json({ message: 'Backup no encontrado' });
    }
    
    // Eliminar archivo si existe
    if (fs.existsSync(backup.ruta_archivo)) {
      fs.unlinkSync(backup.ruta_archivo);
    }
    
    // Eliminar registro de la base de datos
    await backup.destroy();
    
    res.status(200).json({ message: 'Backup eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
