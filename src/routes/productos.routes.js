const express = require('express');
const router = express.Router();
const { Producto, Categoria, Marca, Proveedor } = require('../models');
const { verificarToken, esVendedor } = require('../middleware/auth.middleware');
const { Op } = require('sequelize');
const ExcelJS = require('exceljs');
const multer = require('multer');
const path = require('path');

// Configuración de multer para la carga de archivos Excel
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, 'productos-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Validar que sea un archivo Excel
    const filetypes = /xlsx|xls/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('El archivo debe ser un Excel válido (.xlsx o .xls)'));
  }
});

// Configurar middleware para manejar errores de Multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('Error de Multer:', err);
    return res.status(400).json({ message: `Error al subir archivo: ${err.message}` });
  } else if (err) {
    console.error('Error general:', err);
    return res.status(500).json({ message: `Error del servidor: ${err.message}` });
  }
  next();
});

// Obtener todos los productos
router.get('/', verificarToken, async (req, res) => {
  try {
    const { 
      buscar, 
      categoria_id, 
      marca_id, 
      stock_bajo, 
      ordenar_por, 
      orden,
      limite,
      pagina
    } = req.query;
    
    // Configurar opciones de búsqueda
    const opciones = {
      include: [
        { model: Categoria },
        { model: Marca }
      ],
      where: {}
    };
    
    // Filtrar por término de búsqueda
    if (buscar) {
      opciones.where = {
        [Op.or]: [
          { codigo: { [Op.like]: `%${buscar}%` } },
          { descripcion: { [Op.like]: `%${buscar}%` } }
        ]
      };
    }
    
    // Filtrar por categoría
    if (categoria_id) {
      opciones.where.categoria_id = categoria_id;
    }
    
    // Filtrar por marca
    if (marca_id) {
      opciones.where.marca_id = marca_id;
    }
    
    // Filtrar por stock bajo
    if (stock_bajo === 'true') {
      opciones.where = {
        ...opciones.where,
        stock_actual: {
          [Op.lte]: sequelize.col('stock_minimo')
        }
      };
    }
    
    // Ordenar resultados
    if (ordenar_por) {
      opciones.order = [[ordenar_por, orden === 'desc' ? 'DESC' : 'ASC']];
    }
    
    // Paginación
    if (limite && pagina) {
      opciones.limit = parseInt(limite);
      opciones.offset = (parseInt(pagina) - 1) * parseInt(limite);
    }
    
    // Obtener productos
    const productos = await Producto.findAndCountAll(opciones);
    
    res.status(200).json({
      total: productos.count,
      pagina: pagina ? parseInt(pagina) : 1,
      limite: limite ? parseInt(limite) : productos.count,
      productos: productos.rows
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtener un producto por ID
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const producto = await Producto.findByPk(req.params.id, {
      include: [
        { model: Categoria },
        { model: Marca },
        { model: Proveedor }
      ]
    });
    
    if (!producto) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    
    res.status(200).json(producto);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Crear un nuevo producto (vendedor o admin)
router.post('/', [verificarToken, esVendedor], async (req, res) => {
  try {
    const { 
      descripcion, 
      categoria_id, 
      marca_id, 
      precio_compra, 
      precio_venta, 
      stock_actual, 
      stock_minimo, 
      ubicacion, 
      imagen_url, 
      observaciones, 
      pais_origen,
      proveedor_ids
    } = req.body;
    
    // Validar campos requeridos
    if (!descripcion || !precio_venta) {
      return res.status(400).json({ message: 'Descripción y precio de venta son requeridos' });
    }
    
    // Validar que se proporcionen categoría y marca para generar el código
    if (!categoria_id || !marca_id) {
      return res.status(400).json({ message: 'Categoría y marca son requeridos para generar el código del producto' });
    }
    
    // Verificar categoría
    const categoriaExistente = await Categoria.findByPk(categoria_id);
    if (!categoriaExistente) {
      return res.status(404).json({ message: 'La categoría especificada no existe' });
    }
    
    // Verificar marca
    const marcaExistente = await Marca.findByPk(marca_id);
    if (!marcaExistente) {
      return res.status(404).json({ message: 'La marca especificada no existe' });
    }
    
    // Generar código automático basado en categoría y marca
    const codigoProducto = await generarCodigoProducto(categoriaExistente, marcaExistente);
    
    // Crear producto con código generado automáticamente
    const nuevoProducto = await Producto.create({
      codigo: codigoProducto,
      descripcion,
      categoria_id,
      marca_id,
      precio_compra,
      precio_venta,
      stock_actual: stock_actual || 0,
      stock_minimo: stock_minimo || 10,
      ubicacion,
      imagen_url,
      observaciones,
      pais_origen
    });
    
    // Asociar proveedores si se proporcionan
    if (proveedor_ids && Array.isArray(proveedor_ids) && proveedor_ids.length > 0) {
      const proveedores = await Proveedor.findAll({
        where: {
          id: proveedor_ids
        }
      });
      
      if (proveedores.length > 0) {
        await nuevoProducto.addProveedores(proveedores);
      }
    }
    
    // Obtener producto creado con sus relaciones
    const productoCreado = await Producto.findByPk(nuevoProducto.id, {
      include: [
        { model: Categoria },
        { model: Marca },
        { model: Proveedor }
      ]
    });
    
    res.status(201).json(productoCreado);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Actualizar un producto (vendedor o admin)
router.put('/:id', [verificarToken, esVendedor], async (req, res) => {
  try {
    const { 
      codigo, 
      descripcion, 
      categoria_id, 
      marca_id, 
      precio_compra, 
      precio_venta, 
      stock_minimo, 
      ubicacion, 
      imagen_url, 
      observaciones, 
      pais_origen,
      proveedor_ids
    } = req.body;
    
    // Buscar producto
    const producto = await Producto.findByPk(req.params.id);
    if (!producto) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    
    // Verificar si ya existe otro producto con ese código
    if (codigo && codigo !== producto.codigo) {
      const codigoExistente = await Producto.findOne({ where: { codigo } });
      if (codigoExistente) {
        return res.status(400).json({ message: 'Ya existe otro producto con ese código' });
      }
    }
    
    // Verificar categoría si se proporciona
    if (categoria_id) {
      const categoriaExistente = await Categoria.findByPk(categoria_id);
      if (!categoriaExistente) {
        return res.status(404).json({ message: 'La categoría especificada no existe' });
      }
    }
    
    // Verificar marca si se proporciona
    if (marca_id) {
      const marcaExistente = await Marca.findByPk(marca_id);
      if (!marcaExistente) {
        return res.status(404).json({ message: 'La marca especificada no existe' });
      }
    }
    
    // Actualizar producto
    await producto.update({
      codigo: codigo || producto.codigo,
      descripcion: descripcion || producto.descripcion,
      categoria_id: categoria_id !== undefined ? categoria_id : producto.categoria_id,
      marca_id: marca_id !== undefined ? marca_id : producto.marca_id,
      precio_compra: precio_compra !== undefined ? precio_compra : producto.precio_compra,
      precio_venta: precio_venta || producto.precio_venta,
      stock_minimo: stock_minimo !== undefined ? stock_minimo : producto.stock_minimo,
      ubicacion: ubicacion !== undefined ? ubicacion : producto.ubicacion,
      imagen_url: imagen_url !== undefined ? imagen_url : producto.imagen_url,
      observaciones: observaciones !== undefined ? observaciones : producto.observaciones,
      pais_origen: pais_origen !== undefined ? pais_origen : producto.pais_origen
    });
    
    // Actualizar proveedores si se proporcionan
    if (proveedor_ids && Array.isArray(proveedor_ids)) {
      const proveedores = await Proveedor.findAll({
        where: {
          id: proveedor_ids
        }
      });
      
      await producto.setProveedores(proveedores);
    }
    
    // Obtener producto actualizado con sus relaciones
    const productoActualizado = await Producto.findByPk(producto.id, {
      include: [
        { model: Categoria },
        { model: Marca },
        { model: Proveedor }
      ]
    });
    
    res.status(200).json(productoActualizado);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Eliminar un producto (vendedor o admin)
router.delete('/:id', [verificarToken, esVendedor], async (req, res) => {
  try {
    const producto = await Producto.findByPk(req.params.id);
    
    if (!producto) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    
    // Verificar si hay movimientos de inventario, detalles de compra o venta asociados
    const movimientosInventario = await producto.getMovimientoInventarios();
    const detallesCompra = await producto.getDetalleCompras();
    const detallesVenta = await producto.getDetalleVentas();
    
    if (movimientosInventario.length > 0 || detallesCompra.length > 0 || detallesVenta.length > 0) {
      return res.status(400).json({ 
        message: 'No se puede eliminar el producto porque tiene registros asociados',
        movimientos: movimientosInventario.length,
        compras: detallesCompra.length,
        ventas: detallesVenta.length
      });
    }
    
    // Desasociar proveedores antes de eliminar
    await producto.setProveedores([]);
    
    await producto.destroy();
    
    res.status(200).json({ message: 'Producto eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Genera un código único para un producto basado en su categoría y marca
 * @param {Object} categoria - Objeto de categoría
 * @param {Object} marca - Objeto de marca
 * @returns {String} Código generado en formato CCC-MMM-NNN
 */
async function generarCodigoProducto(categoria, marca) {
  // Obtener las 3 primeras letras de la categoría y marca en mayúsculas
  const prefijoCat = categoria.nombre.substring(0, 3).toUpperCase();
  const prefijoMarca = marca.nombre.substring(0, 3).toUpperCase();
  
  // Buscar el último producto con la misma combinación de categoría/marca
  const ultimoProducto = await Producto.findOne({
    where: {
      categoria_id: categoria.id,
      marca_id: marca.id,
      codigo: {
        [Op.like]: `${prefijoCat}-${prefijoMarca}-%`
      }
    },
    order: [['codigo', 'DESC']]
  });
  
  let consecutivo = 1;
  
  // Si existe un producto con la misma combinación, extraer el consecutivo y aumentarlo
  if (ultimoProducto) {
    const partes = ultimoProducto.codigo.split('-');
    if (partes.length === 3) {
      const ultimoConsecutivo = parseInt(partes[2]);
      if (!isNaN(ultimoConsecutivo)) {
        consecutivo = ultimoConsecutivo + 1;
      }
    }
  }
  
  // Formatear el consecutivo con ceros a la izquierda (001, 002, etc.)
  const consecutivoStr = consecutivo.toString().padStart(3, '0');
  
  // Generar el código final
  return `${prefijoCat}-${prefijoMarca}-${consecutivoStr}`;
}

/**
 * @swagger
 * /excel/productos/importar:
 *   post:
 *     summary: Importa productos desde un archivo Excel
 *     description: Recibe un archivo Excel con productos para agregar al sistema
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: excel
 *         type: file
 *         required: true
 *         description: Archivo Excel con los productos a importar
 *     responses:
 *       200:
 *         description: Productos importados correctamente
 *       400:
 *         description: Error en la validación de datos
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.post('/excel/productos/importar', [verificarToken, esVendedor, upload.any()], async (req, res) => {
  try {
    console.log('Recibiendo solicitud de importación de Excel');
    console.log('Archivos recibidos:', req.files);
    
    // Verificar si hay archivos en la solicitud
    if (!req.files || req.files.length === 0) {
      console.log('No se encontraron archivos en la solicitud');
      return res.status(400).json({ message: 'No se ha proporcionado un archivo Excel' });
    }

    // Tomar el primer archivo, independientemente del nombre del campo
    const excelFile = req.files[0];
    console.log('Archivo recibido:', excelFile.originalname, 'tamaño:', excelFile.size, 'bytes');
    
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(excelFile.path);
    const worksheet = workbook.getWorksheet(1);
    
    if (!worksheet) {
      console.log('El archivo Excel no contiene hojas de trabajo');
      return res.status(400).json({ message: 'El archivo Excel no contiene hojas de trabajo' });
    }
    
    console.log('Hoja de trabajo encontrada con', worksheet.rowCount, 'filas');

    const productos = [];
    const errores = [];
    let filasLeidas = 0;
    let productosCreados = 0;

    // Saltamos la primera fila (encabezados)
    worksheet.eachRow({ includeEmpty: false }, async (row, rowNumber) => {
      if (rowNumber === 1) return; // Ignorar encabezados
      
      filasLeidas++;
      
      try {
        // Extraer datos de la fila
        const descripcion = row.getCell(1).value;
        const categoriaNombre = row.getCell(2).value;
        const marcaNombre = row.getCell(3).value;
        const precioVenta = parseFloat(row.getCell(4).value);
        const stockActual = parseInt(row.getCell(5).value) || 0;
        const ubicacion = row.getCell(6).value;
        const paisOrigen = row.getCell(7).value;
        
        // Validaciones básicas
        if (!descripcion || !categoriaNombre || !marcaNombre || isNaN(precioVenta)) {
          errores.push(`Fila ${rowNumber}: Datos incompletos o inválidos`);
          return;
        }
        
        // Buscar o crear categoría
        let categoria = await Categoria.findOne({ where: { nombre: { [Op.like]: categoriaNombre } } });
        if (!categoria) {
          categoria = await Categoria.create({ nombre: categoriaNombre });
        }
        
        // Buscar o crear marca
        let marca = await Marca.findOne({ where: { nombre: { [Op.like]: marcaNombre } } });
        if (!marca) {
          marca = await Marca.create({ nombre: marcaNombre });
        }
        
        // Calcular precio de compra (5% menos que el precio de venta)
        const precioCompra = precioVenta * 0.95;
        
        // Generar código automático para el producto
        const codigoProducto = await generarCodigoProducto(categoria, marca);
        
        // Crear el producto
        const nuevoProducto = await Producto.create({
          codigo: codigoProducto,
          descripcion,
          categoria_id: categoria.id,
          marca_id: marca.id,
          precio_compra: precioCompra,
          precio_venta: precioVenta,
          stock_actual: stockActual,
          stock_minimo: 10, // Valor por defecto
          ubicacion,
          pais_origen: paisOrigen
        });
        
        productos.push(nuevoProducto);
        productosCreados++;
      } catch (error) {
        errores.push(`Fila ${rowNumber}: ${error.message}`);
      }
    });
    
    // Esperar a que todas las operaciones asíncronas se completen
    try {
      await Promise.all(productos);
      
      console.log(`Importación completada: ${productosCreados} productos creados de ${filasLeidas} filas leídas`);
      if (errores.length > 0) {
        console.log('Errores encontrados:', errores);
      }
      
      res.status(200).json({
        message: 'Importación completada',
        total_filas_leidas: filasLeidas,
        productos_creados: productosCreados,
        errores
      });
    } catch (promiseError) {
      console.error('Error al procesar las promesas:', promiseError);
      res.status(500).json({ message: 'Error al procesar los productos', error: promiseError.message });
    }
  } catch (error) {
    console.error('Error al importar productos:', error);
    res.status(500).json({ message: 'Error al importar productos', error: error.message });
  }
});

/**
 * @swagger
 * /excel/productos/plantilla:
 *   get:
 *     summary: Descarga una plantilla Excel para importar productos
 *     description: Genera y descarga una plantilla Excel con el formato requerido para importar productos
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Plantilla generada correctamente
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.get('/excel/productos/plantilla', async (req, res) => {
  try {
    // Crear un nuevo libro de trabajo
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Productos');
    
    // Definir encabezados
    worksheet.columns = [
      { header: 'Descripción', key: 'descripcion', width: 40 },
      { header: 'Categoría', key: 'categoria', width: 20 },
      { header: 'Marca', key: 'marca', width: 20 },
      { header: 'Precio', key: 'precio', width: 15 },
      { header: 'Stock', key: 'stock', width: 10 },
      { header: 'Ubicación', key: 'ubicacion', width: 20 },
      { header: 'País de Origen', key: 'pais_origen', width: 20 }
    ];
    
    // Dar formato a los encabezados
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    };
    
    // Agregar datos de ejemplo
    worksheet.addRow({
      descripcion: 'Amortiguador delantero',
      categoria: 'Suspensión',
      marca: 'KYB',
      precio: 120.50,
      stock: 25,
      ubicacion: 'Estante A-12',
      pais_origen: 'Japón'
    });
    
    worksheet.addRow({
      descripcion: 'Filtro de aceite',
      categoria: 'Filtros',
      marca: 'Fram',
      precio: 15.75,
      stock: 50,
      ubicacion: 'Estante B-03',
      pais_origen: 'USA'
    });
    
    // Configurar respuesta
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=plantilla_productos.xlsx');
    
    // Enviar el archivo
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error al generar plantilla Excel:', error);
    res.status(500).json({ message: 'Error al generar plantilla Excel', error: error.message });
  }
});

module.exports = router;
