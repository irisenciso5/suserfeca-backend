/**
 * Script para actualizar las categorías existentes a categorías específicas 
 * para un negocio de repuestos de vehículos grandes
 */

const { sequelize, Categoria } = require('../models');

const updateCategorias = async () => {
  try {
    console.log('Actualizando categorías para negocio de repuestos de vehículos grandes...');
    
    // Eliminar categorías existentes que no corresponden al negocio
    await sequelize.query('DELETE FROM categorias');
    
    // Reiniciar el contador de autoincremento
    await sequelize.query('DELETE FROM sqlite_sequence WHERE name="categorias"');
    
    // Crear nuevas categorías específicas para repuestos de vehículos grandes
    const categorias = [
      { nombre: 'Motor' },
      { nombre: 'Transmisión' },
      { nombre: 'Sistema de Frenos' },
      { nombre: 'Sistema Eléctrico' },
      { nombre: 'Suspensión' },
      { nombre: 'Dirección' },
      { nombre: 'Filtros' },
      { nombre: 'Lubricantes' },
      { nombre: 'Carrocería' },
      { nombre: 'Refrigeración' },
      { nombre: 'Neumáticos y Ruedas' },
      { nombre: 'Sistema de Escape' },
      { nombre: 'Sistema Hidráulico' },
      { nombre: 'Sistema de Combustible' },
      { nombre: 'Herramientas Especializadas' }
    ];

    for (const categoria of categorias) {
      await Categoria.create(categoria);
      console.log(`Categoría ${categoria.nombre} creada`);
    }
    
    console.log('Categorías actualizadas correctamente');
    return true;
  } catch (error) {
    console.error('Error al actualizar categorías:', error);
    return false;
  }
};

// Si se ejecuta directamente este archivo
if (require.main === module) {
  updateCategorias()
    .then(() => {
      console.log('Proceso de actualización de categorías completado');
      process.exit(0);
    })
    .catch(error => {
      console.error('Error en el proceso de actualización de categorías:', error);
      process.exit(1);
    });
}

module.exports = updateCategorias;
