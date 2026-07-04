import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import dayjs from 'dayjs';
import Purchase from '../models/Purchase';
import Sale from '../models/Sale';
import Expense from '../models/Expense';
import ExpenseCategory from '../models/ExpenseCategory';
import StockService from '../services/stockService';
import ActivityService from '../services/activityService';
import PDFService from '../services/pdfService';
import { AuthRequest } from '../middleware/auth';

/**
 * Helper to auto-generate sequence numbers like: PUR-20260702-001
 */
async function generateRefNumber(
  model: mongoose.Model<any>,
  prefix: 'PUR' | 'SAL' | 'EXP',
  field: string
): Promise<string> {
  const todayStr = dayjs().format('YYYYMMDD');
  const searchPrefix = `${prefix}-${todayStr}-`;
  
  const latestDoc = await model.findOne({
    [field]: new RegExp(`^${searchPrefix}`)
  })
  .sort({ createdAt: -1 })
  .exec();

  let nextSeq = 1;
  if (latestDoc) {
    const val = latestDoc[field];
    const parts = val.split('-');
    if (parts.length === 3) {
      const lastSeq = parseInt(parts[2], 10);
      if (!isNaN(lastSeq)) {
        nextSeq = lastSeq + 1;
      }
    }
  }

  const paddedSeq = String(nextSeq).padStart(3, '0');
  return `${searchPrefix}${paddedSeq}`;
}

// ==========================================
// PURCHASE / INWARD CONTROLLERS
// ==========================================

export const createPurchase = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const {
    purchaseDate,
    supplierName,
    supplierMobile,
    quantity,
    unitType,
    ratePerUnit,
    notes,
  } = req.body;

  if (!purchaseDate || !supplierName || !quantity || !ratePerUnit) {
    return res.status(400).json({ success: false, message: 'All required fields must be supplied' });
  }

  try {
    const totalAmount = quantity * ratePerUnit;
    
    // Auto generate reference number
    const referenceNumber = await generateRefNumber(Purchase, 'PUR', 'referenceNumber');

    const purchase = new Purchase({
      purchaseDate,
      referenceNumber,
      supplierName,
      supplierMobile,
      quantity,
      unitType: unitType || 'Units',
      ratePerUnit,
      totalAmount,
      notes,
      createdBy: req.user?._id,
    });

    await purchase.save();

    // Perform atomic stock update
    await StockService.registerPurchase(
      quantity,
      purchase._id as any,
      referenceNumber,
      req.user?._id as any,
      purchaseDate,
      `Stock inward for purchase ${referenceNumber}`
    );

    // Log Activity
    await ActivityService.log(
      req.user?._id as any,
      'PURCHASE_CREATE',
      `Registered purchase ${referenceNumber} (₹${totalAmount.toFixed(2)}) from supplier ${supplierName}`,
      req.ip
    );

    return res.status(201).json({ success: true, purchase });
  } catch (error) {
    next(error);
  }
};

export const listPurchases = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { fromDate, toDate, supplier, search, page = '1', limit = '10' } = req.query;
    const p = parseInt(page as string, 10);
    const l = parseInt(limit as string, 10);
    const skip = (p - 1) * l;

    let filter: any = {};

    // Manager role access restriction: view own entries only
    if (req.user?.role === 'MANAGER') {
      filter.createdBy = req.user._id;
    }

    if (fromDate || toDate) {
      filter.purchaseDate = {};
      if (fromDate) filter.purchaseDate.$gte = new Date(fromDate as string);
      if (toDate) filter.purchaseDate.$lte = new Date(toDate as string);
    }

    if (supplier) {
      filter.supplierName = { $regex: supplier as string, $options: 'i' };
    }

    if (search) {
      filter.$or = [
        { referenceNumber: { $regex: search as string, $options: 'i' } },
        { supplierName: { $regex: search as string, $options: 'i' } },
      ];
    }

    const purchases = await Purchase.find(filter)
      .populate('createdBy', 'name username role')
      .sort({ purchaseDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(l);

    const total = await Purchase.countDocuments(filter);

    return res.status(200).json({
      success: true,
      purchases,
      pagination: {
        total,
        page: p,
        pages: Math.ceil(total / l),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getPurchaseById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const purchase = await Purchase.findById(req.params.id).populate('createdBy', 'name username role');
    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }

    // Role-based auth protection
    if (req.user?.role === 'MANAGER' && String(purchase.createdBy._id) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied: You did not submit this entry' });
    }

    return res.status(200).json({ success: true, purchase });
  } catch (error) {
    next(error);
  }
};

export const getPurchasePDF = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const purchase = await Purchase.findById(req.params.id).populate('createdBy', 'name username role');
    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }

    // Role-based auth protection
    if (req.user?.role === 'MANAGER' && String(purchase.createdBy._id) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await PDFService.generateTransactionPDF('PURCHASE', purchase, res);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// SALES / OUTWARD CONTROLLERS
// ==========================================

export const createSale = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const {
    salesDate,
    buyerName,
    buyerMobile,
    quantity,
    unitSellingRate,
    notes,
  } = req.body;

  if (!salesDate || !buyerName || !quantity || !unitSellingRate) {
    return res.status(400).json({ success: false, message: 'All required fields must be supplied' });
  }

  try {
    const totalSaleAmount = quantity * unitSellingRate;
    
    // Auto generate invoice number
    const invoiceNumber = await generateRefNumber(Sale, 'SAL', 'invoiceNumber');

    const sale = new Sale({
      salesDate,
      invoiceNumber,
      buyerName,
      buyerMobile,
      quantity,
      unitSellingRate,
      totalSaleAmount,
      notes,
      createdBy: req.user?._id,
    });

    // Attempt to atomically register this sale in stock
    // This will throw an error if stock is insufficient, preventing the sale from saving.
    await StockService.registerSale(
      quantity,
      sale._id as any,
      invoiceNumber,
      req.user?._id as any,
      salesDate,
      `Stock outward for sale ${invoiceNumber}`
    );

    await sale.save();

    // Log Activity
    await ActivityService.log(
      req.user?._id as any,
      'SALE_CREATE',
      `Registered sale ${invoiceNumber} (₹${totalSaleAmount.toFixed(2)}) to buyer ${buyerName}`,
      req.ip
    );

    return res.status(201).json({ success: true, sale });
  } catch (error) {
    next(error);
  }
};

export const listSales = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { fromDate, toDate, buyer, search, page = '1', limit = '10' } = req.query;
    const p = parseInt(page as string, 10);
    const l = parseInt(limit as string, 10);
    const skip = (p - 1) * l;

    let filter: any = {};

    // Manager role access restriction: view own entries only
    if (req.user?.role === 'MANAGER') {
      filter.createdBy = req.user._id;
    }

    if (fromDate || toDate) {
      filter.salesDate = {};
      if (fromDate) filter.salesDate.$gte = new Date(fromDate as string);
      if (toDate) filter.salesDate.$lte = new Date(toDate as string);
    }

    if (buyer) {
      filter.buyerName = { $regex: buyer as string, $options: 'i' };
    }

    if (search) {
      filter.$or = [
        { invoiceNumber: { $regex: search as string, $options: 'i' } },
        { buyerName: { $regex: search as string, $options: 'i' } },
      ];
    }

    const sales = await Sale.find(filter)
      .populate('createdBy', 'name username role')
      .sort({ salesDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(l);

    const total = await Sale.countDocuments(filter);

    return res.status(200).json({
      success: true,
      sales,
      pagination: {
        total,
        page: p,
        pages: Math.ceil(total / l),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getSaleById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const sale = await Sale.findById(req.params.id).populate('createdBy', 'name username role');
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }

    if (req.user?.role === 'MANAGER' && String(sale.createdBy._id) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    return res.status(200).json({ success: true, sale });
  } catch (error) {
    next(error);
  }
};

export const getSalePDF = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const sale = await Sale.findById(req.params.id).populate('createdBy', 'name username role');
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }

    if (req.user?.role === 'MANAGER' && String(sale.createdBy._id) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await PDFService.generateTransactionPDF('SALE', sale, res);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// EXPENSE CONTROLLERS
// ==========================================

export const createExpense = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const {
    expenseDate,
    category,
    subcategory,
    amount,
    spentFor,
    description,
    billNumber,
    notes,
  } = req.body;

  if (!expenseDate || !category || !amount || !spentFor) {
    return res.status(400).json({ success: false, message: 'All required fields must be supplied' });
  }

  try {
    // Check if category exists
    const categoryExists = await ExpenseCategory.findOne({ name: category });
    if (!categoryExists) {
      // Dynamic category insert if not seeded
      const newCat = new ExpenseCategory({ name: category, createdBy: req.user?._id });
      await newCat.save();
    }

    const voucherNumber = await generateRefNumber(Expense, 'EXP', 'voucherNumber');

    const expense = new Expense({
      expenseDate,
      voucherNumber,
      category,
      subcategory,
      amount,
      spentFor,
      description,
      billNumber,
      notes,
      createdBy: req.user?._id,
    });

    await expense.save();

    // Log Activity
    await ActivityService.log(
      req.user?._id as any,
      'EXPENSE_CREATE',
      `Registered expense ${voucherNumber} (₹${amount.toFixed(2)}) for category ${category}`,
      req.ip
    );

    return res.status(201).json({ success: true, expense });
  } catch (error) {
    next(error);
  }
};

export const listExpenses = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { fromDate, toDate, category, search, page = '1', limit = '10' } = req.query;
    const p = parseInt(page as string, 10);
    const l = parseInt(limit as string, 10);
    const skip = (p - 1) * l;

    let filter: any = {};

    // Manager role access restriction: view own entries only
    if (req.user?.role === 'MANAGER') {
      filter.createdBy = req.user._id;
    }

    if (fromDate || toDate) {
      filter.expenseDate = {};
      if (fromDate) filter.expenseDate.$gte = new Date(fromDate as string);
      if (toDate) filter.expenseDate.$lte = new Date(toDate as string);
    }

    if (category) {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { voucherNumber: { $regex: search as string, $options: 'i' } },
        { spentFor: { $regex: search as string, $options: 'i' } },
      ];
    }

    const expenses = await Expense.find(filter)
      .populate('createdBy', 'name username role')
      .sort({ expenseDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(l);

    const total = await Expense.countDocuments(filter);

    return res.status(200).json({
      success: true,
      expenses,
      pagination: {
        total,
        page: p,
        pages: Math.ceil(total / l),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getExpenseById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const expense = await Expense.findById(req.params.id).populate('createdBy', 'name username role');
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    if (req.user?.role === 'MANAGER' && String(expense.createdBy._id) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    return res.status(200).json({ success: true, expense });
  } catch (error) {
    next(error);
  }
};

export const getExpensePDF = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const expense = await Expense.findById(req.params.id).populate('createdBy', 'name username role');
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    if (req.user?.role === 'MANAGER' && String(expense.createdBy._id) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await PDFService.generateTransactionPDF('EXPENSE', expense, res);
  } catch (error) {
    next(error);
  }
};

export const listExpenseCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await ExpenseCategory.find().sort({ name: 1 });
    return res.status(200).json({ success: true, categories });
  } catch (error) {
    next(error);
  }
};
