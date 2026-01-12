import prisma from '../db';

/**
 * Servicio para gestionar la configuración de tasas de cuotas
 */
export class TenpoConfigService {
  /**
   * Obtiene la tasa mensual vigente en una fecha específica
   */
  async getTasaVigente(fecha: Date = new Date()): Promise<{ tasaMensual: number; cae: string | null } | null> {
    const tasa = await prisma.tenpoTasaCuotas.findFirst({
      where: {
        vigenteDesde: { lte: fecha },
        OR: [
          { vigenteHasta: null },
          { vigenteHasta: { gte: fecha } }
        ]
      },
      orderBy: { vigenteDesde: 'desc' }
    });

    if (!tasa) return null;

    return {
      tasaMensual: tasa.tasaMensual,
      cae: tasa.cae
    };
  }

  /**
   * Crea o actualiza la tasa mensual vigente
   * Cierra la tasa anterior automáticamente
   */
  async actualizarTasa(tasaMensual: number, cae: string | null, vigenteDesde: Date = new Date()) {
    // Cerrar tasa anterior si existe
    const tasaAnterior = await prisma.tenpoTasaCuotas.findFirst({
      where: {
        vigenteHasta: null
      },
      orderBy: { vigenteDesde: 'desc' }
    });

    if (tasaAnterior) {
      await prisma.tenpoTasaCuotas.update({
        where: { id: tasaAnterior.id },
        data: { vigenteHasta: vigenteDesde }
      });
    }

    // Crear nueva tasa
    return await prisma.tenpoTasaCuotas.create({
      data: {
        tasaMensual,
        cae,
        vigenteDesde
      }
    });
  }

  /**
   * Obtiene el historial completo de tasas
   */
  async getHistorialTasas() {
    return await prisma.tenpoTasaCuotas.findMany({
      orderBy: { vigenteDesde: 'desc' }
    });
  }

  /**
   * Inicializa la tasa por defecto si no existe ninguna
   */
  async inicializarTasaDefault() {
    const existente = await prisma.tenpoTasaCuotas.findFirst();
    
    if (!existente) {
      console.log('⚠️  No hay tasa configurada. Inicializando con 2.11% (valor típico Tenpo)');
      await this.actualizarTasa(0.0211, '28.4%', new Date('2024-01-01'));
    }
  }
}

export const tenpoConfigService = new TenpoConfigService();
