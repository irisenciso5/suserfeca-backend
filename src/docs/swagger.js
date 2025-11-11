const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Opciones de configuración de Swagger
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Sistema de Gestión de Inventario',
      version: '1.0.0',
      description: 'Documentación de la API para el Sistema de Gestión de Inventario, Compras y Ventas',
      contact: {
        name: 'Soporte',
        email: 'soporte@sistema.com'
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de desarrollo'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './src/docs/*.yaml',
    './src/docs/*.js',
    './src/routes/*.js'
  ]
};

// Generar especificación Swagger
const swaggerSpec = swaggerJsdoc(options);

// Función para configurar Swagger en Express
const swaggerDocs = (app) => {
  // Ruta para la documentación Swagger
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  
  // Ruta para obtener la especificación Swagger en formato JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
  
  console.log('Documentación Swagger disponible en /api-docs');
};

module.exports = { swaggerDocs };
