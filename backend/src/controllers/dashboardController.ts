import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import dayjs from 'dayjs';
import User from '../models/User';
import Purchase from '../models/Purchase';
import Sale from '../models/Sale';
import Expense from '../models/Expense';
import StockSummary from '../models/StockSummary';
import { AuthRequest } from '../middleware/auth';
import { getOrSetCache } from '../utils/simpleCache';

const CACHE_TTL_MS = 25_000;

// Helper to sum a field in a collection based on date match
async function sumField(
  model: any,
  field: string,
  dateField: string,
  startDate: Date,
  endDate: Date,
  additionalMatch = {}
): Promise<number> {
  const result = await model.aggregate([
    {
      $match: {
        [dateField]: { $gte: startDate, $lte: endDate },
        ...additionalMatch,
      },
    },
    { $group: { _id: null, total: { $sum: `$${field}` } } },
  ]);
  return result[0]?.total || 0;
}

// Helper to get total sum of a field from beginning of time
async function sumTotalField(model: any, field: string, additionalMatch = {}): Promise<number> {
  const result = await model.aggregate([
    { $match: additionalMatch },
    { $group: { _id: null, total: { $sum: `$${field}` } } },
  ]);
  return result[0]?.total || 0;
}

// Groups a collection by day/month in a single aggregation, returning a map keyed by the date-string bucket
async function groupByDateBucket(
  model: any,
  dateField: string,
  sumSpecs: Record<string, string>,
  format: string,
  startDate: Date,
  endDate: Date,
  additionalMatch = {}
): Promise<Map<string, Record<string, number>>> {
  const groupStage: any = { _id: { $dateToString: { format, date: `$${dateField}` } } };
  for (const [outKey, srcField] of Object.entries(sumSpecs)) {
    groupStage[outKey] = { $sum: `$${srcField}` };
  }

  const results = await model.aggregate([
    { $match: { [dateField]: { $gte: startDate, $lte: endDate }, ...additionalMatch } },
    { $group: groupStage },
  ]);

  const map = new Map<string, Record<string, number>>();
  for (const r of results) {
    map.set(r._id, r);
  }
  return map;
}

export const getAdminStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stats = await getOrSetCache('admin:stats', CACHE_TTL_MS, async () => {
      const todayStart = dayjs().startOf('day').toDate();
      const todayEnd = dayjs().endOf('day').toDate();
      const monthStart = dayjs().startOf('month').toDate();
      const monthEnd = dayjs().endOf('month').toDate();

      const [
        stockDoc,
        todayPurchasesQty,
        todaySalesQty,
        todayExpensesAmount,
        totalPurchaseAmount,
        totalSalesAmount,
        totalExpenseAmount,
        thisMonthPurchaseTotal,
        thisMonthSalesTotal,
        thisMonthExpenseTotal,
        activeUsersCount,
      ] = await Promise.all([
        StockSummary.findOne(),
        sumField(Purchase, 'quantity', 'purchaseDate', todayStart, todayEnd),
        sumField(Sale, 'quantity', 'salesDate', todayStart, todayEnd),
        sumField(Expense, 'amount', 'expenseDate', todayStart, todayEnd),
        sumTotalField(Purchase, 'totalAmount'),
        sumTotalField(Sale, 'totalSaleAmount'),
        sumTotalField(Expense, 'amount'),
        sumField(Purchase, 'totalAmount', 'purchaseDate', monthStart, monthEnd),
        sumField(Sale, 'totalSaleAmount', 'salesDate', monthStart, monthEnd),
        sumField(Expense, 'amount', 'expenseDate', monthStart, monthEnd),
        User.countDocuments({ status: 'ACTIVE' }),
      ]);

      const netBusinessSummary = totalSalesAmount - totalPurchaseAmount - totalExpenseAmount;

      return {
        currentStock: stockDoc?.currentStock || 0,
        todayPurchasesQty,
        todaySalesQty,
        todayExpensesAmount,
        totalPurchaseAmount,
        totalSalesAmount,
        totalExpenseAmount,
        thisMonthPurchaseTotal,
        thisMonthSalesTotal,
        thisMonthExpenseTotal,
        netBusinessSummary,
        activeUsersCount,
      };
    });

    return res.status(200).json({ success: true, stats });
  } catch (error) {
    next(error);
  }
};

export const getAdminTrends = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const trends = await getOrSetCache('admin:trends:7d', CACHE_TTL_MS, async () => {
      const startDate = dayjs().subtract(6, 'day').startOf('day').toDate();
      const endDate = dayjs().endOf('day').toDate();

      const [purchaseMap, salesMap, expenseMap] = await Promise.all([
        groupByDateBucket(Purchase, 'purchaseDate', { quantity: 'quantity', amount: 'totalAmount' }, '%Y-%m-%d', startDate, endDate),
        groupByDateBucket(Sale, 'salesDate', { quantity: 'quantity', amount: 'totalSaleAmount' }, '%Y-%m-%d', startDate, endDate),
        groupByDateBucket(Expense, 'expenseDate', { amount: 'amount' }, '%Y-%m-%d', startDate, endDate),
      ]);

      const purchaseTrend: any[] = [];
      const salesTrend: any[] = [];
      const expenseTrend: any[] = [];
      const profitTrend: any[] = [];

      for (let i = 6; i >= 0; i--) {
        const d = dayjs().subtract(i, 'day');
        const key = d.format('YYYY-MM-DD');
        const label = d.format('MMM DD');

        const p = purchaseMap.get(key) || { quantity: 0, amount: 0 };
        const s = salesMap.get(key) || { quantity: 0, amount: 0 };
        const e = expenseMap.get(key) || { amount: 0 };

        purchaseTrend.push({ date: label, quantity: p.quantity || 0 });
        salesTrend.push({ date: label, quantity: s.quantity || 0 });
        expenseTrend.push({ date: label, amount: e.amount || 0 });
        profitTrend.push({ date: label, profit: (s.amount || 0) - (p.amount || 0) - (e.amount || 0) });
      }

      return { purchaseTrend, salesTrend, expenseTrend, profitTrend };
    });

    return res.status(200).json({ success: true, trends });
  } catch (error) {
    next(error);
  }
};

export const getAdminMonthlySummary = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const monthly = await getOrSetCache('admin:monthly-summary', CACHE_TTL_MS, async () => {
      const startDate = dayjs().subtract(5, 'month').startOf('month').toDate();
      const endDate = dayjs().endOf('month').toDate();

      const [purchaseMap, salesMap, expenseMap] = await Promise.all([
        groupByDateBucket(Purchase, 'purchaseDate', { amount: 'totalAmount' }, '%Y-%m', startDate, endDate),
        groupByDateBucket(Sale, 'salesDate', { amount: 'totalSaleAmount' }, '%Y-%m', startDate, endDate),
        groupByDateBucket(Expense, 'expenseDate', { amount: 'amount' }, '%Y-%m', startDate, endDate),
      ]);

      const monthlySummary: any[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = dayjs().subtract(i, 'month');
        const key = d.format('YYYY-MM');
        const label = d.format('MMM YYYY');

        const purchases = purchaseMap.get(key)?.amount || 0;
        const sales = salesMap.get(key)?.amount || 0;
        const expenses = expenseMap.get(key)?.amount || 0;

        monthlySummary.push({ month: label, purchases, sales, expenses, profit: sales - purchases - expenses });
      }

      return monthlySummary;
    });

    return res.status(200).json({ success: true, monthly });
  } catch (error) {
    next(error);
  }
};

export const getAdminExpenseBreakdown = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const topExpenses = await getOrSetCache('admin:expense-breakdown', CACHE_TTL_MS, async () => {
      const monthStart = dayjs().startOf('month').toDate();
      const monthEnd = dayjs().endOf('month').toDate();

      let result = await Expense.aggregate([
        { $match: { expenseDate: { $gte: monthStart, $lte: monthEnd } } },
        { $group: { _id: '$category', totalAmount: { $sum: '$amount' } } },
        { $sort: { totalAmount: -1 } },
        { $limit: 5 },
      ]);

      if (result.length === 0) {
        result = await Expense.aggregate([
          { $group: { _id: '$category', totalAmount: { $sum: '$amount' } } },
          { $sort: { totalAmount: -1 } },
          { $limit: 5 },
        ]);
      }

      return result;
    });

    return res.status(200).json({ success: true, topExpenses });
  } catch (error) {
    next(error);
  }
};

export const getManagerStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const stats = await getOrSetCache(`manager:stats:${userId}`, CACHE_TTL_MS, async () => {
      const todayStart = dayjs().startOf('day').toDate();
      const todayEnd = dayjs().endOf('day').toDate();

      const [stockDoc, todayPurchaseTotal, todaySalesTotal, todayExpenses] = await Promise.all([
        StockSummary.findOne(),
        sumField(Purchase, 'totalAmount', 'purchaseDate', todayStart, todayEnd, { createdBy: userId }),
        sumField(Sale, 'totalSaleAmount', 'salesDate', todayStart, todayEnd, { createdBy: userId }),
        sumField(Expense, 'amount', 'expenseDate', todayStart, todayEnd, { createdBy: userId }),
      ]);

      return {
        currentStock: stockDoc?.currentStock || 0,
        todayPurchaseTotal,
        todaySalesTotal,
        todayExpenses,
      };
    });

    return res.status(200).json({ success: true, stats });
  } catch (error) {
    next(error);
  }
};

export const getManagerTrends = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const trends = await getOrSetCache(`manager:trends:${userId}`, CACHE_TTL_MS, async () => {
      const startDate = dayjs().subtract(6, 'day').startOf('day').toDate();
      const endDate = dayjs().endOf('day').toDate();
      const match = { createdBy: userId };

      const [purchaseMap, salesMap, expenseMap] = await Promise.all([
        groupByDateBucket(Purchase, 'purchaseDate', { amount: 'totalAmount' }, '%Y-%m-%d', startDate, endDate, match),
        groupByDateBucket(Sale, 'salesDate', { amount: 'totalSaleAmount' }, '%Y-%m-%d', startDate, endDate, match),
        groupByDateBucket(Expense, 'expenseDate', { amount: 'amount' }, '%Y-%m-%d', startDate, endDate, match),
      ]);

      const trend: any[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = dayjs().subtract(i, 'day');
        const key = d.format('YYYY-MM-DD');
        const label = d.format('MMM DD');

        trend.push({
          date: label,
          purchases: purchaseMap.get(key)?.amount || 0,
          sales: salesMap.get(key)?.amount || 0,
          expenses: expenseMap.get(key)?.amount || 0,
        });
      }

      return trend;
    });

    return res.status(200).json({ success: true, trend: trends });
  } catch (error) {
    next(error);
  }
};

export const getManagerRecentEntries = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const [recentPurchases, recentSales, recentExpenses] = await Promise.all([
      Purchase.find({ createdBy: userId }).sort({ purchaseDate: -1, createdAt: -1 }).limit(3),
      Sale.find({ createdBy: userId }).sort({ salesDate: -1, createdAt: -1 }).limit(3),
      Expense.find({ createdBy: userId }).sort({ expenseDate: -1, createdAt: -1 }).limit(3),
    ]);

    const feed = [
      ...recentPurchases.map((p) => ({
        id: p._id,
        type: 'PURCHASE',
        ref: p.referenceNumber,
        date: p.purchaseDate,
        party: p.supplierName,
        amount: p.totalAmount,
        createdAt: p.createdAt,
      })),
      ...recentSales.map((s) => ({
        id: s._id,
        type: 'SALE',
        ref: s.invoiceNumber,
        date: s.salesDate,
        party: s.buyerName,
        amount: s.totalSaleAmount,
        createdAt: s.createdAt,
      })),
      ...recentExpenses.map((e) => ({
        id: e._id,
        type: 'EXPENSE',
        ref: e.voucherNumber,
        date: e.expenseDate,
        party: e.spentFor,
        amount: e.amount,
        createdAt: e.createdAt,
      })),
    ];

    feed.sort((a, b) => dayjs(b.date).unix() - dayjs(a.date).unix() || dayjs(b.createdAt).unix() - dayjs(a.createdAt).unix());
    const recentEntries = feed.slice(0, 5);

    return res.status(200).json({ success: true, recentEntries });
  } catch (error) {
    next(error);
  }
};

export const getMISDashboardData = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { fromDate, toDate, creator } = req.query;

    // Parse date filters or set defaults to last 30 days
    const start = fromDate ? dayjs(fromDate as string).startOf('day') : dayjs().subtract(30, 'day').startOf('day');
    const end = toDate ? dayjs(toDate as string).endOf('day') : dayjs().endOf('day');

    const startDate = start.toDate();
    const endDate = end.toDate();

    // Determine matcher by role
    let creatorFilter: any = {};
    if (req.user?.role === 'MANAGER') {
      creatorFilter = { createdBy: new mongoose.Types.ObjectId((req.user as any)._id) };
    } else if (req.user?.role === 'ADMIN' && creator) {
      creatorFilter = { createdBy: new mongoose.Types.ObjectId(creator as string) };
    }

    const purchaseMatch = { purchaseDate: { $gte: startDate, $lte: endDate }, ...creatorFilter };
    const salesMatch = { salesDate: { $gte: startDate, $lte: endDate }, ...creatorFilter };
    const expenseMatch = { expenseDate: { $gte: startDate, $lte: endDate }, ...creatorFilter };

    const diffDays = end.diff(start, 'day');
    const isDaily = diffDays <= 31;
    const format = isDaily ? '%Y-%m-%d' : '%Y-%m';

    // Execute queries in parallel using Promise.all
    const [
      purchaseGroup,
      salesGroup,
      expenseGroup,
      expenseCategories,
      managersList
    ] = await Promise.all([
      Purchase.aggregate([
        { $match: purchaseMatch },
        {
          $group: {
            _id: { $dateToString: { format, date: '$purchaseDate' } },
            totalQuantity: { $sum: '$quantity' },
            totalCost: { $sum: '$totalAmount' }
          }
        }
      ]),
      Sale.aggregate([
        { $match: salesMatch },
        {
          $group: {
            _id: { $dateToString: { format, date: '$salesDate' } },
            totalQuantity: { $sum: '$quantity' },
            totalRevenue: { $sum: '$totalSaleAmount' }
          }
        }
      ]),
      Expense.aggregate([
        { $match: expenseMatch },
        {
          $group: {
            _id: { $dateToString: { format, date: '$expenseDate' } },
            totalExpense: { $sum: '$amount' }
          }
        }
      ]),
      Expense.aggregate([
        { $match: expenseMatch },
        {
          $group: {
            _id: '$category',
            totalAmount: { $sum: '$amount' }
          }
        },
        { $sort: { totalAmount: -1 } }
      ]),
      req.user?.role === 'ADMIN' ? User.find({ role: 'MANAGER' }, 'name username') : Promise.resolve([])
    ]);

    // Merge groupings by date bucket
    const bucketMap: Record<string, {
      date: string;
      inwardQty: number;
      outwardQty: number;
      cost: number;
      revenue: number;
      expenses: number;
      profit: number;
    }> = {};

    purchaseGroup.forEach(g => {
      const b = g._id;
      if (b) {
        if (!bucketMap[b]) {
          bucketMap[b] = { date: b, inwardQty: 0, outwardQty: 0, cost: 0, revenue: 0, expenses: 0, profit: 0 };
        }
        bucketMap[b].inwardQty += g.totalQuantity || 0;
        bucketMap[b].cost += g.totalCost || 0;
      }
    });

    salesGroup.forEach(g => {
      const b = g._id;
      if (b) {
        if (!bucketMap[b]) {
          bucketMap[b] = { date: b, inwardQty: 0, outwardQty: 0, cost: 0, revenue: 0, expenses: 0, profit: 0 };
        }
        bucketMap[b].outwardQty += g.totalQuantity || 0;
        bucketMap[b].revenue += g.totalRevenue || 0;
      }
    });

    expenseGroup.forEach(g => {
      const b = g._id;
      if (b) {
        if (!bucketMap[b]) {
          bucketMap[b] = { date: b, inwardQty: 0, outwardQty: 0, cost: 0, revenue: 0, expenses: 0, profit: 0 };
        }
        bucketMap[b].expenses += g.totalExpense || 0;
      }
    });

    // Populate profit
    Object.keys(bucketMap).forEach(b => {
      bucketMap[b].profit = bucketMap[b].revenue - bucketMap[b].cost - bucketMap[b].expenses;
    });

    // Sort ascending for chart flow, reverse copy for table grid view
    const trendData = Object.values(bucketMap).sort((a, b) => a.date.localeCompare(b.date));
    const pivotData = [...trendData].reverse();

    // Summarize totals
    let totalInwardQty = 0;
    let totalInwardCost = 0;
    let totalOutwardQty = 0;
    let totalOutwardRevenue = 0;
    let totalExpenses = 0;

    Object.values(bucketMap).forEach(b => {
      totalInwardQty += b.inwardQty;
      totalInwardCost += b.cost;
      totalOutwardQty += b.outwardQty;
      totalOutwardRevenue += b.revenue;
      totalExpenses += b.expenses;
    });

    const netProfit = totalOutwardRevenue - totalInwardCost - totalExpenses;

    return res.status(200).json({
      success: true,
      kpis: {
        totalInwardQty,
        totalInwardCost,
        totalOutwardQty,
        totalOutwardRevenue,
        totalExpenses,
        netProfit
      },
      trendData,
      pivotData,
      expenseCategories: expenseCategories.map(ec => ({
        name: ec._id || 'Uncategorized',
        value: ec.totalAmount
      })),
      managers: managersList
    });
  } catch (error) {
    next(error);
  }
};
