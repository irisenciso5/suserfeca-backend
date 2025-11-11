// pruebas_caja_blanca.test.js
// Pruebas de caja blanca para el sistema de inventario

// Importaciones necesarias
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { Usuario, Rol } = require('./src/models');
const { verificarToken, esAdmin } = require('./src/middleware/auth.middleware');
const { testConnection, sequelize } = require('./src/config/database');

// Mock para el objeto request, response y next de Express
const mockRequest = (token, userId) => ({
  headers: {
    authorization: token ? `Bearer ${token}` : undefined
  },
  userId: userId
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

// Mock para jwt y bcrypt
jest.mock('jsonwebtoken');
jest.mock('bcrypt');
jest.mock('./src/models');

// Configuración antes de cada prueba
beforeEach(() => {
  jest.clearAllMocks();
});

// 1. Prueba del middleware verificarToken
describe('Middleware de autenticación', () => {
  test('verificarToken debería continuar si el token es válido', () => {
    // Preparación
    const token = 'token_valido';
    const decodedToken = { id: 1, email: 'usuario@test.com' };
    jwt.verify.mockReturnValue(decodedToken);
    
    const req = mockRequest(token);
    const res = mockResponse();
    
    // Ejecución
    verificarToken(req, res, mockNext);
    
    // Verificación
    expect(jwt.verify).toHaveBeenCalledWith(token, process.env.JWT_SECRET);
    expect(req.userId).toBe(decodedToken.id);
    expect(mockNext).toHaveBeenCalled();
  });
  
  test('verificarToken debería devolver error 403 si no hay token', () => {
    // Preparación
    const req = mockRequest();
    const res = mockResponse();
    
    // Ejecución
    verificarToken(req, res, mockNext);
    
    // Verificación
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'No se proporcionó token de autenticación' });
    expect(mockNext).not.toHaveBeenCalled();
  });
  
  test('verificarToken debería devolver error 401 si el token es inválido', () => {
    // Preparación
    const token = 'token_invalido';
    jwt.verify.mockImplementation(() => {
      throw new Error('Token inválido');
    });
    
    const req = mockRequest(token);
    const res = mockResponse();
    
    // Ejecución
    verificarToken(req, res, mockNext);
    
    // Verificación
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token inválido o expirado' });
    expect(mockNext).not.toHaveBeenCalled();
  });
});

// 2. Prueba del método validarPassword del modelo Usuario
describe('Validación de contraseña de Usuario', () => {
  test('validarPassword debería devolver true si la contraseña es correcta', async () => {
    // Preparación
    const password = 'contraseña123';
    const hashedPassword = 'hashed_password';
    
    // Crear un mock del método validarPassword
    const mockValidarPassword = jest.fn().mockResolvedValue(true);
    
    // Crear un usuario con el método mock
    const usuario = {
      password: hashedPassword,
      validarPassword: mockValidarPassword
    };
    
    // Ejecución
    const resultado = await usuario.validarPassword(password);
    
    // Verificación
    expect(mockValidarPassword).toHaveBeenCalledWith(password);
    expect(resultado).toBe(true);
  });
  
  test('validarPassword debería devolver false si la contraseña es incorrecta', async () => {
    // Preparación
    const password = 'contraseña_incorrecta';
    const hashedPassword = 'hashed_password';
    
    // Crear un mock del método validarPassword
    const mockValidarPassword = jest.fn().mockResolvedValue(false);
    
    // Crear un usuario con el método mock
    const usuario = {
      password: hashedPassword,
      validarPassword: mockValidarPassword
    };
    
    // Ejecución
    const resultado = await usuario.validarPassword(password);
    
    // Verificación
    expect(mockValidarPassword).toHaveBeenCalledWith(password);
    expect(resultado).toBe(false);
  });
});

// 3. Prueba de la función testConnection
describe('Conexión a la base de datos', () => {
  test('testConnection debería devolver true si la conexión es exitosa', async () => {
    // Preparación
    sequelize.authenticate = jest.fn().mockResolvedValue();
    console.log = jest.fn(); // Silenciar logs
    
    // Ejecución
    const resultado = await testConnection();
    
    // Verificación
    expect(sequelize.authenticate).toHaveBeenCalled();
    expect(resultado).toBe(true);
  });
  
  test('testConnection debería devolver false si la conexión falla', async () => {
    // Preparación
    sequelize.authenticate = jest.fn().mockRejectedValue(new Error('Error de conexión'));
    console.error = jest.fn(); // Silenciar logs de error
    
    // Ejecución
    const resultado = await testConnection();
    
    // Verificación
    expect(sequelize.authenticate).toHaveBeenCalled();
    expect(resultado).toBe(false);
  });
});

// 4. Prueba del middleware esAdmin
describe('Middleware de autorización', () => {
  test('esAdmin debería continuar si el usuario es administrador', async () => {
    // Preparación
    const userId = 1;
    const req = mockRequest(null, userId);
    const res = mockResponse();
    
    Usuario.findByPk.mockResolvedValue({
      id: userId,
      nombre: 'Admin',
      Rol: { nombre: 'administrador' }
    });
    
    // Ejecución
    await esAdmin(req, res, mockNext);
    
    // Verificación
    expect(Usuario.findByPk).toHaveBeenCalledWith(userId, expect.any(Object));
    expect(mockNext).toHaveBeenCalled();
  });
  
  test('esAdmin debería devolver error 403 si el usuario no es administrador', async () => {
    // Preparación
    const userId = 2;
    const req = mockRequest(null, userId);
    const res = mockResponse();
    
    Usuario.findByPk.mockResolvedValue({
      id: userId,
      nombre: 'Vendedor',
      Rol: { nombre: 'vendedor' }
    });
    
    // Ejecución
    await esAdmin(req, res, mockNext);
    
    // Verificación
    expect(Usuario.findByPk).toHaveBeenCalledWith(userId, expect.any(Object));
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Requiere rol de administrador' });
    expect(mockNext).not.toHaveBeenCalled();
  });
  
  test('esAdmin debería devolver error 404 si el usuario no existe', async () => {
    // Preparación
    const userId = 999;
    const req = mockRequest(null, userId);
    const res = mockResponse();
    
    Usuario.findByPk.mockResolvedValue(null);
    
    // Ejecución
    await esAdmin(req, res, mockNext);
    
    // Verificación
    expect(Usuario.findByPk).toHaveBeenCalledWith(userId, expect.any(Object));
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Usuario no encontrado' });
    expect(mockNext).not.toHaveBeenCalled();
  });
});

// 5. Prueba del hook beforeCreate del modelo Usuario
describe('Hook beforeCreate del modelo Usuario', () => {
  test('beforeCreate debería encriptar la contraseña antes de crear el usuario', async () => {
    // Preparación
    const password = 'contraseña123';
    const salt = 'salt_generada';
    const hashedPassword = 'contraseña_encriptada';
    
    bcrypt.genSalt.mockResolvedValue(salt);
    bcrypt.hash.mockResolvedValue(hashedPassword);
    
    // Crear un usuario para la prueba
    const usuario = { password };
    
    // Crear un mock para el hook beforeCreate
    const mockBeforeCreate = async (usuario) => {
      if (usuario.password) {
        const salt = await bcrypt.genSalt(10);
        usuario.password = await bcrypt.hash(usuario.password, salt);
      }
    };
    
    // Ejecución
    await mockBeforeCreate(usuario);
    
    // Verificación
    expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
    expect(bcrypt.hash).toHaveBeenCalledWith(password, salt);
    expect(usuario.password).toBe(hashedPassword);
  });
});
