require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize, testConnection } = require('./config/database');
const path = require('path');
const initializeDatabase = require('./utils/init-db');
const { isDatabaseInitialized } = require('./utils/db-check');
const { swaggerDocs } = require('./docs/swagger');

// Importar rutas
const authRoutes = require('./routes/auth.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const categoriasRoutes = require('./routes/categorias.routes');
const marcasRoutes = require('./routes/marcas.routes');
const proveedoresRoutes = require('./routes/proveedores.routes');
const productosRoutes = require('./routes/productos.routes');
const inventarioRoutes = require('./routes/inventario.routes');
const comprasRoutes = require('./routes/compras.routes');
const clientesRoutes = require('./routes/clientes.routes');
const ventasRoutes = require('./routes/ventas.routes');
const configuracionRoutes = require('./routes/configuracion.routes');
const backupsRoutes = require('./routes/backups.routes');
const divisaRoutes = require('./routes/divisa.routes');
const modeloVehiculoRoutes = require('./routes/modelo_vehiculo.routes');
const rolesRoutes = require('./routes/roles.routes');

// Inicializar Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas estáticas para archivos públicos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/marcas', marcasRoutes);
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/compras', comprasRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/configuracion', configuracionRoutes);
app.use('/api/backups', backupsRoutes);
app.use('/api/divisas', divisaRoutes);
app.use('/api/modelos-vehiculos', modeloVehiculoRoutes);
app.use('/api/roles', rolesRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'API del Sistema de Inventario funcionando correctamente' });
});

// Iniciar servidor
const startServer = async () => {
  try {
    // Probar conexión a la base de datos
    const dbConnected = await testConnection();
    
    if (dbConnected) {
      // Inicializar base de datos con datos por defecto solo si es necesario
      await initializeDatabase();
      
      // Iniciar servidor
      app.listen(PORT, () => {
        console.log(`Servidor corriendo en el puerto ${PORT}`);
        
        // Configurar Swagger
        swaggerDocs(app);
      });
    } else {
      console.error('No se pudo iniciar el servidor debido a problemas con la base de datos');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Iniciar el servidor
startServer();
