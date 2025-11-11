const { sequelize, ModeloVehiculo } = require('../models');

/**
 * Script para inicializar modelos de vehículos comunes en Venezuela
 */
async function initModelosVehiculos() {
  console.log('Inicializando modelos de vehículos comunes...');
  
  try {
    // Verificar si ya existen modelos de vehículos en la base de datos
    const count = await ModeloVehiculo.count();
    if (count > 0) {
      console.log('Los modelos de vehículos ya fueron inicializados anteriormente.');
      return;
    }
    
    // Lista de modelos de vehículos comunes en Venezuela
    const modelosVehiculos = [
      // Toyota
      { marca: 'Toyota', modelo: 'Corolla', anio_inicio: 1998, anio_fin: 2002, motor: '1.6L, 1.8L', observaciones: 'Modelos populares en Venezuela' },
      { marca: 'Toyota', modelo: 'Corolla', anio_inicio: 2003, anio_fin: 2008, motor: '1.6L, 1.8L', observaciones: 'Modelos populares en Venezuela' },
      { marca: 'Toyota', modelo: 'Corolla', anio_inicio: 2009, anio_fin: 2013, motor: '1.6L, 1.8L', observaciones: 'Modelos populares en Venezuela' },
      { marca: 'Toyota', modelo: 'Corolla', anio_inicio: 2014, anio_fin: 2019, motor: '1.6L, 1.8L', observaciones: 'Modelos populares en Venezuela' },
      { marca: 'Toyota', modelo: 'Yaris', anio_inicio: 2000, anio_fin: 2005, motor: '1.3L, 1.5L', observaciones: 'Modelos populares en Venezuela' },
      { marca: 'Toyota', modelo: 'Yaris', anio_inicio: 2006, anio_fin: 2011, motor: '1.3L, 1.5L', observaciones: 'Modelos populares en Venezuela' },
      { marca: 'Toyota', modelo: 'Yaris', anio_inicio: 2012, anio_fin: 2018, motor: '1.3L, 1.5L', observaciones: 'Modelos populares en Venezuela' },
      { marca: 'Toyota', modelo: 'Hilux', anio_inicio: 2005, anio_fin: 2015, motor: '2.7L, 3.0L Diesel', observaciones: 'Camioneta popular en Venezuela' },
      { marca: 'Toyota', modelo: 'Hilux', anio_inicio: 2016, anio_fin: null, motor: '2.7L, 2.8L Diesel', observaciones: 'Camioneta popular en Venezuela' },
      { marca: 'Toyota', modelo: '4Runner', anio_inicio: 2003, anio_fin: 2009, motor: '4.0L V6', observaciones: 'SUV popular en Venezuela' },
      { marca: 'Toyota', modelo: '4Runner', anio_inicio: 2010, anio_fin: 2020, motor: '4.0L V6', observaciones: 'SUV popular en Venezuela' },
      { marca: 'Toyota', modelo: 'Fortuner', anio_inicio: 2005, anio_fin: 2015, motor: '2.7L, 4.0L', observaciones: 'SUV popular en Venezuela' },
      { marca: 'Toyota', modelo: 'Fortuner', anio_inicio: 2016, anio_fin: null, motor: '2.7L, 2.8L Diesel', observaciones: 'SUV popular en Venezuela' },
      
      // Chevrolet
      { marca: 'Chevrolet', modelo: 'Aveo', anio_inicio: 2004, anio_fin: 2011, motor: '1.6L', observaciones: 'Muy común en Venezuela' },
      { marca: 'Chevrolet', modelo: 'Aveo', anio_inicio: 2012, anio_fin: 2018, motor: '1.6L', observaciones: 'Muy común en Venezuela' },
      { marca: 'Chevrolet', modelo: 'Optra', anio_inicio: 2004, anio_fin: 2010, motor: '1.8L', observaciones: 'Sedán popular en Venezuela' },
      { marca: 'Chevrolet', modelo: 'Spark', anio_inicio: 2005, anio_fin: 2010, motor: '1.0L', observaciones: 'Económico y popular en Venezuela' },
      { marca: 'Chevrolet', modelo: 'Spark', anio_inicio: 2011, anio_fin: 2018, motor: '1.0L, 1.2L', observaciones: 'Económico y popular en Venezuela' },
      { marca: 'Chevrolet', modelo: 'Cruze', anio_inicio: 2010, anio_fin: 2016, motor: '1.8L', observaciones: 'Sedán popular en Venezuela' },
      { marca: 'Chevrolet', modelo: 'Cruze', anio_inicio: 2017, anio_fin: null, motor: '1.4L Turbo', observaciones: 'Sedán popular en Venezuela' },
      { marca: 'Chevrolet', modelo: 'Captiva', anio_inicio: 2006, anio_fin: 2015, motor: '2.4L, 3.0L V6', observaciones: 'SUV popular en Venezuela' },
      { marca: 'Chevrolet', modelo: 'Captiva', anio_inicio: 2016, anio_fin: 2018, motor: '2.4L', observaciones: 'SUV popular en Venezuela' },
      
      // Ford
      { marca: 'Ford', modelo: 'Fiesta', anio_inicio: 2002, anio_fin: 2008, motor: '1.6L', observaciones: 'Compacto popular en Venezuela' },
      { marca: 'Ford', modelo: 'Fiesta', anio_inicio: 2009, anio_fin: 2019, motor: '1.6L', observaciones: 'Compacto popular en Venezuela' },
      { marca: 'Ford', modelo: 'Focus', anio_inicio: 2000, anio_fin: 2007, motor: '1.6L, 2.0L', observaciones: 'Sedán popular en Venezuela' },
      { marca: 'Ford', modelo: 'Focus', anio_inicio: 2008, anio_fin: 2018, motor: '1.6L, 2.0L', observaciones: 'Sedán popular en Venezuela' },
      { marca: 'Ford', modelo: 'Explorer', anio_inicio: 2002, anio_fin: 2010, motor: '4.0L V6', observaciones: 'SUV popular en Venezuela' },
      { marca: 'Ford', modelo: 'Explorer', anio_inicio: 2011, anio_fin: 2019, motor: '3.5L V6', observaciones: 'SUV popular en Venezuela' },
      { marca: 'Ford', modelo: 'F-150', anio_inicio: 2004, anio_fin: 2014, motor: '4.6L V8, 5.4L V8', observaciones: 'Camioneta popular en Venezuela' },
      { marca: 'Ford', modelo: 'F-150', anio_inicio: 2015, anio_fin: null, motor: '3.5L V6, 5.0L V8', observaciones: 'Camioneta popular en Venezuela' },
      
      // Hyundai
      { marca: 'Hyundai', modelo: 'Accent', anio_inicio: 2000, anio_fin: 2005, motor: '1.3L, 1.5L', observaciones: 'Sedán económico popular en Venezuela' },
      { marca: 'Hyundai', modelo: 'Accent', anio_inicio: 2006, anio_fin: 2010, motor: '1.4L, 1.6L', observaciones: 'Sedán económico popular en Venezuela' },
      { marca: 'Hyundai', modelo: 'Accent', anio_inicio: 2011, anio_fin: 2018, motor: '1.4L, 1.6L', observaciones: 'Sedán económico popular en Venezuela' },
      { marca: 'Hyundai', modelo: 'Elantra', anio_inicio: 2000, anio_fin: 2006, motor: '1.6L, 2.0L', observaciones: 'Sedán popular en Venezuela' },
      { marca: 'Hyundai', modelo: 'Elantra', anio_inicio: 2007, anio_fin: 2010, motor: '1.6L, 2.0L', observaciones: 'Sedán popular en Venezuela' },
      { marca: 'Hyundai', modelo: 'Elantra', anio_inicio: 2011, anio_fin: 2016, motor: '1.8L, 2.0L', observaciones: 'Sedán popular en Venezuela' },
      { marca: 'Hyundai', modelo: 'Elantra', anio_inicio: 2017, anio_fin: null, motor: '1.6L, 2.0L', observaciones: 'Sedán popular en Venezuela' },
      { marca: 'Hyundai', modelo: 'Tucson', anio_inicio: 2004, anio_fin: 2009, motor: '2.0L, 2.7L V6', observaciones: 'SUV popular en Venezuela' },
      { marca: 'Hyundai', modelo: 'Tucson', anio_inicio: 2010, anio_fin: 2015, motor: '2.0L, 2.4L', observaciones: 'SUV popular en Venezuela' },
      { marca: 'Hyundai', modelo: 'Tucson', anio_inicio: 2016, anio_fin: null, motor: '2.0L, 1.6L Turbo', observaciones: 'SUV popular en Venezuela' },
      { marca: 'Hyundai', modelo: 'Santa Fe', anio_inicio: 2006, anio_fin: 2012, motor: '2.4L, 2.7L V6', observaciones: 'SUV popular en Venezuela' },
      { marca: 'Hyundai', modelo: 'Santa Fe', anio_inicio: 2013, anio_fin: 2018, motor: '2.4L, 3.3L V6', observaciones: 'SUV popular en Venezuela' },
      
      // Kia
      { marca: 'Kia', modelo: 'Rio', anio_inicio: 2000, anio_fin: 2005, motor: '1.3L, 1.5L', observaciones: 'Compacto económico popular en Venezuela' },
      { marca: 'Kia', modelo: 'Rio', anio_inicio: 2006, anio_fin: 2011, motor: '1.4L, 1.6L', observaciones: 'Compacto económico popular en Venezuela' },
      { marca: 'Kia', modelo: 'Rio', anio_inicio: 2012, anio_fin: 2017, motor: '1.4L, 1.6L', observaciones: 'Compacto económico popular en Venezuela' },
      { marca: 'Kia', modelo: 'Sportage', anio_inicio: 2004, anio_fin: 2010, motor: '2.0L, 2.7L V6', observaciones: 'SUV popular en Venezuela' },
      { marca: 'Kia', modelo: 'Sportage', anio_inicio: 2011, anio_fin: 2016, motor: '2.0L, 2.4L', observaciones: 'SUV popular en Venezuela' },
      { marca: 'Kia', modelo: 'Sportage', anio_inicio: 2017, anio_fin: null, motor: '2.0L, 2.4L', observaciones: 'SUV popular en Venezuela' },
      { marca: 'Kia', modelo: 'Cerato', anio_inicio: 2004, anio_fin: 2008, motor: '1.6L, 2.0L', observaciones: 'Sedán popular en Venezuela' },
      { marca: 'Kia', modelo: 'Cerato', anio_inicio: 2009, anio_fin: 2013, motor: '1.6L, 2.0L', observaciones: 'Sedán popular en Venezuela' },
      { marca: 'Kia', modelo: 'Cerato', anio_inicio: 2014, anio_fin: 2018, motor: '1.6L, 2.0L', observaciones: 'Sedán popular en Venezuela' },
      
      // Mitsubishi
      { marca: 'Mitsubishi', modelo: 'Lancer', anio_inicio: 2000, anio_fin: 2007, motor: '1.6L, 2.0L', observaciones: 'Sedán popular en Venezuela' },
      { marca: 'Mitsubishi', modelo: 'Lancer', anio_inicio: 2008, anio_fin: 2017, motor: '1.6L, 2.0L', observaciones: 'Sedán popular en Venezuela' },
      { marca: 'Mitsubishi', modelo: 'Montero', anio_inicio: 2000, anio_fin: 2006, motor: '3.5L V6', observaciones: 'SUV popular en Venezuela' },
      { marca: 'Mitsubishi', modelo: 'Montero', anio_inicio: 2007, anio_fin: 2016, motor: '3.2L Diesel, 3.8L V6', observaciones: 'SUV popular en Venezuela' },
      { marca: 'Mitsubishi', modelo: 'L200', anio_inicio: 2005, anio_fin: 2014, motor: '2.5L Diesel', observaciones: 'Camioneta popular en Venezuela' },
      { marca: 'Mitsubishi', modelo: 'L200', anio_inicio: 2015, anio_fin: null, motor: '2.4L Diesel', observaciones: 'Camioneta popular en Venezuela' },
      
      // Nissan
      { marca: 'Nissan', modelo: 'Sentra', anio_inicio: 2000, anio_fin: 2006, motor: '1.6L, 1.8L', observaciones: 'Sedán popular en Venezuela' },
      { marca: 'Nissan', modelo: 'Sentra', anio_inicio: 2007, anio_fin: 2012, motor: '2.0L', observaciones: 'Sedán popular en Venezuela' },
      { marca: 'Nissan', modelo: 'Sentra', anio_inicio: 2013, anio_fin: 2019, motor: '1.8L', observaciones: 'Sedán popular en Venezuela' },
      { marca: 'Nissan', modelo: 'Tiida', anio_inicio: 2006, anio_fin: 2012, motor: '1.6L, 1.8L', observaciones: 'Compacto popular en Venezuela' },
      { marca: 'Nissan', modelo: 'Tiida', anio_inicio: 2013, anio_fin: 2018, motor: '1.6L, 1.8L', observaciones: 'Compacto popular en Venezuela' },
      { marca: 'Nissan', modelo: 'Frontier', anio_inicio: 2005, anio_fin: 2014, motor: '2.5L, 4.0L V6', observaciones: 'Camioneta popular en Venezuela' },
      { marca: 'Nissan', modelo: 'Frontier', anio_inicio: 2015, anio_fin: null, motor: '2.5L Diesel, 2.3L Turbo', observaciones: 'Camioneta popular en Venezuela' },
      { marca: 'Nissan', modelo: 'X-Trail', anio_inicio: 2001, anio_fin: 2007, motor: '2.0L, 2.5L', observaciones: 'SUV popular en Venezuela' },
      { marca: 'Nissan', modelo: 'X-Trail', anio_inicio: 2008, anio_fin: 2013, motor: '2.0L, 2.5L', observaciones: 'SUV popular en Venezuela' },
      { marca: 'Nissan', modelo: 'X-Trail', anio_inicio: 2014, anio_fin: null, motor: '2.0L, 2.5L', observaciones: 'SUV popular en Venezuela' },
      
      // Renault
      { marca: 'Renault', modelo: 'Clio', anio_inicio: 2000, anio_fin: 2005, motor: '1.2L, 1.6L', observaciones: 'Compacto popular en Venezuela' },
      { marca: 'Renault', modelo: 'Clio', anio_inicio: 2006, anio_fin: 2012, motor: '1.2L, 1.6L', observaciones: 'Compacto popular en Venezuela' },
      { marca: 'Renault', modelo: 'Logan', anio_inicio: 2005, anio_fin: 2012, motor: '1.4L, 1.6L', observaciones: 'Sedán económico popular en Venezuela' },
      { marca: 'Renault', modelo: 'Logan', anio_inicio: 2013, anio_fin: null, motor: '1.6L', observaciones: 'Sedán económico popular en Venezuela' },
      { marca: 'Renault', modelo: 'Sandero', anio_inicio: 2008, anio_fin: 2012, motor: '1.6L', observaciones: 'Hatchback popular en Venezuela' },
      { marca: 'Renault', modelo: 'Sandero', anio_inicio: 2013, anio_fin: null, motor: '1.6L', observaciones: 'Hatchback popular en Venezuela' },
      { marca: 'Renault', modelo: 'Duster', anio_inicio: 2010, anio_fin: 2017, motor: '1.6L, 2.0L', observaciones: 'SUV compacto popular en Venezuela' },
      { marca: 'Renault', modelo: 'Duster', anio_inicio: 2018, anio_fin: null, motor: '1.6L, 2.0L', observaciones: 'SUV compacto popular en Venezuela' },
      
      // Fiat
      { marca: 'Fiat', modelo: 'Palio', anio_inicio: 2000, anio_fin: 2011, motor: '1.3L, 1.6L', observaciones: 'Compacto popular en Venezuela' },
      { marca: 'Fiat', modelo: 'Palio', anio_inicio: 2012, anio_fin: 2018, motor: '1.4L, 1.6L', observaciones: 'Compacto popular en Venezuela' },
      { marca: 'Fiat', modelo: 'Siena', anio_inicio: 2000, anio_fin: 2010, motor: '1.3L, 1.6L', observaciones: 'Sedán económico popular en Venezuela' },
      { marca: 'Fiat', modelo: 'Siena', anio_inicio: 2011, anio_fin: 2017, motor: '1.4L, 1.6L', observaciones: 'Sedán económico popular en Venezuela' },
      
      // Volkswagen
      { marca: 'Volkswagen', modelo: 'Gol', anio_inicio: 2000, anio_fin: 2008, motor: '1.6L, 1.8L', observaciones: 'Compacto popular en Venezuela' },
      { marca: 'Volkswagen', modelo: 'Gol', anio_inicio: 2009, anio_fin: 2018, motor: '1.6L', observaciones: 'Compacto popular en Venezuela' },
      { marca: 'Volkswagen', modelo: 'Jetta', anio_inicio: 2000, anio_fin: 2005, motor: '2.0L', observaciones: 'Sedán popular en Venezuela' },
      { marca: 'Volkswagen', modelo: 'Jetta', anio_inicio: 2006, anio_fin: 2010, motor: '2.0L, 2.5L', observaciones: 'Sedán popular en Venezuela' },
      { marca: 'Volkswagen', modelo: 'Jetta', anio_inicio: 2011, anio_fin: 2018, motor: '2.0L, 2.5L', observaciones: 'Sedán popular en Venezuela' },
      { marca: 'Volkswagen', modelo: 'Bora', anio_inicio: 2006, anio_fin: 2010, motor: '2.0L, 2.5L', observaciones: 'Sedán popular en Venezuela' }
    ];
    
    // Insertar los modelos de vehículos en la base de datos
    await ModeloVehiculo.bulkCreate(modelosVehiculos);
    
    console.log(`Se han inicializado ${modelosVehiculos.length} modelos de vehículos comunes.`);
  } catch (error) {
    console.error('Error al inicializar modelos de vehículos:', error);
  } finally {
    // Cerrar la conexión a la base de datos
    await sequelize.close();
  }
}

// Si este script se ejecuta directamente
if (require.main === module) {
  // Ejecutar la función
  initModelosVehiculos()
    .then(() => {
      console.log('Proceso completado.');
      process.exit(0);
    })
    .catch(error => {
      console.error('Error en el proceso:', error);
      process.exit(1);
    });
} else {
  // Si se importa como módulo, exportar la función
  module.exports = { initModelosVehiculos };
}
