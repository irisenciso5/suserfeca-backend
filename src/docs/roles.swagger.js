/**
 * @swagger
 * components:
 *   schemas:
 *     Rol:
 *       type: object
 *       required:
 *         - nombre
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único del rol
 *         nombre:
 *           type: string
 *           description: Nombre del rol
 *       example:
 *         id: 1
 *         nombre: administrador
 */

/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: API para gestionar roles de usuario
 */

/**
 * @swagger
 * /api/roles:
 *   get:
 *     summary: Obtiene todos los roles disponibles
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de roles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Rol'
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */

module.exports = {
  // Este archivo solo contiene documentación Swagger
};
