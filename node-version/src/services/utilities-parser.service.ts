import { addMonths, format } from 'date-fns';

interface ParsedUtility {
  transactionDate: Date;
  amount: number;
  description: string;
  metadata?: any;
}

export class UtilitiesParserService {
  
  /**
   * Parsea email de factura de servicios básicos (Luz, Agua, Gas, Internet, etc.)
   * 
   * Patrones comunes buscados:
   * - Monto: "$52.153", "$52,153", "Total: $52.153", "Monto a pagar: $52.153"
   * - Fecha: "25/02/2026", "25-02-2026", "Fecha emisión:", "Fecha vencimiento:"
   * - Número de factura, período de consumo, etc. (metadata)
   */
  parseUtilityEmail(body: string, emailDate: Date, providerKey: string): ParsedUtility | null {
    try {
      // 1. Buscar MONTO
      // Patrones: $52.153, $52,153, Total: $52.153, Monto a pagar: $52.153
      const amountPatterns: RegExp[] = [
        /(?:Total|Monto\s+a\s+pagar|Valor\s+a\s+pagar|Total\s+a\s+pagar)[\s:\-]*\$?\s*([\d.,]+)/gi,
        /\$\s*([\d]{1,3}(?:[.,]\d{3})*)/g, // $52.153 o $52,153
      ];

      let amount: number | null = null;
      
      for (const pattern of amountPatterns) {
        const matches = body.matchAll(pattern);
        for (const match of matches) {
          const rawAmount = match[1].replace(/\./g, '').replace(',', '');
          const parsedAmount = parseFloat(rawAmount);
          
          // Validar que el monto sea razonable (entre $1.000 y $10.000.000)
          if (parsedAmount >= 1000 && parsedAmount <= 10000000) {
            amount = parsedAmount;
            break;
          }
        }
        if (amount !== null) break;
      }

      if (amount === null) {
        console.warn(`⚠️  No se pudo extraer monto del email para ${providerKey}`);
        return null;
      }

      // 2. Buscar FECHA (PRIORIZAR VENCIMIENTO sobre emisión)
      let transactionDate: Date | null = null;

      // 2.1. PRIMERO buscar fecha de vencimiento (es la más relevante para gastos)
      const vencimientoPattern = /(?:Fecha\s+de\s+vencimiento|Vencimiento|Fecha\s+l[ií]mite\s+de\s+pago|Pagar\s+hasta)[\s:\-]*(\d{2})[\/\-](\d{2})[\/\-](\d{4})/gi;
      const vencimientoMatches = body.matchAll(vencimientoPattern);
      
      for (const match of vencimientoMatches) {
        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10) - 1; // JS months are 0-indexed
        const year = parseInt(match[3], 10);
        
        const parsedDate = new Date(year, month, day);
        const now = new Date();
        const sixMonthsFromNow = new Date();
        sixMonthsFromNow.setMonth(now.getMonth() + 6);
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(now.getFullYear() - 2);

        if (parsedDate >= twoYearsAgo && parsedDate <= sixMonthsFromNow) {
          transactionDate = parsedDate;
          console.log(`📅 Usando fecha de vencimiento: ${parsedDate.toLocaleDateString()}`);
          break;
        }
      }

      // 2.2. Si no encontramos vencimiento, buscar fecha de emisión
      if (transactionDate === null) {
        const emisionPattern = /(?:Fecha\s+emisi[óo]n|Fecha\s+de\s+emisi[óo]n|Emisi[óo]n)[\s:\-]*(\d{2})[\/\-](\d{2})[\/\-](\d{4})/gi;
        const emisionMatches = body.matchAll(emisionPattern);
        
        for (const match of emisionMatches) {
          const day = parseInt(match[1], 10);
          const month = parseInt(match[2], 10) - 1;
          const year = parseInt(match[3], 10);
          
          const parsedDate = new Date(year, month, day);
          const now = new Date();
          const sixMonthsFromNow = new Date();
          sixMonthsFromNow.setMonth(now.getMonth() + 6);
          const twoYearsAgo = new Date();
          twoYearsAgo.setFullYear(now.getFullYear() - 2);

          if (parsedDate >= twoYearsAgo && parsedDate <= sixMonthsFromNow) {
            transactionDate = parsedDate;
            console.log(`📅 Usando fecha de emisión: ${parsedDate.toLocaleDateString()}`);
            break;
          }
        }
      }

      // 2.3. Si no encontramos ninguna, buscar cualquier fecha en formato dd/mm/yyyy
      if (transactionDate === null) {
        const genericDatePattern = /(\d{2})[\/\-](\d{2})[\/\-](\d{4})/g;
        const genericMatches = body.matchAll(genericDatePattern);
        
        for (const match of genericMatches) {
          const day = parseInt(match[1], 10);
          const month = parseInt(match[2], 10) - 1;
          const year = parseInt(match[3], 10);
          
          const parsedDate = new Date(year, month, day);
          const now = new Date();
          const sixMonthsFromNow = new Date();
          sixMonthsFromNow.setMonth(now.getMonth() + 6);
          const twoYearsAgo = new Date();
          twoYearsAgo.setFullYear(now.getFullYear() - 2);

          if (parsedDate >= twoYearsAgo && parsedDate <= sixMonthsFromNow) {
            transactionDate = parsedDate;
            console.log(`📅 Usando fecha genérica encontrada: ${parsedDate.toLocaleDateString()}`);
            break;
          }
        }
      }

      // 2.4. Último recurso: fecha del email
      if (transactionDate === null) {
        console.warn(`⚠️  No se pudo extraer fecha del body para ${providerKey}, usando fecha del email`);
        transactionDate = emailDate;
      }

      // 3. Buscar METADATA opcional (número de factura, período, cliente, etc.)
      const metadata: any = {};

      // Número de factura
      const invoiceNumberMatch = body.match(/(?:N[úu]mero|Factura\s+N[°º]?|N[°º]\s+Factura)[\s:\-]*(\d+)/i);
      if (invoiceNumberMatch) {
        metadata.invoiceNumber = invoiceNumberMatch[1];
      }

      // Período de consumo
      const periodMatch = body.match(/(?:Per[íi]odo|Mes\s+de\s+consumo)[\s:\-]*([A-Za-zÀ-ÿ]+\s+\d{4})/i);
      if (periodMatch) {
        metadata.period = periodMatch[1];
      }

      // Cliente
      const clientMatch = body.match(/(?:Cliente|Nombre)[\s:\-]*([A-ZÀ-Ÿ][^\n]{5,50})/i);
      if (clientMatch) {
        metadata.clientName = clientMatch[1].trim();
      }

      // 4. Generar DESCRIPCIÓN
      const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const monthName = monthNames[transactionDate.getMonth()];
      const year = transactionDate.getFullYear();
      
      let description = `Factura ${providerKey} - ${monthName} ${year}`;
      if (metadata.invoiceNumber) {
        description += ` (N° ${metadata.invoiceNumber})`;
      }

      return {
        transactionDate,
        amount,
        description,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined
      };

    } catch (error) {
      console.error(`❌ Error parseando email de ${providerKey}:`, error);
      return null;
    }
  }

  /**
   * Parser específico para Aguas Andinas
   * Extrae campos adicionales: dirección, número de cuenta, período de facturación
   * 
   * Ejemplo de texto del correo:
   * "Dirección:
   *  LOS PLATANOS 2071-G 42, MACUL
   *  Número de Cuenta:
   *  662836-2
   *  Período de Facturación:
   *  20/01/2026 al 17/02/2026"
   * 
   * Regla de negocio:
   * - La boleta se paga el mes siguiente de la fecha period_end
   * - NO inventar día exacto de vencimiento si no aparece en el email
   * - Guardar campo "payMonth" (YYYY-MM) calculado desde period_end + 1 mes
   */
  parseAguasAndinasEmail(body: string, emailDate: Date): ParsedUtility | null {
    try {
      console.log('🚰 Parseando email de Aguas Andinas con patrón específico');

      // 1. Extraer DIRECCIÓN
      const addressMatch = body.match(/Direcci[óo]n:\s*\n?\s*([^\n]+)/i);
      const address = addressMatch ? addressMatch[1].trim() : undefined;

      // 2. Extraer NÚMERO DE CUENTA
      const accountMatch = body.match(/N[úu]mero\s+de\s+Cuenta:\s*\n?\s*([\d\-]+)/i);
      const accountNumber = accountMatch ? accountMatch[1].trim() : undefined;

      // 3. Extraer PERÍODO DE FACTURACIÓN (formato: dd/mm/yyyy al dd/mm/yyyy)
      const periodPattern = /Per[ií]odo\s+de\s+Facturaci[óo]n:\s*\n?\s*(\d{2})\/(\d{2})\/(\d{4})\s+al\s+(\d{2})\/(\d{2})\/(\d{4})/i;
      const periodMatch = body.match(periodPattern);

      let periodStart: string | undefined;
      let periodEnd: string | undefined;
      let payMonth: string | undefined;
      let transactionDate: Date | null = null;

      if (periodMatch) {
        const startDay = periodMatch[1];
        const startMonth = periodMatch[2];
        const startYear = periodMatch[3];
        const endDay = periodMatch[4];
        const endMonth = periodMatch[5];
        const endYear = periodMatch[6];

        periodStart = `${startDay}/${startMonth}/${startYear}`;
        periodEnd = `${endDay}/${endMonth}/${endYear}`;

        // Calcular payMonth: period_end + 1 mes
        const periodEndDate = new Date(
          parseInt(endYear),
          parseInt(endMonth) - 1,
          parseInt(endDay)
        );
        const payMonthDate = addMonths(periodEndDate, 1);
        payMonth = format(payMonthDate, 'yyyy-MM');

        // Usar payMonthDate como transactionDate (primer día del mes de pago)
        transactionDate = new Date(
          payMonthDate.getFullYear(),
          payMonthDate.getMonth(),
          1
        );

        console.log(`📅 Período: ${periodStart} al ${periodEnd} → Mes de pago: ${payMonth}`);
      }

      // 4. Extraer MONTO (reusar lógica genérica)
      const amountPatterns: RegExp[] = [
        /(?:Total|Monto\s+a\s+pagar|Valor\s+a\s+pagar|Total\s+a\s+pagar)[\s:\-]*\$?\s*([\d.,]+)/gi,
        /\$\s*([\d]{1,3}(?:[.,]\d{3})*)/g,
      ];

      let amount: number | null = null;
      
      for (const pattern of amountPatterns) {
        const matches = body.matchAll(pattern);
        for (const match of matches) {
          const rawAmount = match[1].replace(/\./g, '').replace(',', '');
          const parsedAmount = parseFloat(rawAmount);
          
          if (parsedAmount >= 1000 && parsedAmount <= 10000000) {
            amount = parsedAmount;
            break;
          }
        }
        if (amount !== null) break;
      }

      if (amount === null) {
        console.warn('⚠️  No se pudo extraer monto del email de Aguas Andinas');
        return null;
      }

      // Si no encontramos período, usar fecha del email como fallback
      if (!transactionDate) {
        console.warn('⚠️  No se pudo extraer período de facturación, usando fecha del email');
        transactionDate = emailDate;
      }

      // 5. Construir METADATA
      const metadata: any = {};
      if (address) metadata.address = address;
      if (accountNumber) metadata.accountNumber = accountNumber;
      if (periodStart) metadata.periodStart = periodStart;
      if (periodEnd) metadata.periodEnd = periodEnd;
      if (payMonth) metadata.payMonth = payMonth;

      // 6. Generar DESCRIPCIÓN
      const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const monthName = monthNames[transactionDate.getMonth()];
      const year = transactionDate.getFullYear();
      
      let description = `Factura Agua - ${monthName} ${year}`;
      if (accountNumber) {
        description += ` (Cuenta: ${accountNumber})`;
      }

      console.log(`✅ Aguas Andinas parseado: ${description} → $${amount.toLocaleString()}`);

      return {
        transactionDate,
        amount,
        description,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined
      };

    } catch (error) {
      console.error('❌ Error parseando email de Aguas Andinas:', error);
      return null;
    }
  }

  /**
   * Parsea múltiples emails y retorna las facturas parseadas exitosamente
   */
  parseMultipleEmails(
    messages: any[],
    extractBodyFn: (msg: any) => string,
    getDateFn: (msg: any) => Date,
    providerKey: string
  ): ParsedUtility[] {
    const parsed: ParsedUtility[] = [];

    for (const message of messages) {
      const body = extractBodyFn(message);
      const emailDate = getDateFn(message);
      
      // Usar parser específico para Aguas Andinas
      let result: ParsedUtility | null = null;
      if (providerKey.toLowerCase() === 'agua') {
        result = this.parseAguasAndinasEmail(body, emailDate);
      }

      // Si no hay parser específico o falló, usar el parser genérico
      if (!result) {
        result = this.parseUtilityEmail(body, emailDate, providerKey);
      }

      if (result) {
        // Agregar messageId y emailDate al metadata para evitar duplicados y tracking
        if (!result.metadata) result.metadata = {};
        result.metadata.gmailMessageId = message.id;
        result.metadata.emailDate = emailDate.toISOString();
        
        parsed.push(result);
      }
    }

    console.log(`✅ Parseados ${parsed.length}/${messages.length} emails de ${providerKey}`);
    return parsed;
  }
}

export const utilitiesParserService = new UtilitiesParserService();
