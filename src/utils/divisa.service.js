const { Divisa } = require('../models');

/**
 * Servicio para manejar operaciones relacionadas con divisas
 */
const DivisaService = {
  /**
   * Obtiene la divisa principal del sistema (VES)
   * @returns {Promise<Object>} Divisa principal
   */
  async getDivisaPrincipal() {
    try {
      return await Divisa.findOne({ where: { es_principal: true } });
    } catch (error) {
      console.error('Error al obtener divisa principal:', error);
      throw error;
    }
  },

  /**
   * Obtiene una divisa por su ID
   * @param {number} id - ID de la divisa
   * @returns {Promise<Object>} Divisa encontrada
   */
  async getDivisaById(id) {
    try {
      return await Divisa.findByPk(id);
    } catch (error) {
      console.error(`Error al obtener divisa con ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Obtiene una divisa por su código
   * @param {string} codigo - Código de la divisa (USD, EUR, etc.)
   * @returns {Promise<Object>} Divisa encontrada
   */
  async getDivisaByCodigo(codigo) {
    try {
      return await Divisa.findOne({ where: { codigo } });
    } catch (error) {
      console.error(`Error al obtener divisa con código ${codigo}:`, error);
      throw error;
    }
  },

  /**
   * Convierte un monto de una divisa a otra
   * @param {number} monto - Monto a convertir
   * @param {number|string} divisaOrigenId - ID o código de la divisa de origen
   * @param {number|string} divisaDestinoId - ID o código de la divisa de destino
   * @returns {Promise<Object>} Resultado de la conversión
   */
  async convertirMonto(monto, divisaOrigenId, divisaDestinoId) {
    try {
      if (!monto || isNaN(monto) || monto < 0) {
        throw new Error('El monto debe ser un número positivo o cero');
      }

      // Determinar si los parámetros son IDs o códigos
      let divisaOrigen, divisaDestino;
      
      if (typeof divisaOrigenId === 'string' && isNaN(parseInt(divisaOrigenId))) {
        divisaOrigen = await this.getDivisaByCodigo(divisaOrigenId);
      } else {
        divisaOrigen = await this.getDivisaById(divisaOrigenId);
      }
      
      if (typeof divisaDestinoId === 'string' && isNaN(parseInt(divisaDestinoId))) {
        divisaDestino = await this.getDivisaByCodigo(divisaDestinoId);
      } else {
        divisaDestino = await this.getDivisaById(divisaDestinoId);
      }

      if (!divisaOrigen || !divisaDestino) {
        throw new Error('Una o ambas divisas no fueron encontradas');
      }

      // Convertir a VES primero (si no es VES)
      let montoVES = monto;
      if (!divisaOrigen.es_principal) {
        montoVES = monto / divisaOrigen.tasa_cambio;
      }

      // Convertir de VES a la divisa destino (si no es VES)
      let montoFinal = montoVES;
      if (!divisaDestino.es_principal) {
        montoFinal = montoVES * divisaDestino.tasa_cambio;
      }

      // Calcular la tasa de cambio aplicada
      const tasaAplicada = divisaDestino.es_principal ? 
        (1 / divisaOrigen.tasa_cambio) : 
        (divisaOrigen.es_principal ? divisaDestino.tasa_cambio : (divisaDestino.tasa_cambio / divisaOrigen.tasa_cambio));

      return {
        monto_original: monto,
        divisa_origen: divisaOrigen.codigo,
        monto_convertido: montoFinal,
        divisa_destino: divisaDestino.codigo,
        tasa_aplicada: tasaAplicada
      };
    } catch (error) {
      console.error('Error al convertir monto entre divisas:', error);
      throw error;
    }
  },

  /**
   * Formatea un monto según la divisa especificada
   * @param {number} monto - Monto a formatear
   * @param {Object|string|number} divisa - Objeto divisa, código o ID de la divisa
   * @returns {Promise<string>} Monto formateado con el símbolo de la divisa
   */
  async formatearMonto(monto, divisa) {
    try {
      if (!monto && monto !== 0) {
        return '';
      }

      let divisaObj;
      
      if (typeof divisa === 'object' && divisa !== null) {
        divisaObj = divisa;
      } else if (typeof divisa === 'string' && isNaN(parseInt(divisa))) {
        divisaObj = await this.getDivisaByCodigo(divisa);
      } else {
        divisaObj = await this.getDivisaById(divisa);
      }

      if (!divisaObj) {
        throw new Error('Divisa no encontrada');
      }

      // Formatear el monto según la divisa
      const montoFormateado = new Intl.NumberFormat('es-ES', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(monto);

      // Posicionar el símbolo según la divisa
      if (divisaObj.codigo === 'EUR') {
        return `${montoFormateado} ${divisaObj.simbolo}`;
      } else {
        return `${divisaObj.simbolo} ${montoFormateado}`;
      }
    } catch (error) {
      console.error('Error al formatear monto:', error);
      return `${monto}`;
    }
  }
};

module.exports = DivisaService;
