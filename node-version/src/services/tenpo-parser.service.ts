import { addMonths, setDate, previousFriday, isSaturday, isSunday } from 'date-fns';

interface ParsedPurchase {
  purchaseDate: Date;
  merchant: string;
  amountTotalClp: number;
  installmentsCount: number;
}

interface ParsedPayment {
  payDate: Date;
  amountClp: number;
  paymentMethod: string;
  transactionCode: string;
  periodPay?: string;
  periodBill?: string;
}

export class TenpoParserService {
  
  /**
   * Parsea email de compra con TC Tenpo
   * Formato real del email:
   * "Monto transacción:
   *  $6.296
   *  Comercio:
   *  PAYU   *UBER TRIP      SANTIAGO      CHL
   *  Fecha:
   *  23-11-2024"
   */
  parsePurchaseEmail(body: string): ParsedPurchase | null {
    try {
      // Regex para fecha (dd-MM-yyyy)
      const dateMatch = body.match(/Fecha:\s*(\d{2})-(\d{2})-(\d{4})/i);
      if (!dateMatch) return null;

      const day = parseInt(dateMatch[1], 10);
      const month = parseInt(dateMatch[2], 10) - 1; // JS months are 0-indexed
      const year = parseInt(dateMatch[3], 10);
      const purchaseDate = new Date(year, month, day);

      // Regex para comercio (ahora busca con saltos de línea)
      const merchantMatch = body.match(/Comercio:\s*\n?\s*([^\n]+)/i);
      if (!merchantMatch) return null;
      const merchant = merchantMatch[1].trim();

      // Regex para monto (busca el primer $ seguido de números)
      const amountMatch = body.match(/\$\s*([\d.,]+)/);
      if (!amountMatch) return null;
      const amountTotalClp = parseFloat(amountMatch[1].replace(/\./g, '').replace(',', '.'));

      // Las compras TC Tenpo NO tienen campo "Cuotas" en el email
      // Son siempre 1 cuota (pago único). Igual buscamos por si acaso.
      const installmentsMatch = body.match(/Cuotas:\s*(\d+)/i);
      const installmentsCount = installmentsMatch ? parseInt(installmentsMatch[1], 10) : 1;

      return {
        purchaseDate,
        merchant,
        amountTotalClp,
        installmentsCount
      };
    } catch (error) {
      console.error('Error parseando compra:', error);
      return null;
    }
  }

  /**
   * Parsea email de pago TC Tenpo
   * Ejemplo texto real:
   * "Monto transacción:
   *  $457.449
   * 
   * Tipo de tarjeta:
   *  Crédito
   * 
   * Medio de pago:
   *  Cuenta Vista Tenpo
   * 
   * Fecha:
   *  29-12-2025
   * 
   * Hora:
   *  08:51:59
   * 
   * Código de transacción:
   *  27034497-d54e-4ad3-a6c0-b1b3a1420a50"
   */
  parsePaymentEmail(body: string): ParsedPayment | null {
    try {
      // Regex para monto - acepta formato con saltos de línea
      const amountMatch = body.match(/Monto\s+transacci[óo]n:\s*\n?\s*\$?\s*([\d.,]+)/i);
      if (!amountMatch) return null;
      const amountClp = parseFloat(amountMatch[1].replace(/\./g, '').replace(',', '.'));

      // Regex para fecha (dd-MM-yyyy) - acepta formato con saltos de línea
      const dateMatch = body.match(/Fecha:\s*\n?\s*(\d{2})-(\d{2})-(\d{4})/i);
      if (!dateMatch) return null;
      const day = parseInt(dateMatch[1], 10);
      const month = parseInt(dateMatch[2], 10) - 1;
      const year = parseInt(dateMatch[3], 10);
      
      // Regex para hora (HH:mm:ss) - acepta formato con saltos de línea
      const timeMatch = body.match(/Hora:\s*\n?\s*(\d{2}):(\d{2}):(\d{2})/i);
      let payDate: Date;
      if (timeMatch) {
        const hour = parseInt(timeMatch[1], 10);
        const minute = parseInt(timeMatch[2], 10);
        const second = parseInt(timeMatch[3], 10);
        payDate = new Date(year, month, day, hour, minute, second);
      } else {
        payDate = new Date(year, month, day);
      }

      // Regex para medio de pago - acepta formato con saltos de línea
      const methodMatch = body.match(/Medio\s+de\s+pago:\s*\n?\s*([^\n]+)/i);
      const paymentMethod = methodMatch ? methodMatch[1].trim() : 'Desconocido';

      // Regex para código de transacción - acepta formato con saltos de línea y UUIDs
      const codeMatch = body.match(/C[oó]digo\s+de\s+transacci[oó]n:\s*\n?\s*([a-z0-9\-]+)/i);
      const transactionCode = codeMatch ? codeMatch[1].trim() : '';

      // Intentar extraer periodo de pago y facturación (opcional)
      const periodPayMatch = body.match(/Periodo\s+de\s+pago:\s*\n?\s*([^\n]+)/i);
      const periodPay = periodPayMatch ? periodPayMatch[1].trim() : undefined;

      const periodBillMatch = body.match(/Periodo\s+de\s+facturaci[oó]n:\s*\n?\s*([^\n]+)/i);
      const periodBill = periodBillMatch ? periodBillMatch[1].trim() : undefined;

      return {
        payDate,
        amountClp,
        paymentMethod,
        transactionCode,
        periodPay,
        periodBill
      };
    } catch (error) {
      console.error('Error parseando pago:', error);
      return null;
    }
  }

  /**
   * Calcula fecha de vencimiento según reglas Tenpo:
   * - Cierre: día 21 del mes
   * - Vencimiento: día 5 del mes siguiente a la factura
   * - Si cae sábado/domingo, mover al viernes anterior
   */
  calculateDueDate(purchaseDate: Date): Date {
    const purchaseDay = purchaseDate.getDate();
    
    // Determinar mes de factura
    let billMonth: Date;
    if (purchaseDay <= 21) {
      // Factura del mismo mes
      billMonth = purchaseDate;
    } else {
      // Factura del mes siguiente
      billMonth = addMonths(purchaseDate, 1);
    }

    // Vencimiento: día 5 del mes siguiente a la factura
    let dueDate = setDate(addMonths(billMonth, 1), 5);

    // Ajustar si cae fin de semana
    if (isSaturday(dueDate) || isSunday(dueDate)) {
      dueDate = previousFriday(dueDate);
    }

    return dueDate;
  }

  /**
   * Calcula las cuotas con intereses si aplica
   * Interés mensual por defecto: 0% (sin interés)
   * Se puede override por cuota
   */
  calculateInstallments(
    purchase: ParsedPurchase,
    interestRateMonthly: number = 0
  ) {
    const { amountTotalClp, installmentsCount, purchaseDate } = purchase;
    const baseAmount = amountTotalClp / installmentsCount;

    const installments = [];
    for (let i = 1; i <= installmentsCount; i++) {
      const dueDate = this.calculateDueDate(addMonths(purchaseDate, i - 1));
      
      // Calcular monto con interés
      const interest = baseAmount * (interestRateMonthly / 100);
      const finalAmount = baseAmount + interest;

      installments.push({
        installmentNumber: i,
        baseAmountClp: baseAmount,
        dueDate,
        payDateEstimated: dueDate, // Por defecto igual al due date
        overrideInterestRate: null,
        overrideMonthlyAmountClp: null,
        finalMonthlyAmountClp: finalAmount
      });
    }

    return installments;
  }

  /**
   * Recalcula el monto final de una cuota según interés override
   */
  recalculateInstallmentAmount(
    baseAmountClp: number,
    overrideInterestRate: number | null,
    overrideMonthlyAmountClp: number | null
  ): number {
    // Si hay override de monto, usar ese
    if (overrideMonthlyAmountClp !== null) {
      return overrideMonthlyAmountClp;
    }

    // Si hay override de interés, calcular con ese interés
    if (overrideInterestRate !== null) {
      const interest = baseAmountClp * (overrideInterestRate / 100);
      return baseAmountClp + interest;
    }

    // Por defecto, sin interés
    return baseAmountClp;
  }
}

export const tenpoParserService = new TenpoParserService();
