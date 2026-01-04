import { Router, Request, Response } from 'express';
import prisma from '../db';
import { addMonths, addWeeks, addYears, parseISO } from 'date-fns';

const router = Router();

// GET all subscriptions
router.get('/', async (_req: Request, res: Response) => {
  try {
    const subscriptions = await prisma.subscription.findMany({
      include: { calendar: true },
      orderBy: { name: 'asc' }
    });
    res.json(subscriptions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// POST new subscription
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, price, periodicity, startDate } = req.body;
    const parsedDate = parseISO(startDate);

    // Ensure calendar entry exists
    let calendarEntry = await prisma.calendar.findUnique({
      where: { date: parsedDate }
    });

    if (!calendarEntry) {
      calendarEntry = await prisma.calendar.create({
        data: { date: parsedDate }
      });
    }

    const subscription = await prisma.subscription.create({
      data: {
        name,
        price: parseFloat(price),
        periodicity,
        startDate: parsedDate,
        startDateId: calendarEntry.id
      }
    });

    res.status(201).json(subscription);
  } catch (error) {
    res.status(400).json({ error: 'Invalid subscription data' });
  }
});

// PUT update subscription
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { name, price, periodicity, startDate } = req.body;
    const parsedDate = parseISO(startDate);

    // Ensure calendar entry exists
    let calendarEntry = await prisma.calendar.findUnique({
      where: { date: parsedDate }
    });
    if (!calendarEntry) {
      calendarEntry = await prisma.calendar.create({
        data: { date: parsedDate }
      });
    }

    const updated = await prisma.subscription.update({
      where: { id },
      data: {
        name,
        price: parseFloat(price),
        periodicity,
        startDate: parsedDate,
        startDateId: calendarEntry.id
      }
    });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: 'Error updating subscription' });
  }
});

// DELETE subscription
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.subscription.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.status(204).send();
  } catch (error) {
    res.status(404).json({ error: 'Subscription not found' });
  }
});

export default router;
