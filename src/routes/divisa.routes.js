const express = require('express');
const router = express.Router();
const DivisaController = require('../controllers/divisa.controller');
const { verificarToken, esAdmin } = require('../middleware/auth.middleware');

/**
 * Rutas para el manejo de divisas
 */

// Rutas públicas
router.get('/', DivisaController.getAllDivisas);
router.get('/principal', DivisaController.getDivisaPrincipal);
router.get('/:id', DivisaController.getDivisaById);

// Rutas protegidas (requieren autenticación)
router.post('/convertir', verificarToken, DivisaController.convertirMonto);

// Rutas protegidas (requieren ser administrador)
router.put('/:id/tasa', [verificarToken, esAdmin], DivisaController.updateTasaCambio);
router.put('/:id/estado', [verificarToken, esAdmin], DivisaController.toggleDivisaStatus);

module.exports = router;
