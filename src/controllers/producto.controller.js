const { Producto, Categoria, Marca, ModeloVehiculo, ProductoModeloCompatibilidad } = require('../models');
const { Op } = require('sequelize');

/**
 * Controlador para gestionar los productos
 */
const ProductoController = {
  /**
   * Obtiene todos los productos con filtros opcionales
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  getAllProductos: async (req, res) => {
    try {
      const { 
        codigo, 
        descripcion, 
        categoria_id, 
        marca_id, 
        precio_min, 
        precio_max,
        stock_min,
        modelo_vehiculo_id,
        marca_vehiculo,
        modelo_vehiculo,
        anio_vehiculo
      } = req.query;
      
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      
      // Construir condiciones de búsqueda
      const where = {};
      
      if (codigo) {
        where.codigo = { [Op.like]: `%${codigo}%` };
      }
      
      if (descripcion) {
        where.descripcion = { [Op.like]: `%${descripcion}%` };
      }
      
      if (categoria_id) {
        where.categoria_id = categoria_id;
      }
      
      if (marca_id) {
        where.marca_id = marca_id;
      }
      
      if (precio_min && precio_max) {
        where.precio_venta = { [Op.between]: [precio_min, precio_max] };
      } else if (precio_min) {
        where.precio_venta = { [Op.gte]: precio_min };
      } else if (precio_max) {
        where.precio_venta = { [Op.lte]: precio_max };
      }
      
      if (stock_min) {
        where.stock_actual = { [Op.gte]: stock_min };
      }
      
      // Configurar includes para las relaciones
      const includes = [
        { model: Categoria },
        { model: Marca }
      ];
      
      // Si se solicita filtrar por modelo de vehículo
      if (modelo_vehiculo_id || marca_vehiculo || modelo_vehiculo || anio_vehiculo) {
        const modeloVehiculoWhere = {};
        
        if (modelo_vehiculo_id) {
          modeloVehiculoWhere.id = modelo_vehiculo_id;
        }
        
        if (marca_vehiculo) {
          modeloVehiculoWhere.marca = { [Op.like]: `%${marca_vehiculo}%` };
        }
        
        if (modelo_vehiculo) {
          modeloVehiculoWhere.modelo = { [Op.like]: `%${modelo_vehiculo}%` };
        }
        
        if (anio_vehiculo) {
          const anioNum = parseInt(anio_vehiculo);
          modeloVehiculoWhere[Op.and] = [
            { anio_inicio: { [Op.lte]: anioNum } },
            {
              [Op.or]: [
                { anio_fin: { [Op.gte]: anioNum } },
                { anio_fin: null }
              ]
            }
          ];
        }
        
        includes.push({
          model: ModeloVehiculo,
          as: 'ModelosCompatibles',
          where: modeloVehiculoWhere,
          through: {
            model: ProductoModeloCompatibilidad,
            attributes: ['notas_compatibilidad', 'es_original']
          },
          required: true
        });
      }
      
      // Contar total de productos que coinciden con los filtros
      const count = await Producto.count({
        where,
        include: includes,
        distinct: true
      });
      
      // Obtener productos paginados
      const productos = await Producto.findAll({
        where,
        include: includes,
        order: [['id', 'DESC']],
        limit,
        offset,
        distinct: true
      });
      
      return res.json({
        total: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        productos
      });
    } catch (error) {
      console.error('Error al obtener productos:', error);
      return res.status(500).json({ message: 'Error al obtener productos' });
    }
  },
  
  /**
   * Obtiene un producto por su ID
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  getProductoById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const producto = await Producto.findByPk(id, {
        include: [
          { model: Categoria },
          { model: Marca },
          {
            model: ModeloVehiculo,
            as: 'ModelosCompatibles',
            through: {
              model: ProductoModeloCompatibilidad,
              attributes: ['notas_compatibilidad', 'es_original']
            }
          }
        ]
      });
      
      if (!producto) {
        return res.status(404).json({ message: 'Producto no encontrado' });
      }
      
      return res.json(producto);
    } catch (error) {
      console.error('Error al obtener producto:', error);
      return res.status(500).json({ message: 'Error al obtener producto' });
    }
  },
  
  /**
   * Obtiene los modelos de vehículos compatibles con un producto específico
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  getModelosVehiculosCompatibles: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verificar que el producto existe
      const producto = await Producto.findByPk(id);
      
      if (!producto) {
        return res.status(404).json({ message: 'Producto no encontrado' });
      }
      
      // Obtener modelos de vehículos compatibles
      const modelosVehiculos = await ModeloVehiculo.findAll({
        include: [
          {
            model: Producto,
            as: 'ProductosCompatibles',
            through: {
              model: ProductoModeloCompatibilidad,
              attributes: ['notas_compatibilidad', 'es_original']
            },
            where: { id },
            required: true
          }
        ]
      });
      
      return res.json(modelosVehiculos);
    } catch (error) {
      console.error('Error al obtener modelos de vehículos compatibles:', error);
      return res.status(500).json({ message: 'Error al obtener modelos de vehículos compatibles' });
    }
  }
};

module.exports = ProductoController;
