const { Divisa } = require('../models');

/**
 * Controlador para manejar las operaciones relacionadas con las divisas
 */
const DivisaController = {
  /**
   * Obtiene todas las divisas activas
   */
  async getAllDivisas(req, res) {
    try {
      const divisas = await Divisa.findAll({
        where: { activa: true },
        order: [['es_principal', 'DESC'], ['codigo', 'ASC']]
      });
      return res.json(divisas);
    } catch (error) {
      console.error('Error al obtener divisas:', error);
      return res.status(500).json({ message: 'Error al obtener divisas', error: error.message });
    }
  },

  /**
   * Obtiene una divisa por su ID
   */
  async getDivisaById(req, res) {
    const { id } = req.params;
    try {
      const divisa = await Divisa.findByPk(id);
      if (!divisa) {
        return res.status(404).json({ message: 'Divisa no encontrada' });
      }
      return res.json(divisa);
    } catch (error) {
      console.error(`Error al obtener divisa con ID ${id}:`, error);
      return res.status(500).json({ message: 'Error al obtener divisa', error: error.message });
    }
  },

  /**
   * Obtiene la divisa principal del sistema
   */
  async getDivisaPrincipal(req, res) {
    try {
      const divisaPrincipal = await Divisa.findOne({
        where: { es_principal: true }
      });
      
      if (!divisaPrincipal) {
        return res.status(404).json({ message: 'No se ha configurado una divisa principal' });
      }
      
      return res.json(divisaPrincipal);
    } catch (error) {
      console.error('Error al obtener divisa principal:', error);
      return res.status(500).json({ message: 'Error al obtener divisa principal', error: error.message });
    }
  },

  /**
   * Actualiza la tasa de cambio de una divisa
   */
  async updateTasaCambio(req, res) {
    const { id } = req.params;
    const { tasa_cambio } = req.body;
    
    if (!tasa_cambio || isNaN(tasa_cambio) || tasa_cambio <= 0) {
      return res.status(400).json({ message: 'La tasa de cambio debe ser un número positivo' });
    }
    
    try {
      const divisa = await Divisa.findByPk(id);
      
      if (!divisa) {
        return res.status(404).json({ message: 'Divisa no encontrada' });
      }
      
      // No permitir cambiar la tasa de la divisa principal (USD)
      if (divisa.es_principal) {
        return res.status(400).json({ message: 'No se puede modificar la tasa de cambio de la divisa principal' });
      }
      
      await divisa.update({
        tasa_cambio,
        ultima_actualizacion: new Date()
      });
      
      return res.json({
        message: `Tasa de cambio de ${divisa.nombre} actualizada correctamente`,
        divisa
      });
    } catch (error) {
      console.error(`Error al actualizar tasa de cambio de divisa con ID ${id}:`, error);
      return res.status(500).json({ message: 'Error al actualizar tasa de cambio', error: error.message });
    }
  },

  /**
   * Activa o desactiva una divisa
   */
  async toggleDivisaStatus(req, res) {
    const { id } = req.params;
    const { activa } = req.body;
    
    if (activa === undefined || typeof activa !== 'boolean') {
      return res.status(400).json({ message: 'El estado de activación debe ser un valor booleano' });
    }
    
    try {
      const divisa = await Divisa.findByPk(id);
      
      if (!divisa) {
        return res.status(404).json({ message: 'Divisa no encontrada' });
      }
      
      // No permitir desactivar la divisa principal
      if (divisa.es_principal && !activa) {
        return res.status(400).json({ message: 'No se puede desactivar la divisa principal' });
      }
      
      await divisa.update({ activa });
      
      return res.json({
        message: `Divisa ${divisa.nombre} ${activa ? 'activada' : 'desactivada'} correctamente`,
        divisa
      });
    } catch (error) {
      console.error(`Error al cambiar estado de divisa con ID ${id}:`, error);
      return res.status(500).json({ message: 'Error al cambiar estado de divisa', error: error.message });
    }
  },

  /**
   * Convierte un monto de una divisa a otra
   */
  async convertirMonto(req, res) {
    const { monto, divisa_origen_id, divisa_destino_id } = req.body;
    
    if (!monto || isNaN(monto) || monto < 0) {
      return res.status(400).json({ message: 'El monto debe ser un número positivo o cero' });
    }
    
    if (!divisa_origen_id || !divisa_destino_id) {
      return res.status(400).json({ message: 'Se requieren los IDs de las divisas de origen y destino' });
    }
    
    try {
      const divisaOrigen = await Divisa.findByPk(divisa_origen_id);
      const divisaDestino = await Divisa.findByPk(divisa_destino_id);
      
      if (!divisaOrigen || !divisaDestino) {
        return res.status(404).json({ message: 'Una o ambas divisas no fueron encontradas' });
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
      
      return res.json({
        monto_original: monto,
        divisa_origen: divisaOrigen.codigo,
        monto_convertido: montoFinal,
        divisa_destino: divisaDestino.codigo,
        tasa_aplicada: divisaDestino.es_principal ? 
          (1 / divisaOrigen.tasa_cambio) : 
          (divisaOrigen.es_principal ? divisaDestino.tasa_cambio : (divisaDestino.tasa_cambio / divisaOrigen.tasa_cambio))
      });
    } catch (error) {
      console.error('Error al convertir monto entre divisas:', error);
      return res.status(500).json({ message: 'Error al convertir monto', error: error.message });
    }
  }
};

module.exports = DivisaController;
