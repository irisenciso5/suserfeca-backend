# Sistema de Gestión de Inventario, Compras y Ventas

Este sistema permite gestionar el inventario, compras y ventas de una empresa, con control de usuarios, productos, proveedores, clientes y más.

## Características

- Gestión de usuarios con roles (administrador, vendedor, consulta)
- Gestión de productos, categorías y marcas
- Gestión de proveedores y compras
- Gestión de clientes y ventas
- Reportes y estadísticas

## Requisitos

- Node.js 14.x o superior
- NPM 6.x o superior

## Instalación

1. Clonar el repositorio:
   ```
   git clone <url-del-repositorio>
   ```

2. Instalar dependencias:
   ```
   npm install
   ```

3. Configurar variables de entorno:
   - Crear un archivo `.env` en la raíz del proyecto con el siguiente contenido:
   ```
   PORT=3000
   JWT_SECRET=sistema_inventario_secret_key
   NODE_ENV=development
   ```

4. Iniciar el servidor:
   ```
   npm run dev
   ```

## Estructura del Proyecto

```
/
├── src/
│   ├── config/         # Configuración de la aplicación
│   ├── controllers/    # Controladores (lógica de negocio)
│   ├── middleware/     # Middleware (autenticación, validación)
│   ├── models/         # Modelos de datos (Sequelize)
│   ├── routes/         # Rutas de la API
│   ├── utils/          # Utilidades y funciones auxiliares
│   └── server.js       # Punto de entrada de la aplicación
├── database.sqlite     # Base de datos SQLite
├── backups/            # Directorio para respaldos de la base de datos
├── uploads/            # Directorio para archivos subidos
├── .env                # Variables de entorno
├── package.json        # Dependencias y scripts
└── README.md           # Documentación
```

## API Endpoints

### Autenticación

- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/perfil` - Obtener perfil del usuario autenticado
- `POST /api/auth/cambiar-password` - Cambiar contraseña

### Usuarios

- `GET /api/usuarios` - Obtener todos los usuarios (admin)
- `GET /api/usuarios/:id` - Obtener un usuario por ID (admin)
- `POST /api/usuarios` - Crear un nuevo usuario (admin)
- `PUT /api/usuarios/:id` - Actualizar un usuario (admin)
- `DELETE /api/usuarios/:id` - Eliminar un usuario (admin)

### Categorías

- `GET /api/categorias` - Obtener todas las categorías
- `GET /api/categorias/:id` - Obtener una categoría por ID
- `POST /api/categorias` - Crear una nueva categoría (vendedor/admin)
- `PUT /api/categorias/:id` - Actualizar una categoría (vendedor/admin)
- `DELETE /api/categorias/:id` - Eliminar una categoría (vendedor/admin)

### Marcas

- `GET /api/marcas` - Obtener todas las marcas
- `GET /api/marcas/:id` - Obtener una marca por ID
- `POST /api/marcas` - Crear una nueva marca (vendedor/admin)
- `PUT /api/marcas/:id` - Actualizar una marca (vendedor/admin)
- `DELETE /api/marcas/:id` - Eliminar una marca (vendedor/admin)

### Proveedores

- `GET /api/proveedores` - Obtener todos los proveedores
- `GET /api/proveedores/:id` - Obtener un proveedor por ID
- `GET /api/proveedores/:id/productos` - Obtener productos de un proveedor
- `POST /api/proveedores` - Crear un nuevo proveedor (vendedor/admin)
- `PUT /api/proveedores/:id` - Actualizar un proveedor (vendedor/admin)
- `POST /api/proveedores/:id/productos` - Asociar productos a un proveedor (vendedor/admin)
- `DELETE /api/proveedores/:id` - Eliminar un proveedor (vendedor/admin)

### Productos

- `GET /api/productos` - Obtener todos los productos (con filtros)
- `GET /api/productos/:id` - Obtener un producto por ID
- `POST /api/productos` - Crear un nuevo producto (vendedor/admin)
- `PUT /api/productos/:id` - Actualizar un producto (vendedor/admin)
- `DELETE /api/productos/:id` - Eliminar un producto (vendedor/admin)

### Inventario

- `GET /api/inventario` - Obtener todos los movimientos de inventario (con filtros)
- `GET /api/inventario/:id` - Obtener un movimiento por ID
- `POST /api/inventario` - Crear un nuevo movimiento de inventario (vendedor/admin)
- `GET /api/inventario/alertas/stock-bajo` - Obtener productos con stock bajo

### Compras

- `GET /api/compras` - Obtener todas las compras (con filtros)
- `GET /api/compras/:id` - Obtener una compra por ID
- `POST /api/compras` - Crear una nueva compra (vendedor/admin)
- `PUT /api/compras/:id/estado` - Actualizar estado de una compra (vendedor/admin)
- `DELETE /api/compras/:id` - Eliminar una compra (vendedor/admin)

### Clientes

- `GET /api/clientes` - Obtener todos los clientes (con filtros)
- `GET /api/clientes/:id` - Obtener un cliente por ID
- `GET /api/clientes/:id/ventas` - Obtener ventas de un cliente
- `POST /api/clientes` - Crear un nuevo cliente (vendedor/admin)
- `PUT /api/clientes/:id` - Actualizar un cliente (vendedor/admin)
- `DELETE /api/clientes/:id` - Eliminar un cliente (vendedor/admin)

### Ventas

- `GET /api/ventas` - Obtener todas las ventas (con filtros)
- `GET /api/ventas/:id` - Obtener una venta por ID
- `POST /api/ventas` - Crear una nueva venta (vendedor/admin)
- `POST /api/ventas/:id/anular` - Anular una venta (vendedor/admin)
- `GET /api/ventas/reportes/periodo` - Generar reporte de ventas por período

### Configuración

- `GET /api/configuracion` - Obtener configuración de la empresa
- `PUT /api/configuracion` - Actualizar configuración de la empresa (admin)

### Backups (solo desarrolladores)

- `GET /api/backups` - Obtener todos los backups (admin)
- `POST /api/backups` - Crear un nuevo backup (admin)
- `POST /api/backups/:id/restaurar` - Restaurar un backup (admin)
- `DELETE /api/backups/:id` - Eliminar un backup (admin)

## Usuario por defecto

Al iniciar la aplicación por primera vez, se crea un usuario administrador con las siguientes credenciales:

- Email: admin@sistema.com
- Contraseña: admin123

Se recomienda cambiar la contraseña después del primer inicio de sesión.

## Licencia

ISC
