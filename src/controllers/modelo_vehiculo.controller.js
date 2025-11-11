const { ModeloVehiculo, Producto, ProductoModeloCompatibilidad } = require('../models');
const { Op } = require('sequelize');

/**
 * Controlador para gestionar los modelos de vehículos
 */
const ModeloVehiculoController = {
  /**
   * Obtiene todos los modelos de vehículos
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  getAllModelosVehiculos: async (req, res) => {
    try {
      const { marca, modelo, anio, activo } = req.query;
      
      // Construir condiciones de búsqueda
      const where = {};
      
      if (marca) {
        where.marca = { [Op.like]: `%${marca}%` };
      }
      
      if (modelo) {
        where.modelo = { [Op.like]: `%${modelo}%` };
      }
      
      if (anio) {
        const anioNum = parseInt(anio);
        where[Op.and] = [
          { anio_inicio: { [Op.lte]: anioNum } },
          {
            [Op.or]: [
              { anio_fin: { [Op.gte]: anioNum } },
              { anio_fin: null }
            ]
          }
        ];
      }
      
      if (activo !== undefined) {
        where.activo = activo === 'true';
      }
      
      const modelosVehiculos = await ModeloVehiculo.findAll({
        where,
        order: [
          ['marca', 'ASC'],
          ['modelo', 'ASC'],
          ['anio_inicio', 'DESC']
        ]
      });
      
      return res.json(modelosVehiculos);
    } catch (error) {
      console.error('Error al obtener modelos de vehículos:', error);
      return res.status(500).json({ message: 'Error al obtener modelos de vehículos' });
    }
  },
  
  /**
   * Obtiene un modelo de vehículo por su ID
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  getModeloVehiculoById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const modeloVehiculo = await ModeloVehiculo.findByPk(id);
      
      if (!modeloVehiculo) {
        return res.status(404).json({ message: 'Modelo de vehículo no encontrado' });
      }
      
      return res.json(modeloVehiculo);
    } catch (error) {
      console.error('Error al obtener modelo de vehículo:', error);
      return res.status(500).json({ message: 'Error al obtener modelo de vehículo' });
    }
  },
  
  /**
   * Crea un nuevo modelo de vehículo
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  createModeloVehiculo: async (req, res) => {
    try {
      const { marca, modelo, anio_inicio, anio_fin, motor, observaciones } = req.body;
      
      // Validar datos requeridos
      if (!marca || !modelo) {
        return res.status(400).json({ message: 'La marca y el modelo son requeridos' });
      }
      
      // Verificar si ya existe un modelo similar
      const existingModelo = await ModeloVehiculo.findOne({
        where: {
          marca,
          modelo,
          anio_inicio: anio_inicio || null,
          anio_fin: anio_fin || null,
          motor: motor || null
        }
      });
      
      if (existingModelo) {
        return res.status(400).json({ message: 'Ya existe un modelo de vehículo con características similares' });
      }
      
      // Crear el nuevo modelo de vehículo
      const nuevoModeloVehiculo = await ModeloVehiculo.create({
        marca,
        modelo,
        anio_inicio,
        anio_fin,
        motor,
        observaciones,
        activo: true
      });
      
      return res.status(201).json(nuevoModeloVehiculo);
    } catch (error) {
      console.error('Error al crear modelo de vehículo:', error);
      return res.status(500).json({ message: 'Error al crear modelo de vehículo' });
    }
  },
  
  /**
   * Actualiza un modelo de vehículo existente
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  updateModeloVehiculo: async (req, res) => {
    try {
      const { id } = req.params;
      const { marca, modelo, anio_inicio, anio_fin, motor, observaciones, activo } = req.body;
      
      // Buscar el modelo de vehículo
      const modeloVehiculo = await ModeloVehiculo.findByPk(id);
      
      if (!modeloVehiculo) {
        return res.status(404).json({ message: 'Modelo de vehículo no encontrado' });
      }
      
      // Actualizar los campos
      await modeloVehiculo.update({
        marca: marca || modeloVehiculo.marca,
        modelo: modelo || modeloVehiculo.modelo,
        anio_inicio: anio_inicio !== undefined ? anio_inicio : modeloVehiculo.anio_inicio,
        anio_fin: anio_fin !== undefined ? anio_fin : modeloVehiculo.anio_fin,
        motor: motor !== undefined ? motor : modeloVehiculo.motor,
        observaciones: observaciones !== undefined ? observaciones : modeloVehiculo.observaciones,
        activo: activo !== undefined ? activo : modeloVehiculo.activo
      });
      
      return res.json(modeloVehiculo);
    } catch (error) {
      console.error('Error al actualizar modelo de vehículo:', error);
      return res.status(500).json({ message: 'Error al actualizar modelo de vehículo' });
    }
  },
  
  /**
   * Elimina un modelo de vehículo (desactivación lógica)
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  deleteModeloVehiculo: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Buscar el modelo de vehículo
      const modeloVehiculo = await ModeloVehiculo.findByPk(id);
      
      if (!modeloVehiculo) {
        return res.status(404).json({ message: 'Modelo de vehículo no encontrado' });
      }
      
      // Desactivar en lugar de eliminar físicamente
      await modeloVehiculo.update({ activo: false });
      
      return res.json({ message: 'Modelo de vehículo desactivado correctamente' });
    } catch (error) {
      console.error('Error al desactivar modelo de vehículo:', error);
      return res.status(500).json({ message: 'Error al desactivar modelo de vehículo' });
    }
  },
  
  /**
   * Obtiene todos los productos compatibles con un modelo de vehículo específico
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  getProductosCompatibles: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verificar que el modelo de vehículo existe
      const modeloVehiculo = await ModeloVehiculo.findByPk(id);
      
      if (!modeloVehiculo) {
        return res.status(404).json({ message: 'Modelo de vehículo no encontrado' });
      }
      
      // Obtener productos compatibles
      const productos = await Producto.findAll({
        include: [
          {
            model: ModeloVehiculo,
            as: 'ModelosCompatibles',
            through: {
              model: ProductoModeloCompatibilidad,
              attributes: ['notas_compatibilidad', 'es_original']
            },
            where: { id },
            required: true
          }
        ]
      });
      
      return res.json(productos);
    } catch (error) {
      console.error('Error al obtener productos compatibles:', error);
      return res.status(500).json({ message: 'Error al obtener productos compatibles' });
    }
  },
  
  /**
   * Asocia un producto con un modelo de vehículo
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  asociarProductoModelo: async (req, res) => {
    try {
      const { producto_id, modelo_vehiculo_id, notas_compatibilidad, es_original } = req.body;
      
      // Validar datos requeridos
      if (!producto_id || !modelo_vehiculo_id) {
        return res.status(400).json({ message: 'El ID del producto y el ID del modelo de vehículo son requeridos' });
      }
      
      // Verificar que el producto existe
      const producto = await Producto.findByPk(producto_id);
      if (!producto) {
        return res.status(404).json({ message: 'Producto no encontrado' });
      }
      
      // Verificar que el modelo de vehículo existe
      const modeloVehiculo = await ModeloVehiculo.findByPk(modelo_vehiculo_id);
      if (!modeloVehiculo) {
        return res.status(404).json({ message: 'Modelo de vehículo no encontrado' });
      }
      
      // Verificar si ya existe la asociación
      const existingAsociacion = await ProductoModeloCompatibilidad.findOne({
        where: {
          producto_id,
          modelo_vehiculo_id
        }
      });
      
      if (existingAsociacion) {
        // Actualizar la asociación existente
        await existingAsociacion.update({
          notas_compatibilidad: notas_compatibilidad || existingAsociacion.notas_compatibilidad,
          es_original: es_original !== undefined ? es_original : existingAsociacion.es_original
        });
        
        return res.json({
          message: 'Asociación actualizada correctamente',
          asociacion: existingAsociacion
        });
      }
      
      // Crear nueva asociación
      const nuevaAsociacion = await ProductoModeloCompatibilidad.create({
        producto_id,
        modelo_vehiculo_id,
        notas_compatibilidad,
        es_original: es_original || false
      });
      
      return res.status(201).json({
        message: 'Producto asociado correctamente al modelo de vehículo',
        asociacion: nuevaAsociacion
      });
    } catch (error) {
      console.error('Error al asociar producto con modelo de vehículo:', error);
      return res.status(500).json({ message: 'Error al asociar producto con modelo de vehículo' });
    }
  },
  
  /**
   * Elimina la asociación entre un producto y un modelo de vehículo
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  eliminarAsociacionProductoModelo: async (req, res) => {
    try {
      const { producto_id, modelo_vehiculo_id } = req.params;
      
      // Buscar la asociación
      const asociacion = await ProductoModeloCompatibilidad.findOne({
        where: {
          producto_id,
          modelo_vehiculo_id
        }
      });
      
      if (!asociacion) {
        return res.status(404).json({ message: 'Asociación no encontrada' });
      }
      
      // Eliminar la asociación
      await asociacion.destroy();
      
      return res.json({ message: 'Asociación eliminada correctamente' });
    } catch (error) {
      console.error('Error al eliminar asociación:', error);
      return res.status(500).json({ message: 'Error al eliminar asociación' });
    }
  }
};

module.exports = ModeloVehiculoController;
