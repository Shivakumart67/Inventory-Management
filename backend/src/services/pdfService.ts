import PDFDocument from 'pdfkit';
import { Response } from 'express';
import dayjs from 'dayjs';
import SiteConfig from '../models/SiteConfig';

export class PDFService {

  /**
   * Internal helper that builds the PDF document and returns it.
   * Used by both the stream and base64 methods.
   */
  private static buildDocument(
    type: 'PURCHASE' | 'SALE' | 'EXPENSE',
    data: any,
    companyName: string
  ): InstanceType<typeof PDFDocument> {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    const title = type === 'PURCHASE' ? 'EGG COLLECTION VOUCHER' :
                  type === 'SALE' ? 'SALES INVOICE (OUTWARD)' : 'EXPENSE VOUCHER';

    const refLabel = type === 'PURCHASE' ? 'Collection Ref:' :
                     type === 'SALE' ? 'Invoice No:' : 'Voucher No:';

    const refNo = type === 'PURCHASE' ? data.referenceNumber :
                  type === 'SALE' ? data.invoiceNumber : data.voucherNumber;

    const date = type === 'PURCHASE' ? data.purchaseDate :
                 type === 'SALE' ? data.salesDate : data.expenseDate;

    const creatorName = data.createdBy?.name || 'System';

    // 1. Header Section
    doc.fillColor('#0f766e').fontSize(20).text(companyName.toUpperCase(), 50, 45);
    doc.fillColor('#4b5563').fontSize(10).text('Business Management System', 50, 68);

    doc.fontSize(14).fillColor('#1f2937').text(title, 50, 100, { align: 'right' });

    // Draw a divider line
    doc.moveTo(50, 120).lineTo(545, 120).strokeColor('#e5e7eb').stroke();

    // 2. Transaction Information Block
    doc.fontSize(10).fillColor('#4b5563');
    doc.text(`${refLabel} ${refNo}`, 50, 135);
    doc.text(`Date: ${dayjs(date).format('DD/MM/YYYY')}`, 50, 150);
    doc.text(`Created By: ${creatorName}`, 50, 165);
    doc.text(`Created At: ${dayjs(data.createdAt).format('DD/MM/YYYY')}`, 50, 180);

    // Party Details
    let partyLabel = '';
    let partyName = '';
    let partyMobile = '';

    if (type === 'PURCHASE') {
      partyLabel = 'Egg Collection Source:';
      partyName = companyName;
      partyMobile = '';
    } else if (type === 'SALE') {
      partyLabel = 'Buyer Details:';
      partyName = data.buyerName;
      partyMobile = data.buyerMobile || 'N/A';
    } else {
      partyLabel = 'Expense Details:';
      partyName = data.spentFor;
      partyMobile = data.billNumber ? `Bill Ref: ${data.billNumber}` : 'N/A';
    }

    doc.fillColor('#1f2937').fontSize(11).text(partyLabel, 350, 135);
    doc.fillColor('#4b5563').fontSize(10).text(`Name: ${partyName}`, 350, 150);
    if (type === 'EXPENSE') {
      doc.text(partyMobile, 350, 165);
    } else if (type === 'SALE') {
      doc.text(`Mobile: ${partyMobile}`, 350, 165);
    }

    // Draw divider line
    doc.moveTo(50, 205).lineTo(545, 205).strokeColor('#e5e7eb').stroke();

    // 3. Itemized / Summary Details Table
    doc.fillColor('#0f766e').fontSize(11).text('Transaction Item Details', 50, 220);

    // Table Header
    doc.rect(50, 240, 495, 20).fill('#f3f4f6');
    doc.fillColor('#374151').fontSize(10);

    if (type === 'EXPENSE') {
      doc.text('Expense Title / Item', 60, 245);
      doc.text('Category', 250, 245);
      doc.text('Subcategory', 380, 245);
      doc.text('Amount', 480, 245, { align: 'right', width: 55 });
    } else {
      doc.text('Description / Item', 60, 245);
      doc.text('Quantity', 230, 245, { align: 'right', width: 60 });
      doc.text('Rate per Unit', 310, 245, { align: 'right', width: 80 });
      doc.text('Total Amount', 440, 245, { align: 'right', width: 95 });
    }

    // Table Row
    doc.fillColor('#4b5563').fontSize(10);
    if (type === 'EXPENSE') {
      doc.text(data.spentFor, 60, 275, { width: 180 });
      doc.text(data.category, 250, 275, { width: 120 });
      doc.text(data.subcategory || 'N/A', 380, 275, { width: 90 });
      doc.text(`${data.amount.toFixed(2)}`, 480, 275, { align: 'right', width: 55 });
    } else {
      const quantityText = `${data.quantity} Eggs`;
      const rateLabel = type === 'PURCHASE' ? data.ratePerUnit : data.unitSellingRate;
      const totalAmount = type === 'PURCHASE' ? data.totalAmount : data.totalSaleAmount;

      doc.text(type === 'PURCHASE' ? 'Egg Collection Inward' : 'Sales Outward Eggs', 60, 275, { width: 160 });
      doc.text(quantityText, 230, 275, { align: 'right', width: 60 });
      doc.text(`${rateLabel.toFixed(2)}`, 310, 275, { align: 'right', width: 80 });
      doc.text(`${totalAmount.toFixed(2)}`, 440, 275, { align: 'right', width: 95 });
    }

    // Draw divider
    doc.moveTo(50, 310).lineTo(545, 310).strokeColor('#e5e7eb').stroke();

    // 4. Totals summary
    const startY = 325;
    if (type !== 'EXPENSE') {
      const totalAmount = type === 'PURCHASE' ? data.totalAmount : data.totalSaleAmount;
      doc.text(`Net Total:`, 350, startY + 20);
      doc.text(`${totalAmount.toFixed(2)}`, 450, startY + 20, { align: 'right', width: 85 });
    } else {
      doc.text(`Net Total Amount:`, 350, startY + 20);
      doc.text(`${data.amount.toFixed(2)}`, 450, startY + 20, { align: 'right', width: 85 });
    }

    // 5. Notes Section
    if (data.notes) {
      doc.moveTo(50, startY + 50).lineTo(545, startY + 50).strokeColor('#e5e7eb').stroke();
      doc.fillColor('#1f2937').fontSize(10).text('Notes / Remarks:', 50, startY + 65);
      doc.fillColor('#4b5563').fontSize(9).text(data.notes, 50, startY + 80, { width: 495 });
    }

    // 6. Footer
    doc.fillColor('#9ca3af').fontSize(8).text(
      'This is a system generated document and does not require a physical signature.',
      50,
      750,
      { align: 'center', width: 495 }
    );

    doc.end();
    return doc;
  }

  /**
   * Stream the PDF directly to the HTTP response (for desktop browsers).
   */
  static async generateTransactionPDF(
    type: 'PURCHASE' | 'SALE' | 'EXPENSE',
    data: any,
    res: Response
  ): Promise<void> {
    const config = await SiteConfig.findOne();
    const companyName = config?.companyName || 'Golden Egg Layer Farm';

    const refNo = type === 'PURCHASE' ? data.referenceNumber :
                  type === 'SALE' ? data.invoiceNumber : data.voucherNumber;

    const filename = `${type.toLowerCase()}-${refNo}.pdf`;

    // Set explicit headers so browsers and WebViews know to download the file
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache');

    const doc = PDFService.buildDocument(type, data, companyName);
    doc.pipe(res);
  }

  /**
   * Return the PDF as a base64-encoded string inside a JSON response.
   * Used by mobile WebView / APK environments that cannot handle binary streams.
   */
  static async generateTransactionPDFBase64(
    type: 'PURCHASE' | 'SALE' | 'EXPENSE',
    data: any,
    res: Response
  ): Promise<void> {
    const config = await SiteConfig.findOne();
    const companyName = config?.companyName || 'Golden Egg Layer Farm';

    const refNo = type === 'PURCHASE' ? data.referenceNumber :
                  type === 'SALE' ? data.invoiceNumber : data.voucherNumber;

    const filename = `${type.toLowerCase()}-${refNo}.pdf`;

    const doc = PDFService.buildDocument(type, data, companyName);

    // Buffer the PDF in memory
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      const base64 = pdfBuffer.toString('base64');
      res.status(200).json({
        success: true,
        filename,
        mimeType: 'application/pdf',
        base64,
      });
    });
    doc.on('error', (err: Error) => {
      res.status(500).json({ success: false, message: 'PDF generation failed', error: err.message });
    });
  }
}

export default PDFService;
