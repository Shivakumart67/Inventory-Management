import ExcelJS from 'exceljs';
import { Response } from 'express';
import dayjs from 'dayjs';

// Helper to convert column index to letter (e.g. 0 -> A, 1 -> B)
function getColumnLetter(colIndex: number): string {
  let temp = colIndex;
  let letter = '';
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

function styleReportWorksheet(
  worksheet: ExcelJS.Worksheet,
  reportName: string,
  headers: string[],
  rows: any[][]
) {
  worksheet.views = [{ showGridLines: true }];

  // 1. Title Block
  const titleRow = worksheet.addRow([`BUSINESS LEDGER REPORT: ${reportName.toUpperCase()}`]);
  titleRow.getCell(1).font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: '0F766E' } };
  
  const metaRow = worksheet.addRow([`Generated on: ${dayjs().format('DD/MM/YYYY HH:mm:ss')}`]);
  metaRow.getCell(1).font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: '64748B' } };
  
  worksheet.addRow([]); // Blank spacing row

  // 2. Add Headers
  const headerRow = worksheet.addRow(headers);
  headerRow.height = 26;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '0F766E' } // Teal business primary
    };
    cell.font = {
      name: 'Segoe UI',
      color: { argb: 'FFFFFF' },
      bold: true,
      size: 11
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: '0d5c56' } },
      bottom: { style: 'medium', color: { argb: '0a4742' } },
      left: { style: 'thin', color: { argb: '0d5c56' } },
      right: { style: 'thin', color: { argb: '0d5c56' } }
    };
  });

  // Enable Auto Filter
  const lastColLetter = getColumnLetter(headers.length - 1);
  worksheet.autoFilter = `A4:${lastColLetter}4`;

  // 3. Add Data rows & formats
  const startDataRow = 5;
  rows.forEach((rowData, idx) => {
    const row = worksheet.addRow(rowData);
    row.height = 20;

    const isEven = idx % 2 === 0;

    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Segoe UI', size: 10, color: { argb: '1E293B' } };
      
      // Zebra striping
      if (isEven) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'F8FAFC' } // light grayish blue slate
        };
      }

      // Thin borders
      cell.border = {
        top: { style: 'thin', color: { argb: 'E2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
        left: { style: 'thin', color: { argb: 'E2E8F0' } },
        right: { style: 'thin', color: { argb: 'E2E8F0' } }
      };

      // Alignment and formats based on header names
      const header = headers[colNumber - 1].toLowerCase();
      
      if (header.includes('date')) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (header.includes('qty') || header.includes('quantity') || header.includes('eggs') || header.includes('in quantity') || header.includes('out quantity') || header.includes('closing')) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.numFmt = '#,##0';
        if (typeof cell.value === 'string') {
          const num = Number(cell.value);
          if (!isNaN(num)) cell.value = num;
        }
      } else if (header.includes('rate') || header.includes('total') || header.includes('revenue') || header.includes('cost') || header.includes('amount') || header.includes('expenses') || header.includes('sale') || header.includes('profit') || header.includes('loss')) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.numFmt = '₹#,##0.00';
        if (typeof cell.value === 'string') {
          const num = Number(cell.value);
          if (!isNaN(num)) cell.value = num;
        }
      } else if (header.includes('ref') || header.includes('invoice') || header.includes('voucher') || header.includes('bill') || header.includes('no')) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      }
    });
  });

  const lastDataRowNumber = startDataRow + rows.length - 1;

  // 4. Add Grand Totals Row
  if (rows.length > 0) {
    const totalRowData = new Array(headers.length).fill(null);
    totalRowData[0] = 'GRAND TOTAL';
    
    const totalRow = worksheet.addRow(totalRowData);
    totalRow.height = 22;

    totalRow.eachCell((cell, colNumber) => {
      cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: '0F766E' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'F0FDF4' } // Light green accent fill
      };

      // Top thin border, bottom double border (Accounting standard)
      cell.border = {
        top: { style: 'thin', color: { argb: '94A3B8' } },
        bottom: { style: 'double', color: { argb: '0F766E' } },
        left: { style: 'thin', color: { argb: 'CBD5E1' } },
        right: { style: 'thin', color: { argb: 'CBD5E1' } }
      };

      const header = headers[colNumber - 1].toLowerCase();
      const colLetter = getColumnLetter(colNumber - 1);

      // Apply Excel formulas for columns to sum
      if (header.includes('qty') || header.includes('quantity') || header.includes('eggs') || header.includes('in quantity') || header.includes('out quantity') || header.includes('closing')) {
        cell.value = { formula: `SUM(${colLetter}5:${colLetter}${lastDataRowNumber})` };
        cell.numFmt = '#,##0';
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      } else if (header.includes('total') || header.includes('revenue') || header.includes('cost') || header.includes('amount') || header.includes('expenses') || header.includes('sale') || header.includes('profit') || header.includes('loss')) {
        cell.value = { formula: `SUM(${colLetter}5:${colLetter}${lastDataRowNumber})` };
        cell.numFmt = '₹#,##0.00';
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      } else if (colNumber > 1) {
        cell.value = ''; // empty space
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      }
    });
  }

  // 5. Adjust column widths based on content size
  worksheet.columns.forEach((column) => {
    let maxLength = 0;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      let cellText = '';
      if (cell.value && typeof cell.value === 'object' && 'formula' in cell.value) {
        cellText = 'GRAND TOTAL';
      } else {
        cellText = cell.value ? cell.value.toString() : '';
      }
      if (cellText.length > maxLength) {
        maxLength = cellText.length;
      }
    });
    column.width = Math.max(maxLength + 4, 12);
  });
}

export class ExportService {
  /**
   * Generates and sends an Excel worksheet for tabular report data.
   */
  static async exportToExcel(
    reportName: string,
    headers: string[],
    rows: any[][],
    res: Response
  ): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(reportName);

    styleReportWorksheet(worksheet, reportName, headers, rows);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${reportName}_${dayjs().format('YYYYMMDD')}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  }

  /**
   * Generates a multi-sheet CA-style Comprehensive Auditing Excel Report.
   */
  static async exportComprehensiveExcel(data: {
    startDate: Date;
    endDate: Date;
    purchases: any[];
    sales: any[];
    expenses: any[];
    stockLedger: any[];
    currentStock: number;
    res: Response;
  }): Promise<void> {
    const { startDate, endDate, purchases, sales, expenses, stockLedger, currentStock, res } = data;

    const workbook = new ExcelJS.Workbook();

    // ==========================================
    // SHEET 1: EXECUTIVE FINANCIAL DASHBOARD
    // ==========================================
    const dashSheet = workbook.addWorksheet('Financial Dashboard');
    dashSheet.views = [{ showGridLines: true }];

    // Column widths
    dashSheet.columns = [
      { width: 3 },  // A
      { width: 28 }, // B
      { width: 16 }, // C
      { width: 16 }, // D
      { width: 22 }, // E
      { width: 16 }, // F
      { width: 16 }, // G
      { width: 22 }, // H
      { width: 16 }, // I
      { width: 16 }, // J
      { width: 22 }, // K
      { width: 16 }, // L
      { width: 16 }, // M
    ];

    // Main Header Row
    dashSheet.mergeCells('B2:M2');
    const titleCell = dashSheet.getCell('B2');
    titleCell.value = 'COMPREHENSIVE FINANCIAL SUMMARY & KPI DASHBOARD';
    titleCell.font = { name: 'Segoe UI', size: 15, bold: true, color: { argb: '0F766E' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Subheader metadata
    dashSheet.mergeCells('B3:M3');
    const subCell = dashSheet.getCell('B3');
    subCell.value = `Audit Period: ${dayjs(startDate).format('DD/MM/YYYY')} to ${dayjs(endDate).format('DD/MM/YYYY')} | Generated on: ${dayjs().format('DD/MM/YYYY HH:mm:ss')}`;
    subCell.font = { name: 'Segoe UI', size: 9.5, italic: true, color: { argb: '475569' } };
    subCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Section 1 Header
    dashSheet.mergeCells('B5:M5');
    const secHeader = dashSheet.getCell('B5');
    secHeader.value = '1. FINANCIAL KPI SUMMARY';
    secHeader.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFF' } };
    secHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0F766E' } };
    secHeader.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

    // Dashboard values precalculations
    const totalInwardQty = purchases.reduce((sum, p) => sum + p.quantity, 0);
    const totalInwardCost = purchases.reduce((sum, p) => sum + p.totalAmount, 0);
    const totalOutwardQty = sales.reduce((sum, s) => sum + s.quantity, 0);
    const totalOutwardRevenue = sales.reduce((sum, s) => sum + s.totalSaleAmount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalOutwardRevenue - totalInwardCost - totalExpenses;

    const avgCostEgg = totalInwardQty > 0 ? (totalInwardCost / totalInwardQty) : 0;
    const avgSaleEgg = totalOutwardQty > 0 ? (totalOutwardRevenue / totalOutwardQty) : 0;
    const profitMarginPercent = totalOutwardRevenue > 0 ? ((netProfit / totalOutwardRevenue) * 100) : 0;

    // Card 1: Net Profit (Col B to D, Row 7 to 9)
    dashSheet.mergeCells('B7:D7');
    dashSheet.getCell('B7').value = 'NET AUDIT PROFIT / (LOSS)';
    dashSheet.mergeCells('B8:D8');
    dashSheet.getCell('B8').value = netProfit;
    dashSheet.getCell('B8').numFmt = '₹#,##0.00';
    dashSheet.mergeCells('B9:D9');
    dashSheet.getCell('B9').value = `Margin Rate: ${profitMarginPercent.toFixed(2)}%`;

    // Card 2: Sales Output (Col E to G, Row 7 to 9)
    dashSheet.mergeCells('E7:G7');
    dashSheet.getCell('E7').value = 'TOTAL SALES REVENUE';
    dashSheet.mergeCells('E8:G8');
    dashSheet.getCell('E8').value = totalOutwardRevenue;
    dashSheet.getCell('E8').numFmt = '₹#,##0.00';
    dashSheet.mergeCells('E9:G9');
    dashSheet.getCell('E9').value = `${totalOutwardQty.toLocaleString()} Eggs Sold`;

    // Card 3: Inward Cost (Col H to J, Row 7 to 9)
    dashSheet.mergeCells('H7:J7');
    dashSheet.getCell('H7').value = 'TOTAL COLLECTION COST';
    dashSheet.mergeCells('H8:J8');
    dashSheet.getCell('H8').value = totalInwardCost;
    dashSheet.getCell('H8').numFmt = '₹#,##0.00';
    dashSheet.mergeCells('H9:J9');
    dashSheet.getCell('H9').value = `${totalInwardQty.toLocaleString()} Eggs Collected`;

    // Card 4: Expenses (Col K to M, Row 7 to 9)
    dashSheet.mergeCells('K7:M7');
    dashSheet.getCell('K7').value = 'OPERATIONAL EXPENSES';
    dashSheet.mergeCells('K8:M8');
    dashSheet.getCell('K8').value = totalExpenses;
    dashSheet.getCell('K8').numFmt = '₹#,##0.00';
    dashSheet.mergeCells('K9:M9');
    dashSheet.getCell('K9').value = `${expenses.length} Vouchers Logged`;

    // Style helper for cards
    const styleKpiRange = (startCol: number, endCol: number, accentColor: string, bgColor: string) => {
      for (let r = 7; r <= 9; r++) {
        for (let c = startCol; c <= endCol; c++) {
          const cell = dashSheet.getCell(r, c);
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: bgColor }
          };
          cell.border = {
            top: r === 7 ? { style: 'medium', color: { argb: accentColor } } : { style: 'thin', color: { argb: 'E2E8F0' } },
            bottom: r === 9 ? { style: 'thin', color: { argb: 'CBD5E1' } } : { style: 'thin', color: { argb: 'E2E8F0' } },
            left: c === startCol ? { style: 'thin', color: { argb: 'CBD5E1' } } : { style: 'thin', color: { argb: 'E2E8F0' } },
            right: c === endCol ? { style: 'thin', color: { argb: 'CBD5E1' } } : { style: 'thin', color: { argb: 'E2E8F0' } }
          };
        }
      }

      const tCell = dashSheet.getCell(7, startCol);
      tCell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: '64748B' } };
      tCell.alignment = { horizontal: 'center', vertical: 'middle' };

      const vCell = dashSheet.getCell(8, startCol);
      vCell.font = { name: 'Segoe UI', size: 15, bold: true, color: { argb: accentColor } };
      vCell.alignment = { horizontal: 'center', vertical: 'middle' };

      const lCell = dashSheet.getCell(9, startCol);
      lCell.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: '475569' } };
      lCell.alignment = { horizontal: 'center', vertical: 'middle' };
    };

    styleKpiRange(2, 4, netProfit >= 0 ? '16A34A' : 'DC2626', netProfit >= 0 ? 'F0FDF4' : 'FEF2F2');
    styleKpiRange(5, 7, '0284C7', 'F0F9FF');
    styleKpiRange(8, 10, '0D9488', 'F0FDFA');
    styleKpiRange(11, 13, 'D97706', 'FFFBEB');

    // Section 2 Header
    dashSheet.mergeCells('B11:M11');
    const secHeader2 = dashSheet.getCell('B11');
    secHeader2.value = '2. INVENTORY POSITION SUMMARY';
    secHeader2.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFF' } };
    secHeader2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0F766E' } };
    secHeader2.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

    // Stock Card 1: Available Stock (Col B to G)
    dashSheet.mergeCells('B13:G13');
    dashSheet.getCell('B13').value = 'CURRENT PHYSICAL STOCK LEDGER BALANCE';
    dashSheet.mergeCells('B14:G14');
    dashSheet.getCell('B14').value = currentStock;
    dashSheet.getCell('B14').numFmt = '#,##0 "Eggs"';
    dashSheet.mergeCells('B15:G15');
    dashSheet.getCell('B15').value = 'Reconciled closing balance';

    // Stock Card 2: Price Metrics (Col H to M)
    dashSheet.mergeCells('H13:M13');
    dashSheet.getCell('H13').value = 'AVERAGE UNIT PRICING INDEX';
    dashSheet.mergeCells('H14:M14');
    dashSheet.getCell('H14').value = `Inward Cost: ₹${avgCostEgg.toFixed(2)} / Outward Price: ₹${avgSaleEgg.toFixed(2)}`;
    dashSheet.mergeCells('H15:M15');
    dashSheet.getCell('H15').value = `Unit Valuation Spread: ₹${Math.max(0, avgSaleEgg - avgCostEgg).toFixed(2)}`;

    // Style Stock cards
    const styleStockRange = (startCol: number, endCol: number, accentColor: string, bgColor: string) => {
      for (let r = 13; r <= 15; r++) {
        for (let c = startCol; c <= endCol; c++) {
          const cell = dashSheet.getCell(r, c);
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: bgColor }
          };
          cell.border = {
            top: r === 13 ? { style: 'medium', color: { argb: accentColor } } : { style: 'thin', color: { argb: 'E2E8F0' } },
            bottom: r === 15 ? { style: 'thin', color: { argb: 'CBD5E1' } } : { style: 'thin', color: { argb: 'E2E8F0' } },
            left: c === startCol ? { style: 'thin', color: { argb: 'CBD5E1' } } : { style: 'thin', color: { argb: 'E2E8F0' } },
            right: c === endCol ? { style: 'thin', color: { argb: 'CBD5E1' } } : { style: 'thin', color: { argb: 'E2E8F0' } }
          };
        }
      }

      const tCell = dashSheet.getCell(13, startCol);
      tCell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: '64748B' } };
      tCell.alignment = { horizontal: 'center', vertical: 'middle' };

      const vCell = dashSheet.getCell(14, startCol);
      vCell.font = { name: 'Segoe UI', size: 13, bold: true, color: { argb: '0F172A' } };
      vCell.alignment = { horizontal: 'center', vertical: 'middle' };

      const lCell = dashSheet.getCell(15, startCol);
      lCell.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: '475569' } };
      lCell.alignment = { horizontal: 'center', vertical: 'middle' };
    };

    styleStockRange(2, 7, '0F766E', 'F8FAFC');
    styleStockRange(8, 13, '6D28D9', 'F5F3FF');

    // Section 3 Header
    dashSheet.mergeCells('B17:M17');
    const secHeader3 = dashSheet.getCell('B17');
    secHeader3.value = '3. PERIODIC AUDIT LEDGER RECONCILIATION';
    secHeader3.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFF' } };
    secHeader3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0F766E' } };
    secHeader3.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

    // Audit Summary Table
    const auditHeaders = ['Key Performance Indicator', 'Quantity (Units)', 'Financial Value', 'Analytical Remarks / Notes'];
    dashSheet.addRow([]); // Blank spacing

    const auditGridStartRow = 19;
    const colRanges = [
      { start: 2, end: 5 },
      { start: 6, end: 7 },
      { start: 8, end: 9 },
      { start: 10, end: 13 }
    ];

    // Merge & write headers
    const aHeaderRow = dashSheet.getRow(auditGridStartRow);
    aHeaderRow.height = 24;
    colRanges.forEach((range, idx) => {
      dashSheet.mergeCells(auditGridStartRow, range.start, auditGridStartRow, range.end);
      const cell = dashSheet.getCell(auditGridStartRow, range.start);
      cell.value = auditHeaders[idx];
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '334155' } };
      cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    const auditRowsData = [
      ['Inward Egg Collections', totalInwardQty, totalInwardCost, 'Total volume collected from nesting operations'],
      ['Outward Egg Sales', totalOutwardQty, totalOutwardRevenue, 'Total revenue from bulk egg operations'],
      ['Unit Collection Cost', 1, avgCostEgg, 'Average production/gathering expense per egg unit'],
      ['Unit Selling Price', 1, avgSaleEgg, 'Average market pricing rate per egg unit'],
      ['Operational Expenses', null, totalExpenses, 'Administrative, transport, feed, or medicine vouchers'],
      ['Net Business Profit', null, netProfit, 'Final audited profit yield for the selected range']
    ];

    auditRowsData.forEach((rowVal, idx) => {
      const rowNum = auditGridStartRow + 1 + idx;
      const row = dashSheet.getRow(rowNum);
      row.height = 20;

      const isProfit = rowVal[0] === 'Net Business Profit';
      const isEven = idx % 2 === 0;

      colRanges.forEach((range, colIdx) => {
        dashSheet.mergeCells(rowNum, range.start, rowNum, range.end);
        const cell = dashSheet.getCell(rowNum, range.start);
        cell.value = rowVal[colIdx];
        
        cell.font = {
          name: 'Segoe UI',
          size: 10,
          bold: isProfit,
          color: isProfit ? (netProfit >= 0 ? { argb: '16A34A' } : { argb: 'DC2626' }) : { argb: '1E293B' }
        };

        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: isProfit
            ? (netProfit >= 0 ? { argb: 'E6F4EA' } : { argb: 'FCE8E6' })
            : (isEven ? { argb: 'F8FAFC' } : { argb: 'FFFFFF' })
        };

        cell.border = {
          top: { style: 'thin', color: { argb: 'E2E8F0' } },
          bottom: isProfit ? { style: 'medium', color: { argb: '0F766E' } } : { style: 'thin', color: { argb: 'E2E8F0' } },
          left: { style: 'thin', color: { argb: 'CBD5E1' } },
          right: { style: 'thin', color: { argb: 'CBD5E1' } }
        };

        if (colIdx === 0) {
          cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
        } else if (colIdx === 1) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          if (typeof cell.value === 'number') {
            cell.numFmt = '#,##0';
          }
        } else if (colIdx === 2) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          if (typeof cell.value === 'number') {
            cell.numFmt = '₹#,##0.00';
          }
        } else {
          cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
        }
      });
    });

    // ==========================================
    // SHEET 2: EGG COLLECTIONS (INWARD)
    // ==========================================
    const collSheet = workbook.addWorksheet('Egg Collections');
    const collHeaders = ['Ref Number', 'Collection Date', 'Quantity (Eggs)', 'Rate (₹)', 'Total Value (₹)', 'Created By'];
    const collRows = purchases.map((p) => [
      p.referenceNumber,
      dayjs(p.purchaseDate).format('YYYY-MM-DD HH:mm:ss'),
      p.quantity,
      p.ratePerUnit,
      p.totalAmount,
      p.createdBy?.name || 'System'
    ]);
    styleReportWorksheet(collSheet, 'Egg Collections', collHeaders, collRows);

    // ==========================================
    // SHEET 3: SALES RECORDS (OUTWARD)
    // ==========================================
    const salesSheet = workbook.addWorksheet('Sales Records');
    const salesHeaders = ['Invoice Number', 'Date', 'Buyer Name', 'Quantity (Eggs)', 'Rate (₹)', 'Total Sale (₹)', 'Created By'];
    const salesRows = sales.map((s) => [
      s.invoiceNumber,
      dayjs(s.salesDate).format('YYYY-MM-DD HH:mm:ss'),
      s.buyerName,
      s.quantity,
      s.unitSellingRate,
      s.totalSaleAmount,
      s.createdBy?.name || 'System'
    ]);
    styleReportWorksheet(salesSheet, 'Sales Records', salesHeaders, salesRows);

    // ==========================================
    // SHEET 4: EXPENSES LEDGER
    // ==========================================
    const expSheet = workbook.addWorksheet('Expenses Ledger');
    const expHeaders = ['Voucher No', 'Date', 'Category', 'Subcategory', 'Amount (₹)', 'Spent For', 'Bill Number', 'Created By'];
    const expRows = expenses.map((e) => [
      e.voucherNumber,
      dayjs(e.expenseDate).format('YYYY-MM-DD HH:mm:ss'),
      e.category,
      e.subcategory || 'N/A',
      e.amount,
      e.spentFor,
      e.billNumber || 'N/A',
      e.createdBy?.name || 'System'
    ]);
    styleReportWorksheet(expSheet, 'Expenses Ledger', expHeaders, expRows);

    // ==========================================
    // SHEET 5: STOCK LEDGER
    // ==========================================
    const stockSheet = workbook.addWorksheet('Stock Ledger');
    const stockHeaders = ['Ledger Date', 'Entry Type', 'Reference No', 'In Quantity', 'Out Quantity', 'Closing Stock (Eggs)', 'Notes', 'Created By'];
    const stockRows = stockLedger.map((l) => [
      dayjs(l.date).format('YYYY-MM-DD HH:mm:ss'),
      l.entryType === 'PURCHASE' ? 'COLLECTION' : l.entryType,
      l.referenceNumber,
      l.inQuantity,
      l.outQuantity,
      l.closingStock,
      l.notes || '',
      l.createdBy?.name || 'System'
    ]);
    styleReportWorksheet(stockSheet, 'Stock Ledger', stockHeaders, stockRows);

    // Set headers and send file
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Comprehensive_CA_Audit_Report_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  }

  /**
   * Generates and sends a CSV string.
   */
  static exportToCSV(
    reportName: string,
    headers: string[],
    rows: any[][],
    res: Response
  ): void {
    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return '';
      let str = typeof val === 'object' ? JSON.stringify(val) : String(val);
      str = str.replace(/"/g, '""');
      if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        str = `"${str}"`;
      }
      return str;
    };

    let csvContent = headers.map(escapeCSV).join(',') + '\n';

    rows.forEach((row) => {
      csvContent += row.map(escapeCSV).join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${reportName}_${dayjs().format('YYYYMMDD')}.csv`
    );
    res.status(200).send(csvContent);
  }
}
export default ExportService;
