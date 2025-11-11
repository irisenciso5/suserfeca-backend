/**
 * Script para actualizar las marcas existentes a marcas específicas 
 * para un negocio de repuestos de vehículos grandes
 */

const { sequelize, Marca } = require('../models');

const updateMarcas = async () => {
  try {
    console.log('Actualizando marcas para negocio de repuestos de vehículos grandes...');
    
    // Eliminar marcas existentes que no corresponden al negocio
    await sequelize.query('DELETE FROM marcas');
    
    // Reiniciar el contador de autoincremento
    await sequelize.query('DELETE FROM sqlite_sequence WHERE name="marcas"');
    
    // Crear nuevas marcas específicas para repuestos de vehículos grandes
    const marcas = [
      // Fabricantes de camiones y maquinaria pesada
      { nombre: 'Caterpillar' },
      { nombre: 'Cummins' },
      { nombre: 'Detroit Diesel' },
      { nombre: 'Volvo' },
      { nombre: 'Mercedes-Benz' },
      { nombre: 'MAN' },
      { nombre: 'Scania' },
      { nombre: 'Kenworth' },
      { nombre: 'Mack' },
      { nombre: 'Freightliner' },
      { nombre: 'International' },
      { nombre: 'Iveco' },
      { nombre: 'DAF' },
      { nombre: 'Peterbilt' },
      { nombre: 'Western Star' },
      
      // Fabricantes de componentes y repuestos
      { nombre: 'Bosch' },
      { nombre: 'SKF' },
      { nombre: 'Fleetguard' },
      { nombre: 'Baldwin' },
      { nombre: 'Wabco' },
      { nombre: 'ZF' },
      { nombre: 'Eaton' },
      { nombre: 'Dana' },
      { nombre: 'Meritor' },
      { nombre: 'Timken' },
      { nombre: 'Federal-Mogul' },
      { nombre: 'Donaldson' },
      { nombre: 'Bendix' },
      { nombre: 'Haldex' },
      { nombre: 'Parker' }
    ];

    for (const marca of marcas) {
      await Marca.create(marca);
      console.log(`Marca ${marca.nombre} creada`);
    }
    
    console.log('Marcas actualizadas correctamente');
    return true;
  } catch (error) {
    console.error('Error al actualizar marcas:', error);
    return false;
  }
};

// Si se ejecuta directamente este archivo
if (require.main === module) {
  updateMarcas()
    .then(() => {
      console.log('Proceso de actualización de marcas completado');
      process.exit(0);
    })
    .catch(error => {
      console.error('Error en el proceso de actualización de marcas:', error);
      process.exit(1);
    });
}

module.exports = updateMarcas;
