/**
 * @swagger
 * components:
 *   schemas:
 *     ModeloVehiculo:
 *       type: object
 *       required:
 *         - marca
 *         - modelo
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único del modelo de vehículo
 *         marca:
 *           type: string
 *           description: Marca del vehículo (Toyota, Ford, Chevrolet, etc.)
 *         modelo:
 *           type: string
 *           description: Modelo del vehículo (Corolla, Mustang, Aveo, etc.)
 *         anio_inicio:
 *           type: integer
 *           description: Año de inicio de compatibilidad
 *         anio_fin:
 *           type: integer
 *           description: Año de fin de compatibilidad (null si sigue vigente)
 *         motor:
 *           type: string
 *           description: Descripción del motor (1.6L, V8, etc.)
 *         observaciones:
 *           type: string
 *           description: Observaciones adicionales sobre el modelo
 *         activo:
 *           type: boolean
 *           description: Indica si el modelo está activo en el sistema
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación del registro
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de última actualización del registro
 *       example:
 *         id: 1
 *         marca: "Toyota"
 *         modelo: "Corolla"
 *         anio_inicio: 2010
 *         anio_fin: 2015
 *         motor: "1.8L"
 *         observaciones: "Sedán popular en Venezuela"
 *         activo: true
 *         createdAt: "2023-01-01T00:00:00.000Z"
 *         updatedAt: "2023-01-01T00:00:00.000Z"
 *
 *     ProductoModeloCompatibilidad:
 *       type: object
 *       required:
 *         - producto_id
 *         - modelo_vehiculo_id
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único de la relación
 *         producto_id:
 *           type: integer
 *           description: ID del producto
 *         modelo_vehiculo_id:
 *           type: integer
 *           description: ID del modelo de vehículo
 *         notas_compatibilidad:
 *           type: string
 *           description: Notas específicas sobre la compatibilidad
 *         es_original:
 *           type: boolean
 *           description: Indica si es una pieza original o genérica/compatible
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación del registro
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de última actualización del registro
 *       example:
 *         id: 1
 *         producto_id: 1
 *         modelo_vehiculo_id: 1
 *         notas_compatibilidad: "Compatible con versión automática"
 *         es_original: true
 *         createdAt: "2023-01-01T00:00:00.000Z"
 *         updatedAt: "2023-01-01T00:00:00.000Z"
 *
 * tags:
 *   - name: ModelosVehiculos
 *     description: Operaciones relacionadas con modelos de vehículos
 *   - name: Productos
 *     description: Operaciones relacionadas con productos
 *
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
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ModeloVehiculo'
 *       500:
 *         description: Error del servidor
 *
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ModeloVehiculo'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 *
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ModeloVehiculo'
 *       404:
 *         description: Modelo de vehículo no encontrado
 *       500:
 *         description: Error del servidor
 *
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ModeloVehiculo'
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Modelo de vehículo no encontrado
 *       500:
 *         description: Error del servidor
 *
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
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Modelo de vehículo no encontrado
 *       500:
 *         description: Error del servidor
 *
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
 *
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
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Producto o modelo de vehículo no encontrado
 *       500:
 *         description: Error del servidor
 *
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
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Asociación no encontrada
 *       500:
 *         description: Error del servidor
 *
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
 *
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
 *
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
