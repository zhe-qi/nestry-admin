import { Response } from 'express';
import ExcelJS from 'exceljs';

export async function exportTable(
  data: any[][],
  res: Response,
  options: {
    header: any[]
    dictMap?: any
    sheetName?: string
  } = {
    header: [],
    dictMap: {},
    sheetName: 'Sheet1',
  },
) {
  const workbook = new ExcelJS.Workbook();
  const sheetName = options.sheetName;

  const worksheet = workbook.addWorksheet(sheetName);

  if (options.header.length) {
    worksheet.columns = options.header.map((column) => {
      const width = column.width;
      return {
        header: column.title,
        key: column.dataIndex,
        width: Number.isNaN(width) ? 16 : width,
      };
    });

    // 定义表头样式
    const headerStyle: Partial<ExcelJS.Style> = {
      font: {
        size: 10,
        bold: true,
        color: { argb: 'ffffff' },
      },
      alignment: { vertical: 'middle', horizontal: 'center' },
      fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '808080' },
      },
      border: {
        top: { style: 'thin', color: { argb: '9e9e9e' } },
        left: { style: 'thin', color: { argb: '9e9e9e' } },
        bottom: { style: 'thin', color: { argb: '9e9e9e' } },
        right: { style: 'thin', color: { argb: '9e9e9e' } },
      },
    };

    const headerRow = worksheet.getRow(1);

    headerRow.eachCell((cell) => {
      cell.style = headerStyle;
    });
  }

  data.forEach((item) => {
    worksheet.addRow(item);
  });

  worksheet.columns.forEach((column) => {
    column.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  const buffer = await workbook.xlsx.writeBuffer();
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment;filename=sheet.xlsx');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  res.end(buffer, 'binary');
}
