import { Response, NextFunction } from 'express';
import StockSummary from '../models/StockSummary';
import StockLedger from '../models/StockLedger';
import { AuthRequest } from '../middleware/auth';

export const getStockSummary = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let summary = await StockSummary.findOne();
    if (!summary) {
      summary = new StockSummary({
        currentStock: 0,
        totalInwardQuantity: 0,
        totalOutwardQuantity: 0,
        lastUpdated: new Date()
      });
      await summary.save();
    }
    return res.status(200).json({ success: true, summary });
  } catch (error) {
    next(error);
  }
};

export const getStockLedger = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { fromDate, toDate, entryType, page = '1', limit = '20' } = req.query;
    const p = parseInt(page as string, 10);
    const l = parseInt(limit as string, 10);
    const skip = (p - 1) * l;

    let filter: any = {};

    if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) filter.date.$gte = new Date(fromDate as string);
      if (toDate) filter.date.$lte = new Date(toDate as string);
    }

    if (entryType) {
      filter.entryType = entryType;
    }

    const ledger = await StockLedger.find(filter)
      .populate('createdBy', 'name username role')
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(l);

    const total = await StockLedger.countDocuments(filter);

    return res.status(200).json({
      success: true,
      ledger,
      pagination: {
        total,
        page: p,
        pages: Math.ceil(total / l),
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getStockTrend = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Return last 30 ledger movements in ascending order to draw a sequential trend line
    const trend = await StockLedger.find()
      .select('date entryType referenceNumber inQuantity outQuantity closingStock')
      .sort({ date: -1, createdAt: -1 })
      .limit(30);

    // Reverse to display chronologically from left to right on charts
    const chronologicalTrend = trend.reverse();

    return res.status(200).json({ success: true, trend: chronologicalTrend });
  } catch (error) {
    next(error);
  }
};
