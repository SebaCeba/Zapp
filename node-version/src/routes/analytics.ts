import { Router, Request, Response } from 'express';
import prisma from '../db';
import { addMonths, addWeeks, addYears, isAfter, isBefore, startOfYear, endOfYear } from 'date-fns';
import { stringify } from 'csv-stringify/sync';

const router = Router();

// Calculate occurrences for a subscription in a given year
function* iterOccurrences(
  startDate: Date,
  periodicity: string,
  year: number
) {
  const fromDate = startOfYear(new Date(year, 0, 1));
  const toDate = endOfYear(new Date(year, 11, 31));
  
  let current = new Date(startDate);

  // Advance to first occurrence >= fromDate
  while (isBefore(current, fromDate)) {
    current = getNextOccurrence(current, periodicity);
  }

  while (!isAfter(current, toDate)) {
    if (!isBefore(current, fromDate)) {
      yield current;
    }
    current = getNextOccurrence(current, periodicity);
  }
}

function getNextOccurrence(date: Date, periodicity: string): Date {
  switch (periodicity) {
    case 'weekly':
      return addWeeks(date, 1);
    case 'monthly':
      return addMonths(date, 1);
    case 'quarterly':
      return addMonths(date, 3);
    case 'semiannual':
      return addMonths(date, 6);
    case 'annual':
      return addYears(date, 1);
    default:
      return addMonths(date, 1);
  }
}

// GET /api/analytics/year-data?year=2026
router.get('/year-data', async (req: Request, res: Response) => {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    
    const subscriptions = await prisma.subscription.findMany({
      include: { priceOverrides: true }
    });

    const monthlyTotals = new Array(12).fill(0);
    const monthlyCounts = new Array(12).fill(0);
    const perSubscription: any[] = [];
    const perSubscriptionMonthly: any[] = [];

    for (const sub of subscriptions) {
      const monthly = new Array(12).fill(0);
      const overridesMap = new Map<number, number>();
      
      sub.priceOverrides
        .filter(o => o.year === year)
        .forEach(o => overridesMap.set(o.month, o.price));

      for (const occ of iterOccurrences(sub.startDate, sub.periodicity, year)) {
        const monthIdx = occ.getMonth();
        const price = overridesMap.get(monthIdx + 1) || sub.price;
        
        monthly[monthIdx] += Math.round(price);
        monthlyCounts[monthIdx]++;
        monthlyTotals[monthIdx] += Math.round(price);
      }

      const total = monthly.reduce((sum, val) => sum + val, 0);
      perSubscription.push({ name: sub.name, total });
      perSubscriptionMonthly.push({ 
        id: sub.id, 
        name: sub.name, 
        monthly 
      });
    }

    const cumulative = monthlyTotals.reduce((acc: number[], val) => {
      const prev = acc.length > 0 ? acc[acc.length - 1] : 0;
      acc.push(prev + val);
      return acc;
    }, []);

    res.json({
      year,
      monthlyTotals,
      monthlyCounts,
      cumulative,
      perSubscription,
      perSubscriptionMonthly
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate analytics' });
  }
});

// POST /api/analytics/set-override
router.post('/set-override', async (req: Request, res: Response) => {
  try {
    const { subscription_id, year, month, price } = req.body;
    
    await prisma.priceOverride.upsert({
      where: {
        subscriptionId_year_month: {
          subscriptionId: parseInt(subscription_id),
          year: parseInt(year),
          month: parseInt(month)
        }
      },
      update: { price: parseFloat(price) },
      create: {
        subscriptionId: parseInt(subscription_id),
        year: parseInt(year),
        month: parseInt(month),
        price: parseFloat(price)
      }
    });

    res.json({ ok: true });
  } catch (error) {
    res.status(400).json({ ok: false, error: 'Invalid override data' });
  }
});

// GET /api/analytics/download-csv?year=2026
router.get('/download-csv', async (req: Request, res: Response) => {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    
    const subscriptions = await prisma.subscription.findMany();
    
    const records: any[] = [];
    records.push(['subscription_name', 'date', 'price', 'periodicity']);

    for (const sub of subscriptions) {
      for (const occ of iterOccurrences(sub.startDate, sub.periodicity, year)) {
        records.push([
          sub.name,
          occ.toISOString().split('T')[0],
          sub.price.toFixed(2).replace('.', ','),
          sub.periodicity
        ]);
      }
    }

    const csv = stringify(records, { delimiter: ';' });
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="planificacion_${year}.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate CSV' });
  }
});

export default router;
