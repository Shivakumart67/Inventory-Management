import ExcelJS from 'exceljs';
import { Response } from 'express';
import dayjs from 'dayjs';

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

    // Style the title row
    worksheet.addRow([`Report: ${reportName.toUpperCase()}`]);
    worksheet.addRow([`Generated on: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`]);
    worksheet.addRow([]); // empty spacing row

    // Add Headers row
    const headerRow = worksheet.addRow(headers);
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
    });

    // Add Data rows
    rows.forEach((row) => {
      worksheet.addRow(row);
    });

    // Adjust column widths based on content
    worksheet.columns.forEach((column) => {
      let maxLength = 0;
      column.eachCell?.({ includeEmpty: true }, (cell) => {
        const cellLength = cell.value ? cell.value.toString().length : 0;
        if (cellLength > maxLength) {
          maxLength = cellLength;
        }
      });
      column.width = Math.max(maxLength + 4, 12);
    });

    // Setup headers
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
   * Generates and sends a CSV string.
   */
  static exportToCSV(
    reportName: string,
    headers: string[],
    rows: any[][],
    res: Response
  ): void {
    // Escape double quotes and commas for CSV compatibility
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
