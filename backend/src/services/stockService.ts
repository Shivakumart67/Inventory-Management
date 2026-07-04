import mongoose from 'mongoose';
import StockSummary, { IStockSummary } from '../models/StockSummary';
import StockLedger, { IStockLedger } from '../models/StockLedger';

export class StockService {
  /**
   * Retrieves the singleton StockSummary document.
   * If it doesn't exist, it creates and initializes one.
   */
  static async getSummary(): Promise<IStockSummary> {
    let summary = await StockSummary.findOne();
    if (!summary) {
      summary = new StockSummary({
        currentStock: 0,
        totalInwardQuantity: 0,
        totalOutwardQuantity: 0,
        lastUpdated: new Date(),
      });
      await summary.save();
    }
    return summary;
  }

  /**
   * Atomically records a stock inward (Purchase).
   * Increments currentStock and totalInwardQuantity.
   */
  static async registerPurchase(
    quantity: number,
    purchaseId: mongoose.Types.ObjectId,
    referenceNumber: string,
    createdBy: mongoose.Types.ObjectId,
    date: Date,
    notes?: string
  ): Promise<number> {
    const summary = await StockSummary.findOneAndUpdate(
      {},
      {
        $inc: {
          currentStock: quantity,
          totalInwardQuantity: quantity,
        },
        $set: { lastUpdated: new Date() },
      },
      { new: true, upsert: true }
    );

    const closingStock = summary.currentStock;

    // Create StockLedger Entry
    const ledgerEntry = new StockLedger({
      date,
      entryType: 'PURCHASE',
      referenceNumber,
      inQuantity: quantity,
      outQuantity: 0,
      closingStock,
      linkedEntryId: purchaseId,
      createdBy,
      notes: notes || 'Purchase entry stock inward',
    });
    await ledgerEntry.save();

    return closingStock;
  }

  /**
   * Atomically records a stock outward (Sale).
   * Decrements currentStock and increments totalOutwardQuantity.
   * Fails and throws an error if currentStock is insufficient.
   */
  static async registerSale(
    quantity: number,
    saleId: mongoose.Types.ObjectId,
    referenceNumber: string,
    createdBy: mongoose.Types.ObjectId,
    date: Date,
    notes?: string
  ): Promise<number> {
    // 1. Atomically decrement stock ONLY IF available stock is greater than or equal to the sold quantity.
    const summary = await StockSummary.findOneAndUpdate(
      { currentStock: { $gte: quantity } },
      {
        $inc: {
          currentStock: -quantity,
          totalOutwardQuantity: quantity,
        },
        $set: { lastUpdated: new Date() },
      },
      { new: true }
    );

    if (!summary) {
      throw new Error(`Insufficient stock. Cannot fulfill sale of ${quantity} units.`);
    }

    const closingStock = summary.currentStock;

    // Create StockLedger Entry
    const ledgerEntry = new StockLedger({
      date,
      entryType: 'SALE',
      referenceNumber,
      inQuantity: 0,
      outQuantity: quantity,
      closingStock,
      linkedEntryId: saleId,
      createdBy,
      notes: notes || 'Sales entry stock outward',
    });
    await ledgerEntry.save();

    return closingStock;
  }
}
export default StockService;
