const { sequelize, Divisa, ConfiguracionEmpresa } = require('../models');

/**
 * Script para inicializar las divisas en la base de datos
 */
async function initDivisas() {
  console.log('Inicializando divisas...');
  
  try {
    // Verificar si ya existen divisas en la base de datos
    // Usamos findAndCountAll que es más tolerante si la tabla no existe aún
    let existingDivisas;
    try {
      existingDivisas = await Divisa.findAndCountAll();
      if (existingDivisas.count > 0) {
        console.log('Las divisas ya fueron inicializadas anteriormente.');
        console.log('Actualizando tasas de cambio...');
        // Actualizar las tasas de cambio de las divisas existentes
        await updateExchangeRates();
        return;
      }
    } catch (error) {
      console.log('La tabla de divisas no existe o está vacía. Creando divisas...');
    }

    // Crear las divisas principales
    const divisas = [
      {
        codigo: 'VES',
        nombre: 'Bolívar venezolano',
        simbolo: 'Bs.',
        tasa_cambio: 1.0, // Base: 1 VES = 1 VES (divisa principal)
        es_principal: true,
        activa: true
      },
      {
        codigo: 'USD',
        nombre: 'Dólar estadounidense',
        simbolo: '$',
        tasa_cambio: 0.00435, // 1 VES = 0.00435 USD (equivalente a 1 USD = 230 VES)
        es_principal: false,
        activa: true
      },
      {
        codigo: 'COP',
        nombre: 'Peso colombiano',
        simbolo: '$',
        tasa_cambio: 16.67, // 1 VES = 16.67 COP (equivalente a 1 COP = 0.06 VES)
        es_principal: false,
        activa: true
      },
      {
        codigo: 'EUR',
        nombre: 'Euro',
        simbolo: '€',
        tasa_cambio: 0.00374, // 1 VES = 0.00374 EUR (equivalente a 1 EUR = 267 VES)
        es_principal: false,
        activa: true
      }
    ];

    // Insertar las divisas en la base de datos
    await Divisa.bulkCreate(divisas);
    console.log('Divisas inicializadas correctamente.');

    // Obtener la divisa principal (VES)
    const divisaPrincipal = await Divisa.findOne({ where: { codigo: 'VES' } });
    
    // Actualizar la configuración de la empresa para usar VES como divisa principal
    await ConfiguracionEmpresa.findOrCreate({
      where: { id: 1 },
      defaults: {
        id: 1,
        nombre_empresa: 'Mi Empresa',
        divisa_principal_id: divisaPrincipal.id
      }
    });

    console.log('Configuración de divisa principal actualizada.');
  } catch (error) {
    console.error('Error al inicializar las divisas:', error);
  }
}

/**
 * Actualiza las tasas de cambio de las divisas existentes
 */
async function updateExchangeRates() {
  try {
    // Actualizar tasa de cambio del dólar
    await Divisa.update(
      { 
        tasa_cambio: 0.00435, // 1 VES = 0.00435 USD (equivalente a 1 USD = 230 VES)
        ultima_actualizacion: new Date() 
      },
      { where: { codigo: 'USD' } }
    );
    console.log('Tasa de cambio del dólar actualizada.');
    
    // Actualizar tasa de cambio del peso colombiano
    await Divisa.update(
      { 
        tasa_cambio: 16.67, // 1 VES = 16.67 COP (equivalente a 1 COP = 0.06 VES)
        ultima_actualizacion: new Date() 
      },
      { where: { codigo: 'COP' } }
    );
    console.log('Tasa de cambio del peso colombiano actualizada.');
    
    // Actualizar tasa de cambio del euro
    await Divisa.update(
      { 
        tasa_cambio: 0.00374, // 1 VES = 0.00374 EUR (equivalente a 1 EUR = 267 VES)
        ultima_actualizacion: new Date() 
      },
      { where: { codigo: 'EUR' } }
    );
    console.log('Tasa de cambio del euro actualizada.');
  } catch (error) {
    console.error('Error al actualizar tasas de cambio:', error);
  }
}

// Si este script se ejecuta directamente
if (require.main === module) {
  // Ejecutar la función
  initDivisas()
    .then(() => {
      console.log('Proceso completado.');
      process.exit(0);
    })
    .catch(error => {
      console.error('Error en el proceso:', error);
      process.exit(1);
    });
}

module.exports = { initDivisas };
