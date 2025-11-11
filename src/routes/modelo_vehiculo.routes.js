const express = require('express');
const router = express.Router();
const ModeloVehiculoController = require('../controllers/modelo_vehiculo.controller');
const { verificarToken, esAdmin, esVendedor } = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: ModelosVehiculos
 *   description: API para gestionar modelos de vehículos y sus compatibilidades con productos
 */

/**
 * @swagger
 * /api/modelos-vehiculos:
 *   get:
 *     summary: Obtiene todos los modelos de vehículos
 *     tags: [ModelosVehiculos]
 *     parameters:
 *       - in: query
 *         name: marca
 *         schema:
 *           type: string
 *         description: Filtrar por marca
 *       - in: query
 *         name: modelo
 *         schema:
 *           type: string
 *         description: Filtrar por modelo
 *       - in: query
 *         name: anio
 *         schema:
 *           type: integer
 *         description: Filtrar por año específico (busca modelos compatibles con ese año)
 *       - in: query
 *         name: activo
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado activo/inactivo
 *     responses:
 *       200:
 *         description: Lista de modelos de vehículos
 *       500:
 *         description: Error del servidor
 */
router.get('/', ModeloVehiculoController.getAllModelosVehiculos);

/**
 * @swagger
 * /api/modelos-vehiculos/{id}:
 *   get:
 *     summary: Obtiene un modelo de vehículo por su ID
 *     tags: [ModelosVehiculos]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del modelo de vehículo
 *     responses:
 *       200:
 *         description: Datos del modelo de vehículo
 *       404:
 *         description: Modelo de vehículo no encontrado
 *       500:
 *         description: Error del servidor
 */
router.get('/:id', ModeloVehiculoController.getModeloVehiculoById);

/**
 * @swagger
 * /api/modelos-vehiculos:
 *   post:
 *     summary: Crea un nuevo modelo de vehículo
 *     tags: [ModelosVehiculos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - marca
 *               - modelo
 *             properties:
 *               marca:
 *                 type: string
 *               modelo:
 *                 type: string
 *               anio_inicio:
 *                 type: integer
 *               anio_fin:
 *                 type: integer
 *               motor:
 *                 type: string
 *               observaciones:
 *                 type: string
 *     responses:
 *       201:
 *         description: Modelo de vehículo creado exitosamente
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error del servidor
 */
router.post('/', [verificarToken, esAdmin], ModeloVehiculoController.createModeloVehiculo);

/**
 * @swagger
 * /api/modelos-vehiculos/{id}:
 *   put:
 *     summary: Actualiza un modelo de vehículo existente
 *     tags: [ModelosVehiculos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del modelo de vehículo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               marca:
 *                 type: string
 *               modelo:
 *                 type: string
 *               anio_inicio:
 *                 type: integer
 *               anio_fin:
 *                 type: integer
 *               motor:
 *                 type: string
 *               observaciones:
 *                 type: string
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Modelo de vehículo actualizado exitosamente
 *       404:
 *         description: Modelo de vehículo no encontrado
 *       500:
 *         description: Error del servidor
 */
router.put('/:id', [verificarToken, esAdmin], ModeloVehiculoController.updateModeloVehiculo);

/**
 * @swagger
 * /api/modelos-vehiculos/{id}:
 *   delete:
 *     summary: Desactiva un modelo de vehículo (eliminación lógica)
 *     tags: [ModelosVehiculos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del modelo de vehículo
 *     responses:
 *       200:
 *         description: Modelo de vehículo desactivado exitosamente
 *       404:
 *         description: Modelo de vehículo no encontrado
 *       500:
 *         description: Error del servidor
 */
router.delete('/:id', [verificarToken, esAdmin], ModeloVehiculoController.deleteModeloVehiculo);

/**
 * @swagger
 * /api/modelos-vehiculos/{id}/productos:
 *   get:
 *     summary: Obtiene todos los productos compatibles con un modelo de vehículo específico
 *     tags: [ModelosVehiculos]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del modelo de vehículo
 *     responses:
 *       200:
 *         description: Lista de productos compatibles
 *       404:
 *         description: Modelo de vehículo no encontrado
 *       500:
 *         description: Error del servidor
 */
router.get('/:id/productos', ModeloVehiculoController.getProductosCompatibles);

/**
 * @swagger
 * /api/modelos-vehiculos/asociar:
 *   post:
 *     summary: Asocia un producto con un modelo de vehículo
 *     tags: [ModelosVehiculos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - producto_id
 *               - modelo_vehiculo_id
 *             properties:
 *               producto_id:
 *                 type: integer
 *               modelo_vehiculo_id:
 *                 type: integer
 *               notas_compatibilidad:
 *                 type: string
 *               es_original:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Asociación creada exitosamente
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Producto o modelo de vehículo no encontrado
 *       500:
 *         description: Error del servidor
 */
router.post('/asociar', [verificarToken, esVendedor], ModeloVehiculoController.asociarProductoModelo);

/**
 * @swagger
 * /api/modelos-vehiculos/asociar/{producto_id}/{modelo_vehiculo_id}:
 *   delete:
 *     summary: Elimina la asociación entre un producto y un modelo de vehículo
 *     tags: [ModelosVehiculos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: producto_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del producto
 *       - in: path
 *         name: modelo_vehiculo_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del modelo de vehículo
 *     responses:
 *       200:
 *         description: Asociación eliminada exitosamente
 *       404:
 *         description: Asociación no encontrada
 *       500:
 *         description: Error del servidor
 */
router.delete('/asociar/:producto_id/:modelo_vehiculo_id', [verificarToken, esAdmin], ModeloVehiculoController.eliminarAsociacionProductoModelo);

module.exports = router;
