const express = require('express');
const router = express.Router();
const ProductoController = require('../controllers/producto.controller');
const { verificarToken, esAdmin, esVendedor } = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Productos
 *   description: API para gestionar productos
 */

/**
 * @swagger
 * /api/productos:
 *   get:
 *     summary: Obtiene todos los productos con filtros opcionales
 *     tags: [Productos]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Número de elementos por página
 *       - in: query
 *         name: codigo
 *         schema:
 *           type: string
 *         description: Filtrar por código
 *       - in: query
 *         name: descripcion
 *         schema:
 *           type: string
 *         description: Filtrar por descripción
 *       - in: query
 *         name: categoria_id
 *         schema:
 *           type: integer
 *         description: Filtrar por categoría
 *       - in: query
 *         name: marca_id
 *         schema:
 *           type: integer
 *         description: Filtrar por marca
 *       - in: query
 *         name: precio_min
 *         schema:
 *           type: number
 *         description: Precio mínimo
 *       - in: query
 *         name: precio_max
 *         schema:
 *           type: number
 *         description: Precio máximo
 *       - in: query
 *         name: stock_min
 *         schema:
 *           type: integer
 *         description: Stock mínimo
 *       - in: query
 *         name: modelo_vehiculo_id
 *         schema:
 *           type: integer
 *         description: ID del modelo de vehículo compatible
 *       - in: query
 *         name: marca_vehiculo
 *         schema:
 *           type: string
 *         description: Marca del vehículo compatible
 *       - in: query
 *         name: modelo_vehiculo
 *         schema:
 *           type: string
 *         description: Modelo del vehículo compatible
 *       - in: query
 *         name: anio_vehiculo
 *         schema:
 *           type: integer
 *         description: Año del vehículo compatible
 *     responses:
 *       200:
 *         description: Lista paginada de productos
 *       500:
 *         description: Error del servidor
 */
router.get('/', ProductoController.getAllProductos);

/**
 * @swagger
 * /api/productos/{id}:
 *   get:
 *     summary: Obtiene un producto por su ID
 *     tags: [Productos]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del producto
 *     responses:
 *       200:
 *         description: Datos del producto
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error del servidor
 */
router.get('/:id', ProductoController.getProductoById);

/**
 * @swagger
 * /api/productos/{id}/modelos-vehiculos:
 *   get:
 *     summary: Obtiene los modelos de vehículos compatibles con un producto específico
 *     tags: [Productos]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del producto
 *     responses:
 *       200:
 *         description: Lista de modelos de vehículos compatibles
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error del servidor
 */
router.get('/:id/modelos-vehiculos', ProductoController.getModelosVehiculosCompatibles);

module.exports = router;
