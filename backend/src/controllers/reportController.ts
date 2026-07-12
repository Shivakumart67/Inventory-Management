import { Response, NextFunction } from 'express';
import dayjs from 'dayjs';
import Purchase from '../models/Purchase';
import Sale from '../models/Sale';
import Expense from '../models/Expense';
import StockLedger from '../models/StockLedger';
import StockSummary from '../models/StockSummary';
import ExportService from '../services/exportService';
import { AuthRequest } from '../middleware/auth';

// Helper to compile date ranges
function buildDateQuery(fromDate?: string, toDate?: string) {
  if (!fromDate && !toDate) return {};
  const query: any = {};
  if (fromDate) query.$gte = dayjs(fromDate).startOf('day').toDate();
  if (toDate) query.$lte = dayjs(toDate).endOf('day').toDate();
  return query;
}

// ==========================================
// REPORT QUERIES
// ==========================================

export const getPurchaseReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { fromDate, toDate, supplier, user } = req.query;
    let filter: any = {};

    if (req.user?.role === 'MANAGER') {
      filter.createdBy = req.user._id;
    } else if (user) {
      filter.createdBy = user;
    }

    const dateQuery = buildDateQuery(fromDate as string, toDate as string);
    if (Object.keys(dateQuery).length > 0) {
      filter.purchaseDate = dateQuery;
    }

    if (supplier) {
      filter.supplierName = { $regex: supplier as string, $options: 'i' };
    }

    const items = await Purchase.find(filter)
      .populate('createdBy', 'name username')
      .sort({ purchaseDate: -1, createdAt: -1 });

    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = items.reduce((sum, item) => sum + item.totalAmount, 0);

    return res.status(200).json({
      success: true,
      summary: {
        totalQuantity,
        totalAmount,
        count: items.length
      },
      items
    });
  } catch (error) {
    next(error);
  }
};

export const getSalesReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { fromDate, toDate, buyer, user } = req.query;
    let filter: any = {};

    if (req.user?.role === 'MANAGER') {
      filter.createdBy = req.user._id;
    } else if (user) {
      filter.createdBy = user;
    }

    const dateQuery = buildDateQuery(fromDate as string, toDate as string);
    if (Object.keys(dateQuery).length > 0) {
      filter.salesDate = dateQuery;
    }

    if (buyer) {
      filter.buyerName = { $regex: buyer as string, $options: 'i' };
    }

    const items = await Sale.find(filter)
      .populate('createdBy', 'name username')
      .sort({ salesDate: -1, createdAt: -1 });

    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = items.reduce((sum, item) => sum + item.totalSaleAmount, 0);

    return res.status(200).json({
      success: true,
      summary: {
        totalQuantity,
        totalAmount,
        count: items.length
      },
      items
    });
  } catch (error) {
    next(error);
  }
};

export const getExpenseReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { fromDate, toDate, category, user } = req.query;
    let filter: any = {};

    if (req.user?.role === 'MANAGER') {
      filter.createdBy = req.user._id;
    } else if (user) {
      filter.createdBy = user;
    }

    const dateQuery = buildDateQuery(fromDate as string, toDate as string);
    if (Object.keys(dateQuery).length > 0) {
      filter.expenseDate = dateQuery;
    }

    if (category) {
      filter.category = category;
    }

    const items = await Expense.find(filter)
      .populate('createdBy', 'name username')
      .sort({ expenseDate: -1, createdAt: -1 });

    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

    return res.status(200).json({
      success: true,
      summary: {
        totalAmount,
        count: items.length
      },
      items
    });
  } catch (error) {
    next(error);
  }
};

export const getStockReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { fromDate, toDate, entryType } = req.query;
    let filter: any = {};

    const dateQuery = buildDateQuery(fromDate as string, toDate as string);
    if (Object.keys(dateQuery).length > 0) {
      filter.date = dateQuery;
    }

    if (entryType) {
      filter.entryType = entryType;
    }

    const summary = await StockSummary.findOne();
    const ledgerItems = await StockLedger.find(filter)
      .populate('createdBy', 'name username')
      .sort({ date: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      summary: {
        currentStock: summary?.currentStock || 0,
        totalInwardQuantity: summary?.totalInwardQuantity || 0,
        totalOutwardQuantity: summary?.totalOutwardQuantity || 0,
      },
      ledgerItems
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// EXPORT GENERATION TRIGGERS
// ==========================================

export const triggerExport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { type, format } = req.query; // format = 'excel' | 'csv'
  
  if (!type || !format || !['excel', 'csv'].includes(format as string)) {
    return res.status(400).json({ success: false, message: 'Type and format (excel/csv) parameters are required' });
  }

  try {
    const { fromDate, toDate, buyer, supplier, category, user } = req.query;
    let filter: any = {};

    // Managers restricted to their own submissions
    if (req.user?.role === 'MANAGER') {
      filter.createdBy = req.user._id;
    } else if (user) {
      filter.createdBy = user;
    }

    let headers: string[] = [];
    let rows: any[][] = [];
    let reportName = String(type);

    if (type === 'purchases') {
      reportName = 'egg_collections';
      const dateQuery = buildDateQuery(fromDate as string, toDate as string);
      if (Object.keys(dateQuery).length > 0) filter.purchaseDate = dateQuery;

      const items = await Purchase.find(filter).populate('createdBy', 'name').sort({ purchaseDate: -1 });

      headers = ['Ref Number', 'Collection Date', 'Quantity (Eggs)', 'Rate (₹)', 'Total Value (₹)', 'Created By'];
      rows = items.map((p) => [
        p.referenceNumber,
        dayjs(p.purchaseDate).format('DD MM YYYY HH:mm:ss'),
        p.quantity,
        p.ratePerUnit,
        p.totalAmount,
        (p.createdBy as any)?.name || 'System',
      ]);
    } else if (type === 'sales') {
      const dateQuery = buildDateQuery(fromDate as string, toDate as string);
      if (Object.keys(dateQuery).length > 0) filter.salesDate = dateQuery;
      if (buyer) filter.buyerName = { $regex: buyer as string, $options: 'i' };

      const items = await Sale.find(filter).populate('createdBy', 'name').sort({ salesDate: -1 });

      headers = ['Invoice Number', 'Date', 'Buyer Name', 'Quantity (Eggs)', 'Rate (₹)', 'Total Sale (₹)', 'Created By'];
      rows = items.map((s) => [
        s.invoiceNumber,
        dayjs(s.salesDate).format('DD MM YYYY HH:mm:ss'),
        s.buyerName,
        s.quantity,
        s.unitSellingRate,
        s.totalSaleAmount,
        (s.createdBy as any)?.name || 'System',
      ]);
    } else if (type === 'expenses') {
      const dateQuery = buildDateQuery(fromDate as string, toDate as string);
      if (Object.keys(dateQuery).length > 0) filter.expenseDate = dateQuery;
      if (category) filter.category = category;

      const items = await Expense.find(filter).populate('createdBy', 'name').sort({ expenseDate: -1 });

      headers = ['Voucher No', 'Date', 'Category', 'Subcategory', 'Amount (₹)', 'Title/Spent For', 'Bill Number', 'Created By'];
      rows = items.map((e) => [
        e.voucherNumber,
        dayjs(e.expenseDate).format('DD MM YYYY HH:mm:ss'),
        e.category,
        e.subcategory || 'N/A',
        e.amount,
        e.spentFor,
        e.billNumber || 'N/A',
        (e.createdBy as any)?.name || 'System',
      ]);
    } else if (type === 'stock') {
      const dateQuery = buildDateQuery(fromDate as string, toDate as string);
      if (Object.keys(dateQuery).length > 0) filter.date = dateQuery;
      const { entryType } = req.query;
      if (entryType) filter.entryType = entryType;

      const items = await StockLedger.find(filter).populate('createdBy', 'name').sort({ date: -1 });

      headers = ['Ledger Date', 'Entry Type', 'Reference No', 'In Quantity', 'Out Quantity', 'Closing Stock (Eggs)', 'Notes', 'Created By'];
      rows = items.map((l) => [
        dayjs(l.date).format('DD MM YYYY HH:mm:ss'),
        l.entryType === 'PURCHASE' ? 'COLLECTION' : l.entryType,
        l.referenceNumber,
        l.inQuantity,
        l.outQuantity,
        l.closingStock,
        l.notes || '',
        (l.createdBy as any)?.name || 'System',
      ]);
    } else {
      return res.status(400).json({ success: false, message: 'Invalid report type' });
    }

    if (format === 'excel') {
      await ExportService.exportToExcel(reportName, headers, rows, res);
    } else {
      ExportService.exportToCSV(reportName, headers, rows, res);
    }
  } catch (error) {
    next(error);
  }
};
