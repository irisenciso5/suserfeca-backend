/**
 * @swagger
 * components:
 *   schemas:
 *     Divisa:
 *       type: object
 *       required:
 *         - codigo
 *         - nombre
 *         - simbolo
 *         - tasa_cambio
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único de la divisa
 *         codigo:
 *           type: string
 *           description: Código ISO de la divisa (USD, COP, VES, EUR)
 *         nombre:
 *           type: string
 *           description: Nombre de la divisa
 *         simbolo:
 *           type: string
 *           description: Símbolo de la divisa
 *         tasa_cambio:
 *           type: number
 *           format: float
 *           description: Tasa de cambio con respecto al dólar (USD)
 *         es_principal:
 *           type: boolean
 *           description: Indica si es la divisa principal del sistema
 *         activa:
 *           type: boolean
 *           description: Indica si la divisa está activa en el sistema
 *         ultima_actualizacion:
 *           type: string
 *           format: date-time
 *           description: Fecha de la última actualización de la tasa de cambio
 *       example:
 *         id: 1
 *         codigo: USD
 *         nombre: Dólar estadounidense
 *         simbolo: $
 *         tasa_cambio: 1.0
 *         es_principal: true
 *         activa: true
 *         ultima_actualizacion: 2023-01-01T00:00:00.000Z
 *
 *     ConversionDivisa:
 *       type: object
 *       properties:
 *         monto_original:
 *           type: number
 *           format: float
 *           description: Monto original a convertir
 *         divisa_origen:
 *           type: string
 *           description: Código de la divisa de origen
 *         monto_convertido:
 *           type: number
 *           format: float
 *           description: Monto convertido
 *         divisa_destino:
 *           type: string
 *           description: Código de la divisa de destino
 *         tasa_aplicada:
 *           type: number
 *           format: float
 *           description: Tasa de cambio aplicada en la conversión
 *       example:
 *         monto_original: 100
 *         divisa_origen: USD
 *         monto_convertido: 390000
 *         divisa_destino: COP
 *         tasa_aplicada: 3900
 */

/**
 * @swagger
 * tags:
 *   name: Divisas
 *   description: API para gestionar divisas
 */

/**
 * @swagger
 * /api/divisas:
 *   get:
 *     summary: Obtiene todas las divisas activas
 *     tags: [Divisas]
 *     responses:
 *       200:
 *         description: Lista de divisas activas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Divisa'
 *       500:
 *         description: Error del servidor
 */

/**
 * @swagger
 * /api/divisas/principal:
 *   get:
 *     summary: Obtiene la divisa principal del sistema
 *     tags: [Divisas]
 *     responses:
 *       200:
 *         description: Divisa principal
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Divisa'
 *       404:
 *         description: No se ha configurado una divisa principal
 *       500:
 *         description: Error del servidor
 */

/**
 * @swagger
 * /api/divisas/{id}:
 *   get:
 *     summary: Obtiene una divisa por su ID
 *     tags: [Divisas]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la divisa
 *     responses:
 *       200:
 *         description: Divisa encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Divisa'
 *       404:
 *         description: Divisa no encontrada
 *       500:
 *         description: Error del servidor
 */

/**
 * @swagger
 * /api/divisas/{id}/tasa:
 *   put:
 *     summary: Actualiza la tasa de cambio de una divisa
 *     tags: [Divisas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la divisa
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tasa_cambio
 *             properties:
 *               tasa_cambio:
 *                 type: number
 *                 format: float
 *                 description: Nueva tasa de cambio
 *     responses:
 *       200:
 *         description: Tasa de cambio actualizada correctamente
 *       400:
 *         description: Datos inválidos o no se puede modificar la divisa principal
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso prohibido
 *       404:
 *         description: Divisa no encontrada
 *       500:
 *         description: Error del servidor
 */

/**
 * @swagger
 * /api/divisas/{id}/estado:
 *   put:
 *     summary: Activa o desactiva una divisa
 *     tags: [Divisas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la divisa
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - activa
 *             properties:
 *               activa:
 *                 type: boolean
 *                 description: Estado de activación de la divisa
 *     responses:
 *       200:
 *         description: Estado de la divisa actualizado correctamente
 *       400:
 *         description: Datos inválidos o no se puede desactivar la divisa principal
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso prohibido
 *       404:
 *         description: Divisa no encontrada
 *       500:
 *         description: Error del servidor
 */

/**
 * @swagger
 * /api/divisas/convertir:
 *   post:
 *     summary: Convierte un monto de una divisa a otra
 *     tags: [Divisas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - monto
 *               - divisa_origen_id
 *               - divisa_destino_id
 *             properties:
 *               monto:
 *                 type: number
 *                 format: float
 *                 description: Monto a convertir
 *               divisa_origen_id:
 *                 type: integer
 *                 description: ID de la divisa de origen
 *               divisa_destino_id:
 *                 type: integer
 *                 description: ID de la divisa de destino
 *     responses:
 *       200:
 *         description: Conversión realizada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConversionDivisa'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Una o ambas divisas no fueron encontradas
 *       500:
 *         description: Error del servidor
 */

module.exports = {};
